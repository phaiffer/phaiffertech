package com.phaiffertech.platform.modules.pet.appointment.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_appointments")
@SQLDelete(sql = "UPDATE pet_appointments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetAppointment extends BaseTenantEntity {

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "pet_id", nullable = false)
    private UUID petId;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "professional_id")
    private UUID professionalId;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "SCHEDULED";

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    // Price snapshot from service catalog at booking time.
    // Preserved across service price changes after the appointment is booked.
    @Column(name = "service_price", precision = 10, scale = 2)
    private BigDecimal servicePrice;

    // Reserved for future commission calculation.
    // Null until a professional commission model is established.
    @Column(name = "commission_amount", precision = 10, scale = 2)
    private BigDecimal commissionAmount;

    // Optional reference to the client plan used for this appointment.
    // Null for one-time paid appointments.
    @Column(name = "client_plan_id")
    private UUID clientPlanId;

    // Guards against double session consumption when the appointment is updated to COMPLETED multiple times.
    @Column(name = "plan_session_consumed", nullable = false)
    private boolean planSessionConsumed = false;

    public UUID getClientId() {
        return clientId;
    }

    public void setClientId(UUID clientId) {
        this.clientId = clientId;
    }

    public UUID getPetId() {
        return petId;
    }

    public void setPetId(UUID petId) {
        this.petId = petId;
    }

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public UUID getProfessionalId() {
        return professionalId;
    }

    public void setProfessionalId(UUID professionalId) {
        this.professionalId = professionalId;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public BigDecimal getServicePrice() {
        return servicePrice;
    }

    public void setServicePrice(BigDecimal servicePrice) {
        this.servicePrice = servicePrice;
    }

    public BigDecimal getCommissionAmount() {
        return commissionAmount;
    }

    public void setCommissionAmount(BigDecimal commissionAmount) {
        this.commissionAmount = commissionAmount;
    }

    public UUID getClientPlanId() {
        return clientPlanId;
    }

    public void setClientPlanId(UUID clientPlanId) {
        this.clientPlanId = clientPlanId;
    }

    public boolean isPlanSessionConsumed() {
        return planSessionConsumed;
    }

    public void setPlanSessionConsumed(boolean planSessionConsumed) {
        this.planSessionConsumed = planSessionConsumed;
    }
}
