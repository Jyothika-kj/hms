from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Patient, Appointment, Bill
from .serializers import PatientSerializer, AppointmentSerializer, BillSerializer
from accounts.permissions import HasGroupPermission

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Receptionist', 'Doctor']
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name']

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Receptionist', 'Doctor']
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['doctor', 'appointment_date', 'status']

    def get_queryset(self):
        user = self.request.user
        # Doctors only see their own appointments
        if user.groups.filter(name='Doctor').exists() and not user.is_superuser:
            return Appointment.objects.filter(doctor=user).select_related('patient', 'doctor').order_by('appointment_date', 'start_time')
        return Appointment.objects.all().select_related('patient', 'doctor').order_by('-appointment_date', 'start_time')

class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all().select_related('appointment__patient')
    serializer_class = BillSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Receptionist', 'Pharmacist']
