from django.db import models
from django.conf import settings

class Specialization(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class DoctorProfile(models.Model):
    doctor = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        limit_choices_to={'groups__name': 'Doctor'},
        related_name='doctor_profile'
    )
    specialization = models.ForeignKey(Specialization, on_delete=models.SET_NULL, null=True, related_name='doctor_profiles')
    base_consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    
    # Simplified Clinical Scheduling (Same for all working days)
    available_start_time = models.TimeField(default="09:00")
    available_end_time = models.TimeField(default="17:00")
    working_days = models.CharField(
        max_length=100, 
        default="MON,TUE,WED,THU,FRI",
        help_text="Comma-separated days of the week (e.g. MON,TUE,WED)"
    )

    def __str__(self):
        return f"Profile: {self.doctor.username}"

class DoctorAvailabilityOverride(models.Model):
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        limit_choices_to={'groups__name': 'Doctor'}, 
        related_name='availability_overrides'
    )
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Doctor Availability Overrides"
        unique_together = ('doctor', 'date')

    def __str__(self):
        status = "Available" if self.is_available else "Off"
        return f"{self.doctor.username} - {self.date} ({status})"
