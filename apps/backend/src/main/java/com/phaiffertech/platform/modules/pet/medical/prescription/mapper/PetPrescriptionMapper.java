package com.phaiffertech.platform.modules.pet.medical.prescription.mapper;

import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionResponse;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetPrescriptionMapper implements BaseCrudMapper<
        PetPrescription,
        PetPrescriptionCreateRequest,
        PetPrescriptionUpdateRequest,
        PetPrescriptionResponse> {

    public static final PetPrescriptionMapper INSTANCE = new PetPrescriptionMapper();

    private PetPrescriptionMapper() {
    }

    @Override
    public PetPrescription toNewEntity(PetPrescriptionCreateRequest request) {
        PetPrescription entity = new PetPrescription();
        entity.setPetId(request.petId());
        entity.setProfessionalId(request.professionalId());
        entity.setMedication(request.medication().trim());
        entity.setDosage(trimToNull(request.dosage()));
        entity.setInstructions(trimToNull(request.instructions()));
        return entity;
    }

    @Override
    public void updateEntity(PetPrescription entity, PetPrescriptionUpdateRequest request) {
        entity.setPetId(request.petId());
        entity.setProfessionalId(request.professionalId());
        entity.setMedication(request.medication().trim());
        entity.setDosage(trimToNull(request.dosage()));
        entity.setInstructions(trimToNull(request.instructions()));
    }

    @Override
    public PetPrescriptionResponse toResponse(PetPrescription entity) {
        return new PetPrescriptionResponse(
                entity.getId(),
                entity.getPetId(),
                entity.getProfessionalId(),
                entity.getMedication(),
                entity.getDosage(),
                entity.getInstructions(),
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
