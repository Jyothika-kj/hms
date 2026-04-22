from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Specialization, DoctorProfile, DoctorAvailabilityOverride
from .serializers import SpecializationSerializer, UserSerializer, DoctorProfileSerializer, DoctorAvailabilityOverrideSerializer
from accounts.permissions import HasGroupPermission
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
import datetime
from django.db import transaction
from django.contrib.auth.models import Group

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [HasGroupPermission]
    required_groups = {
        'GET': ['Admin', 'Receptionist'],
        'POST': ['Admin'],
        'PUT': ['Admin'],
        'PATCH': ['Admin'],
        'DELETE': ['Admin'],
    }
    serializer_class = UserSerializer

    def get_queryset(self):
        # Admin should not see other Admins or Superusers in the staff list
        return User.objects.exclude(is_superuser=True).exclude(groups__name='Admin').select_related('doctor_profile')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get('email', '')
        if email and User.objects.filter(email=email).exists():
            return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        groups = request.data.get('groups', [])
        
        if 'Doctor' in groups:
            spec_id = request.data.get('specialization')
            if not spec_id:
                return Response({'error': 'Specialization field is required to register a clinical provider.'}, status=status.HTTP_400_BAD_REQUEST)
            if not Specialization.objects.filter(id=spec_id).exists():
                return Response({'error': 'Invalid specialization selected.'}, status=status.HTTP_400_BAD_REQUEST)
                
        try:
            with transaction.atomic():
                # Create the user
                user = User.objects.create_user(
                    username=serializer.validated_data['username'],
                    password=serializer.validated_data['password'],
                    email=email,
                    first_name=serializer.validated_data.get('first_name', ''),
                    last_name=serializer.validated_data.get('last_name', ''),
                )
                
                # Assign groups
                for group_name in groups:
                    group, _ = Group.objects.get_or_create(name=group_name)
                    user.groups.add(group)
                
                # Simplified Clinical Scheduling (Phase 11 Reset)
                if 'Doctor' in groups:
                    spec_id = request.data.get('specialization')
                    fee = request.data.get('consultation_fee', 50.00)
                    
                    # Default hours and working days provided by frontend
                    start_t = request.data.get('available_start_time', '09:00')
                    end_t = request.data.get('available_end_time', '17:00')
                    days = request.data.get('working_days', 'MON,TUE,WED,THU,FRI')
                    
                    # Create the Doctor Profile (Consolidated clinical data)
                    DoctorProfile.objects.create(
                        doctor=user,
                        specialization_id=spec_id,
                        base_consultation_fee=fee,
                        available_start_time=start_t,
                        available_end_time=end_t,
                        working_days=days
                    )
                
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Calculates effective availability: Override > Profile Defaults."""
        user = self.get_object()
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Date parameter is required (YYYY-MM-DD)"}, status=400)
        
        try:
            target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

        # 1. Priority: Overrides (Specific date takes absolute priority)
        override = DoctorAvailabilityOverride.objects.filter(doctor=user, date=target_date).first()
        if override:
            return Response({
                "source": "override",
                "is_available": override.is_available,
                "start_time": override.start_time,
                "end_time": override.end_time
            })

        # 2. Fallback: DoctorProfile Defaults
        if hasattr(user, 'doctor_profile'):
            profile = user.doctor_profile
            day_map = {0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN'}
            target_day = day_map[target_date.weekday()]
            
            # Check if this day is in the working_days list
            working_days_list = [d.strip() for d in profile.working_days.split(',')]
            
            if target_day in working_days_list:
                return Response({
                    "source": "default",
                    "is_available": True,
                    "start_time": profile.available_start_time,
                    "end_time": profile.available_end_time
                })
        
        return Response({
            "source": "none",
            "is_available": False,
            "start_time": None,
            "end_time": None
        })

class SpecializationViewSet(viewsets.ModelViewSet):
    queryset = Specialization.objects.all()
    serializer_class = SpecializationSerializer
    permission_classes = [HasGroupPermission]
    required_groups = {
        'GET': ['Admin', 'Receptionist'],
        'POST': ['Admin'],
        'PUT': ['Admin'],
        'PATCH': ['Admin'],
        'DELETE': ['Admin'],
    }

class DoctorAvailabilityOverrideViewSet(viewsets.ModelViewSet):
    queryset = DoctorAvailabilityOverride.objects.all()
    serializer_class = DoctorAvailabilityOverrideSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Admin']
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['doctor', 'date']
