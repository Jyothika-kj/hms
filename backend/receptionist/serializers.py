from rest_framework import serializers
from datetime import date
from .models import Patient, Appointment, Bill

class PatientSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = '__all__'

    def validate_contact_number(self, value):
        if not value or not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Contact number must be exactly 10 digits.")
        return value

    def validate_date_of_birth(self, value):
        if value:
            today = date.today()
            if value > today:
                raise serializers.ValidationError("Date of birth cannot be in the future.")
            if value.year < today.year - 150:
                raise serializers.ValidationError("Date of birth cannot be more than 150 years in the past.")
        return value

class BillSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='appointment.patient.first_name')
    
    class Meta:
        model = Bill
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.ReadOnlyField(source='doctor.username')
    patient_details = PatientSerializer(source='patient', read_only=True)
    bill = BillSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('token_number',)

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def validate(self, data):
        doctor = data.get('doctor')
        appointment_date = data.get('appointment_date')
        start_time = data.get('start_time')
        patient = data.get('patient')
        
        # Get current instance id for update exclusion
        instance_id = self.instance.id if self.instance else None
        
        # Only validate on create or if these fields are being updated
        if doctor and appointment_date and start_time:
            from admin_dashboard.models import DoctorAvailabilityOverride
            # 1. Check override
            override = DoctorAvailabilityOverride.objects.filter(doctor=doctor, date=appointment_date).first()
            if override:
                if not override.is_available:
                    raise serializers.ValidationError("Doctor is not available on this date.")
                if override.start_time and override.end_time:
                    if not (override.start_time <= start_time <= override.end_time):
                        raise serializers.ValidationError(f"Appointment outside doctor's override duty range ({override.start_time} - {override.end_time}).")
            else:
                # 2. Check profile defaults
                if hasattr(doctor, 'doctor_profile'):
                    profile = doctor.doctor_profile
                    day_map = {0: 'MON', 1: 'TUE', 2: 'WED', 3: 'THU', 4: 'FRI', 5: 'SAT', 6: 'SUN'}
                    target_day = day_map[appointment_date.weekday()]
                    working_days_list = [d.strip() for d in profile.working_days.split(',')]
                    
                    if target_day not in working_days_list:
                        raise serializers.ValidationError("Doctor does not work on this day of the week.")
                    
                    if not (profile.available_start_time <= start_time <= profile.available_end_time):
                        raise serializers.ValidationError(f"Appointment outside doctor's normal duty range ({profile.available_start_time} - {profile.available_end_time}).")

            # 3. Slot conflict: only block if a Scheduled appointment exists for this doctor/date/time
            slot_conflict = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment_date,
                start_time=start_time,
                status='Scheduled'
            ).exclude(id=instance_id)
            if slot_conflict.exists():
                raise serializers.ValidationError("This time slot is already booked for this doctor.")

        # 4. Block same patient booking to same doctor on the same day
        if patient and doctor and appointment_date:
            duplicate = Appointment.objects.filter(
                patient=patient,
                doctor=doctor,
                appointment_date=appointment_date,
                status='Scheduled'
            ).exclude(id=instance_id)
            if duplicate.exists():
                raise serializers.ValidationError("This patient already has an active appointment with this doctor on this date.")
        
        return data
