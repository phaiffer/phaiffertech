package com.phaiffertech.platform.modules.pet.invoice.mapper;

import com.phaiffertech.platform.modules.pet.invoice.domain.PetInvoice;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceCreateRequest;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceResponse;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.time.Instant;

public final class PetInvoiceMapper implements BaseCrudMapper<
        PetInvoice,
        PetInvoiceCreateRequest,
        PetInvoiceUpdateRequest,
        PetInvoiceResponse> {

    public static final PetInvoiceMapper INSTANCE = new PetInvoiceMapper();

    private PetInvoiceMapper() {
    }

    @Override
    public PetInvoice toNewEntity(PetInvoiceCreateRequest request) {
        PetInvoice entity = new PetInvoice();
        entity.setClientId(request.clientId());
        entity.setTotalAmount(request.totalAmount());
        entity.setStatus(resolveStatus(request.status()));
        entity.setIssuedAt(request.issuedAt() == null ? Instant.now() : request.issuedAt());
        return entity;
    }

    @Override
    public void updateEntity(PetInvoice entity, PetInvoiceUpdateRequest request) {
        entity.setClientId(request.clientId());
        entity.setTotalAmount(request.totalAmount());
        entity.setStatus(resolveStatus(request.status()));
        entity.setIssuedAt(request.issuedAt());
    }

    @Override
    public PetInvoiceResponse toResponse(PetInvoice entity) {
        return new PetInvoiceResponse(
                entity.getId(),
                entity.getClientId(),
                entity.getTotalAmount(),
                entity.getStatus(),
                entity.getIssuedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String resolveStatus(String value) {
        if (value == null || value.isBlank()) {
            return "ISSUED";
        }
        return value.trim().toUpperCase();
    }
}
