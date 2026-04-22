from django.contrib import admin
from .models import Patient, Appointment, Bill

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'contact_number')
    search_fields = ('first_name', 'last_name', 'contact_number')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'appointment_date', 'start_time', 'token_number', 'status')
    list_filter = ('status', 'appointment_date', 'doctor')
    search_fields = ('patient__first_name', 'patient__last_name', 'doctor__username')

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'amount', 'is_paid', 'created_at')
    list_filter = ('is_paid',)
