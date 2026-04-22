from rest_framework import serializers
from .models import Specialization, DoctorProfile, DoctorAvailabilityOverride
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

class SpecializationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialization
        fields = '__all__'

class DoctorProfileSerializer(serializers.ModelSerializer):
    specialization_name = serializers.ReadOnlyField(source='specialization.name')
    
    class Meta:
        model = DoctorProfile
        fields = '__all__'

class DoctorAvailabilityOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorAvailabilityOverride
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        slug_field='name',
        queryset=Group.objects.all()
    )
    # Nested clinical metadata
    doctor_profile = DoctorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'first_name', 'last_name', 'email', 'groups', 'doctor_profile')
        extra_kwargs = {
            'password': {'write_only': True}
        }
