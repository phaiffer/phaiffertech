package com.phaiffertech.platform.modules.pet.professional.mapper;

import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalCreateRequest;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalResponse;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetProfessionalMapper implements BaseCrudMapper<
        PetProfessional,
        PetProfessionalCreateRequest,
        PetProfessionalUpdateRequest,
        PetProfessionalResponse> {

    public static final PetProfessionalMapper INSTANCE = new PetProfessionalMapper();

    private PetProfessionalMapper() {
    }

    @Override
    public PetProfessional toNewEntity(PetProfessionalCreateRequest request) {
        PetProfessional entity = new PetProfessional();
        entity.setName(request.name().trim());
        entity.setSpecialty(trimToNull(request.specialty()));
        entity.setLicenseNumber(trimToNull(request.licenseNumber()));
        entity.setPhone(trimToNull(request.phone()));
        entity.setEmail(trimToNull(request.email()));
        return entity;
    }

    @Override
    public void updateEntity(PetProfessional entity, PetProfessionalUpdateRequest request) {
        entity.setName(request.name().trim());
        entity.setSpecialty(trimToNull(request.specialty()));
        entity.setLicenseNumber(trimToNull(request.licenseNumber()));
        entity.setPhone(trimToNull(request.phone()));
        entity.setEmail(trimToNull(request.email()));
    }

    @Override
    public PetProfessionalResponse toResponse(PetProfessional entity) {
        return new PetProfessionalResponse(
                entity.getId(),
                entity.getName(),
                entity.getSpecialty(),
                entity.getLicenseNumber(),
                entity.getPhone(),
                entity.getEmail(),
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
