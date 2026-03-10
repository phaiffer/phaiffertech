package com.phaiffertech.platform.modules.pet.medical.record.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.medical.record.domain.PetMedicalRecord;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordResponse;
import com.phaiffertech.platform.modules.pet.medical.record.dto.PetMedicalRecordUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.record.mapper.PetMedicalRecordMapper;
import com.phaiffertech.platform.modules.pet.medical.record.repository.PetMedicalRecordRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ConflictOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetMedicalRecordService extends BaseTenantCrudService<
        PetMedicalRecord,
        PetMedicalRecordCreateRequest,
        PetMedicalRecordUpdateRequest,
        PetMedicalRecordResponse> {

    private final PetMedicalRecordRepository repository;
    private final PetAppointmentRepository petAppointmentRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetProfessionalRepository petProfessionalRepository;

    public PetMedicalRecordService(
            PetMedicalRecordRepository repository,
            PetAppointmentRepository petAppointmentRepository,
            PetProfileRepository petProfileRepository,
            PetProfessionalRepository petProfessionalRepository
    ) {
        super(repository, repository, PetMedicalRecordMapper.INSTANCE, "Pet medical record not found.");
        this.repository = repository;
        this.petAppointmentRepository = petAppointmentRepository;
        this.petProfileRepository = petProfileRepository;
        this.petProfessionalRepository = petProfessionalRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetMedicalRecordCreateRequest request, PetMedicalRecord entity) {
        validateReferences(tenantId, request.petId(), request.professionalId(), request.appointmentId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetMedicalRecordUpdateRequest request, PetMedicalRecord entity) {
        validateReferences(tenantId, request.petId(), request.professionalId(), request.appointmentId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_medical_record")
    public PetMedicalRecordResponse create(PetMedicalRecordCreateRequest request) {
        PetMedicalRecordResponse response = doCreate(request);
        return getById(response.id());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetMedicalRecordResponse> list(
            PageRequestDto pageRequest,
            UUID petId,
            UUID professionalId,
            UUID appointmentId
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PetMedicalRecord> records = repository.findAllByTenantIdAndSearch(
                tenantId,
                petId,
                professionalId,
                appointmentId,
                query.search(),
                query.pageable()
        );
        Map<UUID, String> petNames = loadPetNames(tenantId, records.getContent().stream()
                .map(PetMedicalRecord::getPetId)
                .collect(Collectors.toSet()));
        Map<UUID, String> professionalNames = loadProfessionalNames(tenantId, records.getContent().stream()
                .map(PetMedicalRecord::getProfessionalId)
                .collect(Collectors.toSet()));
        Map<UUID, PetAppointment> appointments = loadAppointments(tenantId, records.getContent().stream()
                .map(PetMedicalRecord::getAppointmentId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet()));
        return PaginationUtils.fromPage(records.map(record -> toResponse(record, petNames, professionalNames, appointments)));
    }

    @Transactional(readOnly = true)
    public PetMedicalRecordResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toResponse(getOrThrow(id, tenantId), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_medical_record")
    public PetMedicalRecordResponse update(UUID id, PetMedicalRecordUpdateRequest request) {
        PetMedicalRecordResponse response = doUpdate(id, request);
        return getById(response.id());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_medical_record")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_medical_record")
    public PetMedicalRecordResponse restore(UUID id) {
        PetMedicalRecordResponse response = doRestore(id);
        return getById(response.id());
    }

    private void validateReferences(UUID tenantId, UUID petId, UUID professionalId, UUID appointmentId) {
        petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));
        petProfessionalRepository.findByIdAndTenantId(professionalId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet professional not found for tenant."));

        if (appointmentId != null) {
            validateAppointmentContext(tenantId, appointmentId, petId, professionalId);
        }
    }

    private PetMedicalRecordResponse toResponse(PetMedicalRecord record, UUID tenantId) {
        PetAppointment appointment = resolveAppointment(tenantId, record.getAppointmentId());
        return PetMedicalRecordMapper.INSTANCE.toResponse(
                record,
                petProfileRepository.findByIdAndTenantId(record.getPetId(), tenantId).map(PetProfile::getName).orElse(null),
                petProfessionalRepository.findByIdAndTenantId(record.getProfessionalId(), tenantId).map(PetProfessional::getName).orElse(null),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt()
        );
    }

    private PetMedicalRecordResponse toResponse(
            PetMedicalRecord record,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames,
            Map<UUID, PetAppointment> appointments
    ) {
        PetAppointment appointment = appointments.get(record.getAppointmentId());
        return PetMedicalRecordMapper.INSTANCE.toResponse(
                record,
                petNames.get(record.getPetId()),
                professionalNames.get(record.getProfessionalId()),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt()
        );
    }

    private Map<UUID, String> loadPetNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(petProfileRepository.findAllByTenantIdAndIdIn(tenantId, ids), PetProfile::getId, PetProfile::getName);
    }

    private Map<UUID, String> loadProfessionalNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(petProfessionalRepository.findAllByTenantIdAndIdIn(tenantId, ids), PetProfessional::getId, PetProfessional::getName);
    }

    private Map<UUID, PetAppointment> loadAppointments(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return petAppointmentRepository.findAllByTenantIdAndIdIn(tenantId, ids).stream()
                .collect(Collectors.toMap(PetAppointment::getId, Function.identity()));
    }

    private PetAppointment resolveAppointment(UUID tenantId, UUID appointmentId) {
        if (appointmentId == null) {
            return null;
        }
        return petAppointmentRepository.findByIdAndTenantId(appointmentId, tenantId).orElse(null);
    }

    private void validateAppointmentContext(UUID tenantId, UUID appointmentId, UUID petId, UUID professionalId) {
        PetAppointment appointment = petAppointmentRepository.findByIdAndTenantId(appointmentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet appointment not found for tenant."));

        if (appointment.getServiceId() == null || appointment.getProfessionalId() == null) {
            throw new ConflictOperationException(
                    "Pet appointment data is inconsistent with the current contract and cannot anchor clinical workflow."
            );
        }

        if (!appointment.getPetId().equals(petId)) {
            throw new ResourceNotFoundException("Pet appointment does not belong to the informed pet.");
        }

        if (!appointment.getProfessionalId().equals(professionalId)) {
            throw new ResourceNotFoundException("Pet appointment does not belong to the informed professional.");
        }

        String normalizedStatus = appointment.getStatus() == null ? "" : appointment.getStatus().trim().toUpperCase();
        if ("CANCELED".equals(normalizedStatus) || "NO_SHOW".equals(normalizedStatus)) {
            throw new ConflictOperationException("Canceled or missed pet appointments cannot receive clinical records.");
        }
    }

    private <E> Map<UUID, String> toMap(
            Collection<E> entities,
            Function<E, UUID> idResolver,
            Function<E, String> valueResolver
    ) {
        return entities.stream().collect(Collectors.toMap(idResolver, valueResolver));
    }
}
