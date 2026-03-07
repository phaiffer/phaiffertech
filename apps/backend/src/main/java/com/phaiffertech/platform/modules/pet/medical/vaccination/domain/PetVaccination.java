package com.phaiffertech.platform.modules.pet.medical.vaccination.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_vaccinations")
@SQLDelete(sql = "UPDATE pet_vaccinations SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetVaccination extends BaseTenantEntity {

    @Column(name = "pet_id", nullable = false, columnDefinition = "char(36)")
    private UUID petId;

    @Column(name = "vaccine_name", nullable = false, length = 150)
    private String vaccineName;

    @Column(name = "applied_at", nullable = false)
    private Instant appliedAt;

    @Column(name = "next_due_at")
    private Instant nextDueAt;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    public UUID getPetId() {
        return petId;
    }

    public void setPetId(UUID petId) {
        this.petId = petId;
    }

    public String getVaccineName() {
        return vaccineName;
    }

    public void setVaccineName(String vaccineName) {
        this.vaccineName = vaccineName;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Instant appliedAt) {
        this.appliedAt = appliedAt;
    }

    public Instant getNextDueAt() {
        return nextDueAt;
    }

    public void setNextDueAt(Instant nextDueAt) {
        this.nextDueAt = nextDueAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
