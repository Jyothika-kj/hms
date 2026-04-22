from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import MethodNotAllowed
from .models import Consultation, Prescription
from .serializers import ConsultationSerializer, PrescriptionSerializer
from accounts.permissions import HasGroupPermission
from receptionist.models import Patient
from receptionist.serializers import PatientSerializer

class PatientSearchViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Doctor']
    filter_backends = [filters.SearchFilter]
    search_fields = ['id', 'first_name', 'last_name', 'contact_number']
    
    def get_queryset(self):
        return Patient.objects.all()

class ImmutableModelViewSet(viewsets.ModelViewSet):
    """
    A viewset that disables update and delete operations.
    Once created, the record is read-only.
    """
    http_method_names = ['get', 'post', 'head', 'options']

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PUT')

    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PATCH')
        
    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed('DELETE')

class ConsultationViewSet(ImmutableModelViewSet):
    serializer_class = ConsultationSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Doctor']
    filter_backends = [filters.SearchFilter]
    search_fields = ['patient__first_name', 'patient__last_name']

    def get_queryset(self):
        # Strict endpoint filter: Doctors only see their own consultations
        if self.request.user.groups.filter(name='Doctor').exists():
            return Consultation.objects.filter(doctor=self.request.user).select_related(
                'patient', 'doctor'
            ).prefetch_related('prescriptions__medicine').order_by('-date')
        # Admin might need to see all, but for now we enforce the Doctor constraint
        if self.request.user.is_superuser:
            return Consultation.objects.all().select_related(
                'patient', 'doctor'
            ).prefetch_related('prescriptions__medicine').order_by('-date')
        return Consultation.objects.none()

    @action(detail=False, methods=['get'], url_path='patient_history')
    def patient_history(self, request):
        """
        Returns all consultations for a specific patient, with nested prescriptions.
        Usage: GET /doctor/consultations/patient_history/?patient_id=123
        """
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response(
                {"error": "patient_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(patient_id=patient_id).order_by('-date')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        appointment = serializer.validated_data.get('appointment')
        if appointment and Consultation.objects.filter(appointment=appointment).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"appointment": "A consultation already exists for this appointment."})
        
        # Auto-assign the logged-in doctor
        consultation = serializer.save(doctor=self.request.user)
        
        # Mark the appointment as Completed (frees the slot)
        if consultation.appointment:
            consultation.appointment.status = 'Completed'
            consultation.appointment.save(update_fields=['status'])

class PrescriptionViewSet(ImmutableModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Doctor', 'Pharmacist']

    def get_queryset(self):
        if self.request.user.groups.filter(name='Doctor').exists():
            return Prescription.objects.filter(
                consultation__doctor=self.request.user
            ).select_related('medicine', 'consultation__patient', 'consultation__doctor')
        if self.request.user.groups.filter(name='Pharmacist').exists():
            return Prescription.objects.all().select_related(
                'medicine', 'consultation__patient', 'consultation__doctor'
            )
        if self.request.user.is_superuser:
            return Prescription.objects.all()
        return Prescription.objects.none()
