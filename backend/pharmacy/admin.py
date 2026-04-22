from django.contrib import admin
from .models import Medicine, PharmacyBill

@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ('name', 'stock_quantity', 'unit', 'price')
    search_fields = ('name',)

@admin.register(PharmacyBill)
class PharmacyBillAdmin(admin.ModelAdmin):
    list_display = ('prescription', 'quantity_dispensed', 'total_amount', 'is_paid', 'dispensed_at')
    list_filter = ('is_paid', 'dispensed_at')
    search_fields = ('prescription__consultation__patient__first_name', 'prescription__consultation__patient__last_name')
