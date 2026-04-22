from rest_framework import serializers
from .models import Medicine, PharmacyBill

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = '__all__'

class PharmacyBillSerializer(serializers.ModelSerializer):
    patient_id = serializers.ReadOnlyField(source='prescription.consultation.patient.id')
    patient_name = serializers.ReadOnlyField(source='prescription.consultation.patient.first_name')
    patient_full_name = serializers.SerializerMethodField()
    medicine_name = serializers.ReadOnlyField(source='prescription.medicine.name')
    consultation_id = serializers.ReadOnlyField(source='prescription.consultation.id')
    price_per_unit = serializers.ReadOnlyField(source='prescription.medicine.price')
    doctor_name = serializers.ReadOnlyField(source='prescription.consultation.doctor.username')

    class Meta:
        model = PharmacyBill
        fields = '__all__'

    def get_patient_full_name(self, obj):
        p = obj.prescription.consultation.patient
        return f"{p.first_name} {p.last_name}"
