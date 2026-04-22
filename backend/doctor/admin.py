from django.contrib import admin
from .models import Consultation, Prescription

@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'date')
    list_filter = ('doctor', 'date')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__username')

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('consultation', 'medicine', 'frequency', 'duration_days')
    search_fields = ('consultation__patient__first_name', 'consultation__patient__last_name', 'medicine__name')
