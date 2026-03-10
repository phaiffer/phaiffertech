package com.phaiffertech.platform.modules.pet.medical.prescription.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.medical.prescription.domain.PetPrescription;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionResponse;
import com.phaiffertech.platform.modules.pet.medical.prescription.dto.PetPrescriptionUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.prescription.mapper.PetPrescriptionMapper;
import com.phaiffertech.platform.modules.pet.medical.prescription.repository.PetPrescriptionRepository;
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
public class PetPrescriptionService extends BaseTenantCrudService<
        PetPrescription,
        PetPrescriptionCreateRequest,
        PetPrescriptionUpdateRequest,
        PetPrescriptionResponse> {

    private final PetPrescriptionRepository repository;
    private final PetAppointmentRepository petAppointmentRepository;
    private final PetProfileRepository petProfileRepository;
    private final PetProfessionalRepository petProfessionalRepository;

    public PetPrescriptionService(
            PetPrescriptionRepository repository,
            PetAppointmentRepository petAppointmentRepository,
            PetProfileRepository petProfileRepository,
            PetProfessionalRepository petProfessionalRepository
    ) {
        super(repository, repository, PetPrescriptionMapper.INSTANCE, "Pet prescription not found.");
        this.repository = repository;
        this.petAppointmentRepository = petAppointmentRepository;
        this.petProfileRepository = petProfileRepository;
        this.petProfessionalRepository = petProfessionalRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetPrescriptionCreateRequest request, PetPrescription entity) {
        validateReferences(tenantId, request.petId(), request.professionalId(), request.appointmentId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetPrescriptionUpdateRequest request, PetPrescription entity) {
        validateReferences(tenantId, request.petId(), request.professionalId(), request.appointmentId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_prescription")
    public PetPrescriptionResponse create(PetPrescriptionCreateRequest request) {
        PetPrescriptionResponse response = doCreate(request);
        return getById(response.id());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetPrescriptionResponse> list(
            PageRequestDto pageRequest,
            UUID petId,
            UUID professionalId,
            UUID appointmentId
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PetPrescription> prescriptions = repository.findAllByTenantIdAndSearch(
                tenantId,
                petId,
                professionalId,
                appointmentId,
                query.search(),
                query.pageable()
        );
        Map<UUID, String> petNames = loadPetNames(tenantId, prescriptions.getContent().stream()
                .map(PetPrescription::getPetId)
                .collect(Collectors.toSet()));
        Map<UUID, String> professionalNames = loadProfessionalNames(tenantId, prescriptions.getContent().stream()
                .map(PetPrescription::getProfessionalId)
                .collect(Collectors.toSet()));
        Map<UUID, PetAppointment> appointments = loadAppointments(tenantId, prescriptions.getContent().stream()
                .map(PetPrescription::getAppointmentId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet()));
        return PaginationUtils.fromPage(prescriptions.map(prescription -> toResponse(prescription, petNames, professionalNames, appointments)));
    }

    @Transactional(readOnly = true)
    public PetPrescriptionResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toResponse(getOrThrow(id, tenantId), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_prescription")
    public PetPrescriptionResponse update(UUID id, PetPrescriptionUpdateRequest request) {
        PetPrescriptionResponse response = doUpdate(id, request);
        return getById(response.id());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_prescription")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_prescription")
    public PetPrescriptionResponse restore(UUID id) {
        PetPrescriptionResponse response = doRestore(id);
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

    private PetPrescriptionResponse toResponse(PetPrescription prescription, UUID tenantId) {
        PetAppointment appointment = resolveAppointment(tenantId, prescription.getAppointmentId());
        return PetPrescriptionMapper.INSTANCE.toResponse(
                prescription,
                petProfileRepository.findByIdAndTenantId(prescription.getPetId(), tenantId).map(PetProfile::getName).orElse(null),
                petProfessionalRepository.findByIdAndTenantId(prescription.getProfessionalId(), tenantId).map(PetProfessional::getName).orElse(null),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt()
        );
    }

    private PetPrescriptionResponse toResponse(
            PetPrescription prescription,
            Map<UUID, String> petNames,
            Map<UUID, String> professionalNames,
            Map<UUID, PetAppointment> appointments
    ) {
        PetAppointment appointment = appointments.get(prescription.getAppointmentId());
        return PetPrescriptionMapper.INSTANCE.toResponse(
                prescription,
                petNames.get(prescription.getPetId()),
                professionalNames.get(prescription.getProfessionalId()),
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
            throw new ConflictOperationException("Canceled or missed pet appointments cannot receive prescriptions.");
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
