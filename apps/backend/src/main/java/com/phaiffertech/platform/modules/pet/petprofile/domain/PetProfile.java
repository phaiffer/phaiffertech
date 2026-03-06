package com.phaiffertech.platform.modules.pet.petprofile.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "pet_profiles")
public class PetProfile extends BaseTenantEntity {

    @Column(name = "client_id", nullable = false, columnDefinition = "char(36)")
    private UUID clientId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "species", nullable = false, length = 60)
    private String species;

    @Column(name = "breed", length = 80)
    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

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
}
