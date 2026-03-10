package com.phaiffertech.platform.modules.pet.medical.vaccination.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.appointment.domain.PetAppointment;
import com.phaiffertech.platform.modules.pet.appointment.repository.PetAppointmentRepository;
import com.phaiffertech.platform.modules.pet.medical.vaccination.domain.PetVaccination;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationCreateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationResponse;
import com.phaiffertech.platform.modules.pet.medical.vaccination.dto.PetVaccinationUpdateRequest;
import com.phaiffertech.platform.modules.pet.medical.vaccination.mapper.PetVaccinationMapper;
import com.phaiffertech.platform.modules.pet.medical.vaccination.repository.PetVaccinationRepository;
import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;
import com.phaiffertech.platform.modules.pet.petprofile.repository.PetProfileRepository;
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
public class PetVaccinationService extends BaseTenantCrudService<
        PetVaccination,
        PetVaccinationCreateRequest,
        PetVaccinationUpdateRequest,
        PetVaccinationResponse> {

    private final PetVaccinationRepository repository;
    private final PetAppointmentRepository petAppointmentRepository;
    private final PetProfileRepository petProfileRepository;

    public PetVaccinationService(
            PetVaccinationRepository repository,
            PetAppointmentRepository petAppointmentRepository,
            PetProfileRepository petProfileRepository
    ) {
        super(repository, repository, PetVaccinationMapper.INSTANCE, "Pet vaccination not found.");
        this.repository = repository;
        this.petAppointmentRepository = petAppointmentRepository;
        this.petProfileRepository = petProfileRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetVaccinationCreateRequest request, PetVaccination entity) {
        validatePet(tenantId, request.petId(), request.appointmentId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetVaccinationUpdateRequest request, PetVaccination entity) {
        validatePet(tenantId, request.petId(), request.appointmentId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_vaccination")
    public PetVaccinationResponse create(PetVaccinationCreateRequest request) {
        PetVaccinationResponse response = doCreate(request);
        return getById(response.id());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetVaccinationResponse> list(PageRequestDto pageRequest, UUID petId, UUID appointmentId) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "appliedAt"));
        Page<PetVaccination> vaccinations = repository.findAllByTenantIdAndSearch(
                tenantId,
                petId,
                appointmentId,
                query.search(),
                query.pageable()
        );
        Map<UUID, String> petNames = loadPetNames(tenantId, vaccinations.getContent().stream()
                .map(PetVaccination::getPetId)
                .collect(Collectors.toSet()));
        Map<UUID, PetAppointment> appointments = loadAppointments(tenantId, vaccinations.getContent().stream()
                .map(PetVaccination::getAppointmentId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet()));
        return PaginationUtils.fromPage(vaccinations.map(vaccination -> toResponse(vaccination, petNames, appointments)));
    }

    @Transactional(readOnly = true)
    public PetVaccinationResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toResponse(getOrThrow(id, tenantId), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_vaccination")
    public PetVaccinationResponse update(UUID id, PetVaccinationUpdateRequest request) {
        PetVaccinationResponse response = doUpdate(id, request);
        return getById(response.id());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_vaccination")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_vaccination")
    public PetVaccinationResponse restore(UUID id) {
        PetVaccinationResponse response = doRestore(id);
        return getById(response.id());
    }

    private void validatePet(UUID tenantId, UUID petId, UUID appointmentId) {
        petProfileRepository.findByIdAndTenantId(petId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet profile not found for tenant."));

        if (appointmentId != null) {
            validateAppointmentContext(tenantId, appointmentId, petId);
        }
    }

    private PetVaccinationResponse toResponse(PetVaccination vaccination, UUID tenantId) {
        PetAppointment appointment = resolveAppointment(tenantId, vaccination.getAppointmentId());
        return PetVaccinationMapper.INSTANCE.toResponse(
                vaccination,
                petProfileRepository.findByIdAndTenantId(vaccination.getPetId(), tenantId).map(PetProfile::getName).orElse(null),
                appointment == null ? null : appointment.getServiceName(),
                appointment == null ? null : appointment.getScheduledAt()
        );
    }

    private PetVaccinationResponse toResponse(
            PetVaccination vaccination,
            Map<UUID, String> petNames,
            Map<UUID, PetAppointment> appointments
    ) {
        PetAppointment appointment = appointments.get(vaccination.getAppointmentId());
        return PetVaccinationMapper.INSTANCE.toResponse(
                vaccination,
                petNames.get(vaccination.getPetId()),
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

    private void validateAppointmentContext(UUID tenantId, UUID appointmentId, UUID petId) {
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

        String normalizedStatus = appointment.getStatus() == null ? "" : appointment.getStatus().trim().toUpperCase();
        if ("CANCELED".equals(normalizedStatus) || "NO_SHOW".equals(normalizedStatus)) {
            throw new ConflictOperationException("Canceled or missed pet appointments cannot receive vaccination records.");
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
