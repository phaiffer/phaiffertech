package com.phaiffertech.platform.modules.pet.petprofile.mapper;

import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileResponse;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileUpdateRequest;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PetProfileMapperTest {

    @Test
    void updateEntityPersistsGroomingFieldsAndReturnsThemInResponse() {
        UUID clientId = UUID.randomUUID();
        PetProfile profile = new PetProfile();
        PetProfileUpdateRequest request = new PetProfileUpdateRequest(
                clientId,
                "Luna",
                "Dog",
                "Spitz",
                null,
                "female",
                null,
                "small",
                "Dupla",
                "Ansiosa",
                "Branca",
                "Alergia a perfume",
                "Usar shampoo neutro e secagem baixa",
                "Observacao geral"
        );

        PetProfileMapper.INSTANCE.updateEntity(profile, request);
        PetProfileResponse response = PetProfileMapper.INSTANCE.toResponse(profile);

        assertEquals("SMALL", response.size());
        assertEquals("Dupla", response.coatType());
        assertEquals("Ansiosa", response.behavior());
        assertEquals("Alergia a perfume", response.restrictions());
        assertEquals("Usar shampoo neutro e secagem baixa", response.groomingNotes());
    }
}
