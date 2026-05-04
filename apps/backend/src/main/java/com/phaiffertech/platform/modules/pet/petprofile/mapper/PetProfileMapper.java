package com.phaiffertech.platform.modules.pet.petprofile.mapper;

import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileCreateRequest;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileResponse;
import com.phaiffertech.platform.modules.pet.petprofile.dto.PetProfileUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetProfileMapper implements BaseCrudMapper<
        PetProfile,
        PetProfileCreateRequest,
        PetProfileUpdateRequest,
        PetProfileResponse> {

    public static final PetProfileMapper INSTANCE = new PetProfileMapper();

    private PetProfileMapper() {
    }

    @Override
    public PetProfile toNewEntity(PetProfileCreateRequest request) {
        PetProfile profile = new PetProfile();
        profile.setClientId(request.clientId());
        profile.setName(request.name().trim());
        profile.setSpecies(request.species().trim());
        profile.setBreed(request.breed());
        profile.setBirthDate(request.birthDate());
        profile.setGender(normalizeUpper(request.gender()));
        profile.setWeight(request.weight());
        profile.setSize(normalizeUpper(request.size()));
        profile.setCoatType(trimToNull(request.coatType()));
        profile.setBehavior(trimToNull(request.behavior()));
        profile.setColor(trimToNull(request.color()));
        profile.setRestrictions(trimToNull(request.restrictions()));
        profile.setGroomingNotes(trimToNull(request.groomingNotes()));
        profile.setNotes(trimToNull(request.notes()));
        return profile;
    }

    @Override
    public void updateEntity(PetProfile entity, PetProfileUpdateRequest request) {
        entity.setClientId(request.clientId());
        entity.setName(request.name().trim());
        entity.setSpecies(request.species().trim());
        entity.setBreed(request.breed());
        entity.setBirthDate(request.birthDate());
        entity.setGender(normalizeUpper(request.gender()));
        entity.setWeight(request.weight());
        entity.setSize(normalizeUpper(request.size()));
        entity.setCoatType(trimToNull(request.coatType()));
        entity.setBehavior(trimToNull(request.behavior()));
        entity.setColor(trimToNull(request.color()));
        entity.setRestrictions(trimToNull(request.restrictions()));
        entity.setGroomingNotes(trimToNull(request.groomingNotes()));
        entity.setNotes(trimToNull(request.notes()));
    }

    @Override
    public PetProfileResponse toResponse(PetProfile profile) {
        return new PetProfileResponse(
                profile.getId(),
                profile.getClientId(),
                profile.getName(),
                profile.getSpecies(),
                profile.getBreed(),
                profile.getBirthDate(),
                profile.getGender(),
                profile.getWeight(),
                profile.getSize(),
                profile.getCoatType(),
                profile.getBehavior(),
                profile.getColor(),
                profile.getRestrictions(),
                profile.getGroomingNotes(),
                profile.getNotes(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private String normalizeUpper(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
