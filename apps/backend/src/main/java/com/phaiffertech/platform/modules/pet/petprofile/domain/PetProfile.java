package com.phaiffertech.platform.modules.pet.petprofile.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_profiles")
@SQLDelete(sql = "UPDATE pet_profiles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetProfile extends BaseTenantEntity {

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "species", nullable = false, length = 60)
    private String species;

    @Column(name = "breed", length = 80)
    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "gender", length = 30)
    private String gender;

    @Column(name = "weight", precision = 10, scale = 2)
    private BigDecimal weight;

    @Column(name = "size", length = 30)
    private String size;

    @Column(name = "coat_type", length = 80)
    private String coatType;

    @Column(name = "behavior", length = 80)
    private String behavior;

    @Column(name = "color", length = 80)
    private String color;

    @Column(name = "restrictions", columnDefinition = "text")
    private String restrictions;

    @Column(name = "grooming_notes", columnDefinition = "text")
    private String groomingNotes;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    public UUID getClientId() {
        return clientId;
    }

    public void setClientId(UUID clientId) {
        this.clientId = clientId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public String getCoatType() {
        return coatType;
    }

    public void setCoatType(String coatType) {
        this.coatType = coatType;
    }

    public String getBehavior() {
        return behavior;
    }

    public void setBehavior(String behavior) {
        this.behavior = behavior;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getRestrictions() {
        return restrictions;
    }

    public void setRestrictions(String restrictions) {
        this.restrictions = restrictions;
    }

    public String getGroomingNotes() {
        return groomingNotes;
    }

    public void setGroomingNotes(String groomingNotes) {
        this.groomingNotes = groomingNotes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
