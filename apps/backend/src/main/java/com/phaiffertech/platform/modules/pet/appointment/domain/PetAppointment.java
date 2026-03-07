package com.phaiffertech.platform.modules.pet.appointment.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_appointments")
@SQLDelete(sql = "UPDATE pet_appointments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetAppointment extends BaseTenantEntity {

    @Column(name = "client_id", nullable = false, columnDefinition = "char(36)")
    private UUID clientId;

    @Column(name = "pet_id", nullable = false, columnDefinition = "char(36)")
    private UUID petId;

    @Column(name = "service_id", columnDefinition = "char(36)")
    private UUID serviceId;

    @Column(name = "professional_id", columnDefinition = "char(36)")
    private UUID professionalId;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "SCHEDULED";

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

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
}
