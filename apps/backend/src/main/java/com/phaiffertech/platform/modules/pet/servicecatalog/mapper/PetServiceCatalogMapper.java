package com.phaiffertech.platform.modules.pet.servicecatalog.mapper;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCatalog;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogCreateRequest;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceInventoryLinkResponse;
import com.phaiffertech.platform.modules.pet.servicecatalog.dto.PetServiceCatalogUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.util.List;

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
        entity.setCategory(request.category());
        entity.setActive(request.active());
        entity.setPrice(request.basePrice());
        entity.setDurationMinutes(request.durationMinutes());
        entity.setCommissionEligible(request.commissionEligible());
        entity.setAllowInPlans(request.allowInPlans());
        entity.setAllowStandaloneBooking(request.allowStandaloneBooking());
        return entity;
    }

    @Override
    public void updateEntity(PetServiceCatalog entity, PetServiceCatalogUpdateRequest request) {
        entity.setName(request.name().trim());
        entity.setDescription(trimToNull(request.description()));
        entity.setCategory(request.category());
        entity.setActive(request.active());
        entity.setPrice(request.basePrice());
        entity.setDurationMinutes(request.durationMinutes());
        entity.setCommissionEligible(request.commissionEligible());
        entity.setAllowInPlans(request.allowInPlans());
        entity.setAllowStandaloneBooking(request.allowStandaloneBooking());
    }

    @Override
    public PetServiceCatalogResponse toResponse(PetServiceCatalog entity) {
        return toResponse(entity, List.of());
    }

    public PetServiceCatalogResponse toResponse(
            PetServiceCatalog entity,
            List<PetServiceInventoryLinkResponse> inventoryLinks
    ) {
        return new PetServiceCatalogResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getCategory(),
                entity.isActive(),
                entity.getPrice(),
                entity.getDurationMinutes(),
                entity.isCommissionEligible(),
                entity.isAllowInPlans(),
                entity.isAllowStandaloneBooking(),
                inventoryLinks,
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
