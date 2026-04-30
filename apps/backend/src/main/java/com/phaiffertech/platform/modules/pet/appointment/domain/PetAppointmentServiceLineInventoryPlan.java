package com.phaiffertech.platform.modules.pet.appointment.domain;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryConsumptionRule;
import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pet_appointment_service_inventory")
public class PetAppointmentServiceLineInventoryPlan extends BaseTenantEntity {

    @Column(name = "appointment_service_id", nullable = false)
    private UUID appointmentServiceId;

    @Column(name = "inventory_item_id", nullable = false)
    private UUID inventoryItemId;

    @Column(name = "inventory_item_name", nullable = false, length = 150)
    private String inventoryItemName;

    @Column(name = "inventory_item_sku", nullable = false, length = 80)
    private String inventoryItemSku;

    @Column(name = "inventory_category", nullable = false, length = 60)
    private String inventoryCategory;

    @Column(name = "unit_of_measure", nullable = false, length = 40)
    private String unitOfMeasure = "UNIT";

    @Column(name = "expected_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal expectedQuantity = BigDecimal.ONE;

    @Enumerated(EnumType.STRING)
    @Column(name = "consumption_rule", nullable = false, length = 40)
    private PetServiceInventoryConsumptionRule consumptionRule = PetServiceInventoryConsumptionRule.FIXED_PER_SERVICE;

    @Column(name = "actual_quantity", precision = 10, scale = 2)
    private BigDecimal actualQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "consumption_status", nullable = false, length = 40)
    private PetAppointmentInventoryConsumptionStatus consumptionStatus = PetAppointmentInventoryConsumptionStatus.PLANNED;

    @Column(name = "applied_inventory_movement_id")
    private UUID appliedInventoryMovementId;

    @Column(name = "stock_applied_at")
    private Instant stockAppliedAt;

    @Column(name = "stock_applied_by", length = 64)
    private String stockAppliedBy;

    public UUID getAppointmentServiceId() {
        return appointmentServiceId;
    }

    public void setAppointmentServiceId(UUID appointmentServiceId) {
        this.appointmentServiceId = appointmentServiceId;
    }

    public UUID getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(UUID inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public String getInventoryItemName() {
        return inventoryItemName;
    }

    public void setInventoryItemName(String inventoryItemName) {
        this.inventoryItemName = inventoryItemName;
    }

    public String getInventoryItemSku() {
        return inventoryItemSku;
    }

    public void setInventoryItemSku(String inventoryItemSku) {
        this.inventoryItemSku = inventoryItemSku;
    }

    public String getInventoryCategory() {
        return inventoryCategory;
    }

    public void setInventoryCategory(String inventoryCategory) {
        this.inventoryCategory = inventoryCategory;
    }

    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
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

    public BigDecimal getActualQuantity() {
        return actualQuantity;
    }

    public void setActualQuantity(BigDecimal actualQuantity) {
        this.actualQuantity = actualQuantity;
    }

    public PetAppointmentInventoryConsumptionStatus getConsumptionStatus() {
        return consumptionStatus;
    }

    public void setConsumptionStatus(PetAppointmentInventoryConsumptionStatus consumptionStatus) {
        this.consumptionStatus = consumptionStatus;
    }

    public UUID getAppliedInventoryMovementId() {
        return appliedInventoryMovementId;
    }

    public void setAppliedInventoryMovementId(UUID appliedInventoryMovementId) {
        this.appliedInventoryMovementId = appliedInventoryMovementId;
    }

    public Instant getStockAppliedAt() {
        return stockAppliedAt;
    }

    public void setStockAppliedAt(Instant stockAppliedAt) {
        this.stockAppliedAt = stockAppliedAt;
    }

    public String getStockAppliedBy() {
        return stockAppliedBy;
    }

    public void setStockAppliedBy(String stockAppliedBy) {
        this.stockAppliedBy = stockAppliedBy;
    }
}
