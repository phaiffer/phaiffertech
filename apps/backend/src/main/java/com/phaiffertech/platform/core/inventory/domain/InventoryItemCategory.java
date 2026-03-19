package com.phaiffertech.platform.core.inventory.domain;

public enum InventoryItemCategory {
    PET_RETAIL_GOOD,
    PET_VETERINARY_SUPPLY,
    IOT_SPARE_PART,
    IOT_CONSUMABLE;

    public boolean isPetCategory() {
        return this == PET_RETAIL_GOOD || this == PET_VETERINARY_SUPPLY;
    }

    public boolean isIotCategory() {
        return this == IOT_SPARE_PART || this == IOT_CONSUMABLE;
    }
}
