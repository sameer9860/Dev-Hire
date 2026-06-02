# pyrefly: ignore [missing-import]
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model

User = get_user_model()

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