from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet, PharmacyBillViewSet

router = DefaultRouter()
router.register(r'inventory', MedicineViewSet, basename='medicine')
router.register(r'bills', PharmacyBillViewSet, basename='pharmacybill')

urlpatterns = [
    path('', include(router.urls)),
]
