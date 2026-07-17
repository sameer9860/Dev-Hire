# pyrefly: ignore [missing-import]
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate(self, attrs):
        identifier = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')

        if not identifier:
            raise serializers.ValidationError({
                'username': 'This field is required.',
                'email': 'This field is required.'
            })

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

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match.")
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