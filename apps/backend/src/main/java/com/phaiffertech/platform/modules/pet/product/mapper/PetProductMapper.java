package com.phaiffertech.platform.modules.pet.product.mapper;

import com.phaiffertech.platform.modules.pet.product.domain.PetProduct;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductCreateRequest;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductResponse;
import com.phaiffertech.platform.modules.pet.product.dto.PetProductUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetProductMapper implements BaseCrudMapper<
        PetProduct,
        PetProductCreateRequest,
        PetProductUpdateRequest,
        PetProductResponse> {

    public static final PetProductMapper INSTANCE = new PetProductMapper();

    private PetProductMapper() {
    }

    @Override
    public PetProduct toNewEntity(PetProductCreateRequest request) {
        PetProduct entity = new PetProduct();
        entity.setName(request.name().trim());
        entity.setSku(normalizeSku(request.sku()));
        entity.setPrice(request.price());
        entity.setStockQuantity(request.stockQuantity());
        return entity;
    }

    @Override
    public void updateEntity(PetProduct entity, PetProductUpdateRequest request) {
        entity.setName(request.name().trim());
        entity.setSku(normalizeSku(request.sku()));
        entity.setPrice(request.price());
        entity.setStockQuantity(request.stockQuantity());
    }

    @Override
    public PetProductResponse toResponse(PetProduct entity) {
        return new PetProductResponse(
                entity.getId(),
                entity.getName(),
                entity.getSku(),
                entity.getPrice(),
                entity.getStockQuantity(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalizeSku(String sku) {
        return sku.trim().toUpperCase();
    }
}
