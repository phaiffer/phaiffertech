package com.phaiffertech.platform.modules.pet.medical.vaccination.mapper;

import com.phaiffertech.platform.modules.pet.medical.vaccination.domain.PetVaccination;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationResponse;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetVaccinationMapper implements BaseCrudMapper<
        PetVaccination,
        PetVaccinationCreateRequest,
        PetVaccinationUpdateRequest,
        PetVaccinationResponse> {

    public static final PetVaccinationMapper INSTANCE = new PetVaccinationMapper();

    private PetVaccinationMapper() {
    }

    @Override
    public PetVaccination toNewEntity(PetVaccinationCreateRequest request) {
        PetVaccination entity = new PetVaccination();
        entity.setPetId(request.petId());
        entity.setVaccineName(request.vaccineName().trim());
        entity.setAppliedAt(request.appliedAt());
        entity.setNextDueAt(request.nextDueAt());
        entity.setNotes(trimToNull(request.notes()));
        return entity;
    }

    @Override
    public void updateEntity(PetVaccination entity, PetVaccinationUpdateRequest request) {
        entity.setPetId(request.petId());
        entity.setVaccineName(request.vaccineName().trim());
        entity.setAppliedAt(request.appliedAt());
        entity.setNextDueAt(request.nextDueAt());
        entity.setNotes(trimToNull(request.notes()));
    }

    @Override
    public PetVaccinationResponse toResponse(PetVaccination entity) {
        return new PetVaccinationResponse(
                entity.getId(),
                entity.getPetId(),
                entity.getVaccineName(),
                entity.getAppliedAt(),
                entity.getNextDueAt(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
