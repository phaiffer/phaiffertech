package com.phaiffertech.platform.core.inventory.domain;

public enum InventoryMovementSource {
    MANUAL,
    PET_RETAIL_SALE,
    PET_CLINIC_CONSUMPTION,
    PET_APPOINTMENT_SERVICE_CONSUMPTION,
    PET_PRODUCT_SYNC,
    // Historical IoT source values remain because persisted inventory movements may still reference them.
    IOT_MAINTENANCE_CONSUMPTION,
    IOT_PART_REPLACEMENT,
    IOT_PART_SYNC
}
