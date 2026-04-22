from django.db import models
from django.conf import settings
from datetime import date

class Patient(models.Model):
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    ]
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    contact_number = models.CharField(max_length=10)
    address = models.TextField()
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES)

    @property
    def age(self):
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
        return None

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        limit_choices_to={'groups__name': 'Doctor'}, 
        related_name='appointments'
    )
    appointment_date = models.DateField()
    start_time = models.TimeField()
    token_number = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=20, 
        choices=[('Scheduled', 'Scheduled'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled')], 
        default='Scheduled'
    )
    
    class Meta:
        ordering = ['appointment_date', 'start_time']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        if is_new and not self.token_number:
            # Generate auto-incrementing daily token
            today_appointments = Appointment.objects.filter(
                doctor=self.doctor, 
                appointment_date=self.appointment_date
            ).count()
            self.token_number = today_appointments + 1
            
        super().save(*args, **kwargs)
        
        # Auto-generate bill on creation based on doctor's clinical profile fee
        if is_new:
            # Fetch fee from the new DoctorProfile
            fee = 50.00 # Default
            if hasattr(self.doctor, 'doctor_profile'):
                fee = self.doctor.doctor_profile.base_consultation_fee
            
            Bill.objects.create(appointment=self, amount=fee)
            
    def __str__(self):
        return f"Apt {self.token_number}: {self.patient.first_name} with Dr. {self.doctor.username} on {self.appointment_date}"

class Bill(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='bill')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bill for {self.appointment.patient} - {'Paid' if self.is_paid else 'Unpaid'}"
