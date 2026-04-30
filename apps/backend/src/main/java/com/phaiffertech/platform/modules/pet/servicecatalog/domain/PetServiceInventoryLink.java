package com.phaiffertech.platform.modules.pet.servicecatalog.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "pet_service_inventory_links")
public class PetServiceInventoryLink extends BaseTenantEntity {

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "inventory_item_id", nullable = false)
    private UUID inventoryItemId;

    @Column(name = "expected_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal expectedQuantity = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "consumption_rule", nullable = false, length = 40)
    private PetServiceInventoryConsumptionRule consumptionRule = PetServiceInventoryConsumptionRule.FIXED_PER_SERVICE;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public UUID getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(UUID inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public BigDecimal getExpectedQuantity() {
        return expectedQuantity;
    }

    public void setExpectedQuantity(BigDecimal expectedQuantity) {
        this.expectedQuantity = expectedQuantity;
    }

    public PetServiceInventoryConsumptionRule getConsumptionRule() {
        return consumptionRule;
    }

    public void setConsumptionRule(PetServiceInventoryConsumptionRule consumptionRule) {
        this.consumptionRule = consumptionRule;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
