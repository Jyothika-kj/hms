from django.db import models

class Medicine(models.Model):
    UNIT_CHOICES = (
        ('mg', 'mg'),
        ('ml', 'ml'),
    )
    name = models.CharField(max_length=255, unique=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=10, help_text="Minimum stock needed before warning")
    unit = models.CharField(max_length=50, choices=UNIT_CHOICES, default='mg', help_text="e.g., mg, ml")
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} ({self.unit})"

class PharmacyBill(models.Model):
    # Uses a string reference to avoid circular imports since Prescription is in the doctor app
    prescription = models.OneToOneField('doctor.Prescription', on_delete=models.CASCADE, related_name='pharmacy_bill')
    quantity_dispensed = models.PositiveIntegerField(default=1)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True)
    is_paid = models.BooleanField(default=False)
    dispensed_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        from django.db import transaction
        is_new = self._state.adding
        
        if is_new:
            with transaction.atomic():
                medicine = self.prescription.medicine
                if medicine.stock_quantity < self.quantity_dispensed:
                    raise Exception(f"Insufficient stock for {medicine.name}. Available: {medicine.stock_quantity}")
                
                # Deduct stock
                medicine.stock_quantity -= self.quantity_dispensed
                medicine.save(update_fields=['stock_quantity'])
                
                # Calculate total amount
                if not self.total_amount:
                    self.total_amount = medicine.price * self.quantity_dispensed
                
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        try:
            patient = self.prescription.consultation.patient
            return f"Pharmacy Bill for {patient} - ${self.total_amount}"
        except Exception:
            return f"Pharmacy Bill - ${self.total_amount}"
