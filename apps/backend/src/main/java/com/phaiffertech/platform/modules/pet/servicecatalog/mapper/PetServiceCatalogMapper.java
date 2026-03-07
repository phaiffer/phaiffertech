package com.phaiffertech.platform.modules.pet.servicecatalog.mapper;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogCreateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetServiceCatalogMapper implements BaseCrudMapper<
        PetServiceCatalog,
        PetServiceCatalogCreateRequest,
        PetServiceCatalogUpdateRequest,
        PetServiceCatalogResponse> {

    public static final PetServiceCatalogMapper INSTANCE = new PetServiceCatalogMapper();

    private PetServiceCatalogMapper() {
    }

    @Override
    public PetServiceCatalog toNewEntity(PetServiceCatalogCreateRequest request) {
        PetServiceCatalog entity = new PetServiceCatalog();
        entity.setName(request.name().trim());
        entity.setDescription(trimToNull(request.description()));
        entity.setPrice(request.price());
        entity.setDurationMinutes(request.durationMinutes());
        return entity;
    }

    @Override
    public void updateEntity(PetServiceCatalog entity, PetServiceCatalogUpdateRequest request) {
        entity.setName(request.name().trim());
        entity.setDescription(trimToNull(request.description()));
        entity.setPrice(request.price());
        entity.setDurationMinutes(request.durationMinutes());
    }

    @Override
    public PetServiceCatalogResponse toResponse(PetServiceCatalog entity) {
        return new PetServiceCatalogResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getDurationMinutes(),
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
