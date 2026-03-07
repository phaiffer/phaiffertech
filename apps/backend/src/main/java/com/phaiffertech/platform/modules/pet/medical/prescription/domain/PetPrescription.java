package com.phaiffertech.platform.modules.pet.medical.prescription.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_prescriptions")
@SQLDelete(sql = "UPDATE pet_prescriptions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetPrescription extends BaseTenantEntity {

    @Column(name = "pet_id", nullable = false, columnDefinition = "char(36)")
    private UUID petId;

    @Column(name = "professional_id", nullable = false, columnDefinition = "char(36)")
    private UUID professionalId;

    @Column(name = "medication", nullable = false, length = 180)
    private String medication;

    @Column(name = "dosage", length = 120)
    private String dosage;

    @Column(name = "instructions", columnDefinition = "text")
    private String instructions;

    public UUID getPetId() {
        return petId;
    }

    public void setPetId(UUID petId) {
        this.petId = petId;
    }

    public UUID getProfessionalId() {
        return professionalId;
    }

    public void setProfessionalId(UUID professionalId) {
        this.professionalId = professionalId;
    }

    public String getMedication() {
        return medication;
    }

    public void setMedication(String medication) {
        this.medication = medication;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }
}
