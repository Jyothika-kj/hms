from django.contrib import admin
from .models import Specialization, DoctorProfile, DoctorAvailabilityOverride

@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'specialization', 'base_consultation_fee', 'available_start_time', 'available_end_time')

@admin.register(DoctorAvailabilityOverride)
class DoctorAvailabilityOverrideAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'date', 'start_time', 'end_time', 'is_available')
    list_filter = ('date', 'is_available')
