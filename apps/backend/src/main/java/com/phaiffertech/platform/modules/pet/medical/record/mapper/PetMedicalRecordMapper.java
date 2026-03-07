package com.phaiffertech.platform.modules.pet.medical.record.mapper;

import com.phaiffertech.platform.modules.pet.medical.record.domain.PetMedicalRecord;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordResponse;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;

public final class PetMedicalRecordMapper implements BaseCrudMapper<
        PetMedicalRecord,
        PetMedicalRecordCreateRequest,
        PetMedicalRecordUpdateRequest,
        PetMedicalRecordResponse> {

    public static final PetMedicalRecordMapper INSTANCE = new PetMedicalRecordMapper();

    private PetMedicalRecordMapper() {
    }

    @Override
    public PetMedicalRecord toNewEntity(PetMedicalRecordCreateRequest request) {
        PetMedicalRecord entity = new PetMedicalRecord();
        entity.setPetId(request.petId());
        entity.setProfessionalId(request.professionalId());
        entity.setDescription(request.description().trim());
        entity.setDiagnosis(trimToNull(request.diagnosis()));
        entity.setTreatment(trimToNull(request.treatment()));
        return entity;
    }

    @Override
    public void updateEntity(PetMedicalRecord entity, PetMedicalRecordUpdateRequest request) {
        entity.setPetId(request.petId());
        entity.setProfessionalId(request.professionalId());
        entity.setDescription(request.description().trim());
        entity.setDiagnosis(trimToNull(request.diagnosis()));
        entity.setTreatment(trimToNull(request.treatment()));
    }

    @Override
    public PetMedicalRecordResponse toResponse(PetMedicalRecord entity) {
        return new PetMedicalRecordResponse(
                entity.getId(),
                entity.getPetId(),
                entity.getProfessionalId(),
                entity.getDescription(),
                entity.getDiagnosis(),
                entity.getTreatment(),
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
