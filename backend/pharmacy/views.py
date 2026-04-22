from rest_framework import viewsets
from .models import Medicine, PharmacyBill
from .serializers import MedicineSerializer, PharmacyBillSerializer
from accounts.permissions import HasGroupPermission

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [HasGroupPermission]
    # Allow Pharmacist to manage, Doctor and Receptionist to at least view if needed
    # But sticking to strict required_groups:
    required_groups = {
        'GET': ['Pharmacist', 'Doctor'],
        'POST': ['Pharmacist'],
        'PUT': ['Pharmacist'],
        'PATCH': ['Pharmacist'],
        'DELETE': ['Pharmacist'],
    }

class PharmacyBillViewSet(viewsets.ModelViewSet):
    queryset = PharmacyBill.objects.all()
    serializer_class = PharmacyBillSerializer
    permission_classes = [HasGroupPermission]
    required_groups = ['Pharmacist']
