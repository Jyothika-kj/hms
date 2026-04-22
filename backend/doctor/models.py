from django.db import models
from django.conf import settings
from receptionist.models import Patient
from pharmacy.models import Medicine

class Consultation(models.Model):
    # To ensure there can't be multiple consults for the same appointment:
    appointment = models.OneToOneField('receptionist.Appointment', on_delete=models.CASCADE, related_name='consultation', null=True, blank=True)
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        limit_choices_to={'groups__name': 'Doctor'},
        related_name='consultations'
    )
    date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField()

    def __str__(self):
        return f"Consultation: {self.patient} with Dr. {self.doctor.username} on {self.date.date()}"

class Prescription(models.Model):
    consultation = models.ForeignKey(Consultation, on_delete=models.CASCADE, related_name='prescriptions')
    medicine = models.ForeignKey(Medicine, on_delete=models.RESTRICT)
    frequency = models.CharField(max_length=5, default='1-0-1')
    duration_days = models.IntegerField(default=1)
    instructions = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('consultation', 'medicine')

    def __str__(self):
        return f"Rx: {self.medicine.name} for {self.consultation.patient}"
