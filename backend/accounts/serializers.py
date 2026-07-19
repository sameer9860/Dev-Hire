# pyrefly: ignore [missing-import]
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField(required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Parent TokenObtainSerializer re-adds username as required in __init__.
        self.fields['username'].required = False
        self.fields['username'].allow_blank = True
        self.fields['email'] = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs):
        identifier = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')

        if not identifier:
            raise serializers.ValidationError({
                'username': 'This field is required.',
                'email': 'This field is required.'
            })

        if isinstance(identifier, str) and any(ch.isspace() for ch in identifier):
            raise serializers.ValidationError({'detail': 'Username/email cannot contain spaces.'})
        if isinstance(password, str) and any(ch.isspace() for ch in password):
            raise serializers.ValidationError({'detail': 'Password cannot contain spaces.'})

        user = User.objects.filter(email__iexact=identifier).first()
        if user is None:
            user = User.objects.filter(username=identifier).first()

        if user is None or not user.check_password(password):
            raise serializers.ValidationError({'detail': 'No active account found with the given credentials'})

        attrs['username'] = user.username
        return super().validate(attrs)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role',
                  'company_name', 'company_website']

    def _reject_spaces(self, value, field_name):
        if value is None:
            return value
        if isinstance(value, str) and any(ch.isspace() for ch in value):
            raise serializers.ValidationError({field_name: f'{field_name.replace("_", " ").capitalize()} cannot contain spaces.'})
        return value

    def validate_username(self, value):
        return self._reject_spaces(value, 'username')

    def validate_email(self, value):
        value = self._reject_spaces(value, 'email')
        role = self.initial_data.get('role')
        if role == 'company':
            from .company_email import is_company_email
            if not is_company_email(value):
                raise serializers.ValidationError(
                    'Companies must register with a valid company email (not Gmail, Yahoo, Outlook, etc.).'
                )
        from .availability import email_taken
        if email_taken(value):
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate_password(self, value):
        value = self._reject_spaces(value, 'password')
        return value

    def validate_password2(self, value):
        return self._reject_spaces(value, 'password2')

    def validate_company_name(self, value):
        value = self._reject_spaces(value, 'company_name')
        if value:
            from .availability import company_name_taken
            if company_name_taken(value):
                raise serializers.ValidationError('This company name is already taken.')
        return value

    def validate_company_website(self, value):
        value = self._reject_spaces(value, 'company_website')
        if value:
            from .availability import company_website_taken, normalize_website
            if not normalize_website(value):
                raise serializers.ValidationError('Enter a valid company website.')
            if company_website_taken(value):
                raise serializers.ValidationError('This company website is already registered.')
            if '://' not in value:
                value = f'https://{value}'
        return value
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': "Passwords don't match."})

        from .password_rules import validate_strong_password
        # pyrefly: ignore [missing-import]
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_strong_password(data['password'], username=data.get('username'))
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)}) from exc

        if data.get('role') == 'company' and not data.get('company_name'):
            raise serializers.ValidationError({'company_name': 'Company name is required.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'bio', 'avatar_url',
                  'company_name', 'company_website', 'company_size',
                  'resume_url', 'skills', 'github_url', 'portfolio_url']
        read_only_fields = ['id']


class DeveloperProfileSerializer(serializers.ModelSerializer):
    """Serializer for developer profile updates — only developer-relevant fields."""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'bio', 'avatar_url',
            'skills', 'github_url', 'portfolio_url', 'resume_url',
        ]
        read_only_fields = ['id', 'username', 'email', 'role']


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for company profile updates — only company-relevant fields."""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'bio', 'avatar_url',
            'company_name', 'company_website', 'company_size',
        ]
        read_only_fields = ['id', 'username', 'email', 'role']

    def validate_company_name(self, value):
        if value:
            value = value.strip()
            user = self.context['request'].user
            if User.objects.filter(role='company', company_name__iexact=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError('This company name is already taken.')
        return value

    def validate_company_website(self, value):
        if value:
            value = value.strip()
            if any(ch.isspace() for ch in value):
                raise serializers.ValidationError('Company website cannot contain spaces.')
            from .availability import normalize_website
            if not normalize_website(value):
                raise serializers.ValidationError('Enter a valid company website.')
            if '://' not in value:
                value = f'https://{value}'
            
            user = self.context['request'].user
            target = normalize_website(value)
            
            for existing in User.objects.filter(role='company').exclude(pk=user.pk).exclude(company_website=''):
                if normalize_website(existing.company_website) == target:
                    raise serializers.ValidationError('This company website is already registered.')
        return value


class PublicProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for public profile view — no sensitive fields."""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'role', 'bio', 'avatar_url',
            # Developer fields
            'skills', 'github_url', 'portfolio_url',
            # Company fields
            'company_name', 'company_website', 'company_size',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': "Passwords don't match."})

        if any(ch.isspace() for ch in data['new_password']):
            raise serializers.ValidationError({'new_password': 'Password cannot contain spaces.'})

        from .password_rules import validate_strong_password
        # pyrefly: ignore [missing-import]
        from django.core.exceptions import ValidationError as DjangoValidationError
        user = self.context['request'].user
        try:
            validate_strong_password(data['new_password'], username=user.username)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'new_password': list(exc.messages)}) from exc

        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Password is incorrect.')
        return value