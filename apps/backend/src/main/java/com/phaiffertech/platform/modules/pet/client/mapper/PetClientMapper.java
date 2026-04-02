package com.phaiffertech.platform.modules.pet.client.mapper;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.util.Locale;

public final class PetClientMapper implements BaseCrudMapper<
        PetClient,
        PetClientCreateRequest,
        PetClientUpdateRequest,
        PetClientResponse> {

    public static final PetClientMapper INSTANCE = new PetClientMapper();

    private PetClientMapper() {
    }

    @Override
    public PetClient toNewEntity(PetClientCreateRequest request) {
        PetClient client = new PetClient();
        String normalizedName = request.name().trim();
        String normalizedDocumentType = normalizeDocumentType(request.documentType());
        client.setName(normalizedName);
        client.setFullName(normalizedName);
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client.setDocumentType(normalizedDocumentType);
        client.setDocument(normalizeDocument(normalizedDocumentType, request.document()));
        client.setAddress(request.address());
        client.setStatus(resolveStatus(request.status()));
        return client;
    }

    @Override
    public void updateEntity(PetClient entity, PetClientUpdateRequest request) {
        String normalizedName = request.name().trim();
        String normalizedDocumentType = normalizeDocumentType(request.documentType());
        entity.setName(normalizedName);
        entity.setFullName(normalizedName);
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setDocumentType(normalizedDocumentType);
        entity.setDocument(normalizeDocument(normalizedDocumentType, request.document()));
        entity.setAddress(request.address());
        entity.setStatus(resolveStatus(request.status()));
    }

    @Override
    public PetClientResponse toResponse(PetClient client) {
        return new PetClientResponse(
                client.getId(),
                client.getName(),
                client.getEmail(),
                client.getPhone(),
                client.getDocumentType(),
                client.getDocument(),
                client.getAddress(),
                client.getStatus(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }

    private String normalizeDocumentType(String documentType) {
        if (documentType == null || documentType.isBlank()) {
            throw new IllegalArgumentException("Client document type is required.");
        }

        String normalizedDocumentType = documentType.trim().toUpperCase(Locale.ROOT);
        if (!"CPF".equals(normalizedDocumentType) && !"RG".equals(normalizedDocumentType)) {
            throw new IllegalArgumentException("Client document type must be CPF or RG.");
        }

        return normalizedDocumentType;
    }

    private String normalizeDocument(String documentType, String document) {
        if (document == null || document.isBlank()) {
            throw new IllegalArgumentException("Client document number is required.");
        }

        if ("CPF".equals(documentType)) {
            String normalizedCpf = document.replaceAll("\\D", "");
            if (!isValidCpf(normalizedCpf)) {
                throw new IllegalArgumentException("Client CPF must be valid.");
            }
            return normalizedCpf;
        }

        String normalizedDocument = document.trim().toUpperCase(Locale.ROOT);
        if (normalizedDocument.length() < 3) {
            throw new IllegalArgumentException("Client RG must contain at least 3 characters.");
        }
        return normalizedDocument;
    }

    private boolean isValidCpf(String value) {
        if (value == null || !value.matches("\\d{11}") || value.chars().distinct().count() == 1) {
            return false;
        }

        return calculateCpfDigit(value, 9, 10) == Character.getNumericValue(value.charAt(9))
                && calculateCpfDigit(value, 10, 11) == Character.getNumericValue(value.charAt(10));
    }

    private int calculateCpfDigit(String value, int length, int weightStart) {
        int sum = 0;
        for (int index = 0; index < length; index++) {
            int digit = Character.getNumericValue(value.charAt(index));
            sum += digit * (weightStart - index);
        }

        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }
}
