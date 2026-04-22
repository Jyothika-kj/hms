from rest_framework import serializers
from .models import Consultation, Prescription

class PrescriptionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='medicine.name')
    medicine_unit_price = serializers.ReadOnlyField(source='medicine.price')
    patient_id = serializers.ReadOnlyField(source='consultation.patient.id')
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.ReadOnlyField(source='consultation.doctor.username')

    class Meta:
        model = Prescription
        fields = '__all__'

    def get_patient_name(self, obj):
        p = obj.consultation.patient
        return f"{p.first_name} {p.last_name}"

class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.ReadOnlyField(source='doctor.username')
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    class Meta:
        model = Consultation
        fields = '__all__'
        read_only_fields = ('doctor',)
