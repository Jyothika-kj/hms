from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecializationViewSet, UserViewSet, DoctorAvailabilityOverrideViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'specializations', SpecializationViewSet, basename='specialization')
router.register(r'overrides', DoctorAvailabilityOverrideViewSet, basename='override')

urlpatterns = [
    path('', include(router.urls)),
]
