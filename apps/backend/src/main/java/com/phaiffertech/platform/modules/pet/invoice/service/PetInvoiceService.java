package com.phaiffertech.platform.modules.pet.invoice.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.invoice.domain.PetInvoice;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceCreateRequest;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceResponse;
import com.phaiffertech.platform.modules.pet.invoice.dto.PetInvoiceUpdateRequest;
import com.phaiffertech.platform.modules.pet.invoice.mapper.PetInvoiceMapper;
import com.phaiffertech.platform.modules.pet.invoice.repository.PetInvoiceRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseSearchSpecificationBuilder;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
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
public class PetInvoiceService extends BaseTenantCrudService<
        PetInvoice,
        PetInvoiceCreateRequest,
        PetInvoiceUpdateRequest,
        PetInvoiceResponse> {

    private final PetInvoiceRepository repository;
    private final PetClientRepository petClientRepository;

    public PetInvoiceService(
            PetInvoiceRepository repository,
            PetClientRepository petClientRepository
    ) {
        super(repository, repository, PetInvoiceMapper.INSTANCE, "Pet invoice not found.");
        this.repository = repository;
        this.petClientRepository = petClientRepository;
    }

    @Override
    public void beforeCreate(UUID tenantId, PetInvoiceCreateRequest request, PetInvoice entity) {
        validateClient(tenantId, request.clientId());
    }

    @Override
    public void beforeUpdate(UUID tenantId, PetInvoiceUpdateRequest request, PetInvoice entity) {
        validateClient(tenantId, request.clientId());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_invoice")
    public PetInvoiceResponse create(PetInvoiceCreateRequest request) {
        PetInvoiceResponse response = doCreate(request);
        return getById(response.id());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetInvoiceResponse> list(
            PageRequestDto pageRequest,
            UUID clientId,
            String status
    ) {
        UUID tenantId = currentTenantId();
        BasePageQuery query = BasePageQuery.of(pageRequest, Sort.by(Sort.Direction.DESC, "issuedAt"));
        Page<PetInvoice> invoices = repository.findAllByTenantIdAndSearch(
                tenantId,
                clientId,
                BaseSearchSpecificationBuilder.normalizeUpper(status),
                query.search(),
                query.pageable()
        );
        Map<UUID, String> clientNames = loadClientNames(tenantId, invoices.getContent().stream()
                .map(PetInvoice::getClientId)
                .collect(Collectors.toSet()));
        return PaginationUtils.fromPage(invoices.map(invoice -> toResponse(invoice, clientNames)));
    }

    @Transactional(readOnly = true)
    public PetInvoiceResponse getById(UUID id) {
        UUID tenantId = currentTenantId();
        return toResponse(getOrThrow(id, tenantId), tenantId);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_invoice")
    public PetInvoiceResponse update(UUID id, PetInvoiceUpdateRequest request) {
        PetInvoiceResponse response = doUpdate(id, request);
        return getById(response.id());
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_invoice")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_invoice")
    public PetInvoiceResponse restore(UUID id) {
        PetInvoiceResponse response = doRestore(id);
        return getById(response.id());
    }

    private void validateClient(UUID tenantId, UUID clientId) {
        petClientRepository.findByIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found for tenant."));
    }

    private PetInvoiceResponse toResponse(PetInvoice invoice, UUID tenantId) {
        return PetInvoiceMapper.INSTANCE.toResponse(
                invoice,
                resolveClientName(petClientRepository.findByIdAndTenantId(invoice.getClientId(), tenantId).orElse(null))
        );
    }

    private PetInvoiceResponse toResponse(PetInvoice invoice, Map<UUID, String> clientNames) {
        return PetInvoiceMapper.INSTANCE.toResponse(invoice, clientNames.get(invoice.getClientId()));
    }

    private Map<UUID, String> loadClientNames(UUID tenantId, Collection<UUID> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return toMap(
                petClientRepository.findAllByTenantIdAndIdIn(tenantId, ids),
                PetClient::getId,
                this::resolveClientName
        );
    }

    private <E> Map<UUID, String> toMap(
            Collection<E> entities,
            Function<E, UUID> idResolver,
            Function<E, String> valueResolver
    ) {
        return entities.stream().collect(Collectors.toMap(idResolver, valueResolver));
    }

    private String resolveClientName(PetClient client) {
        if (client == null) {
            return null;
        }
        if (client.getName() != null && !client.getName().isBlank()) {
            return client.getName();
        }
        return client.getFullName();
    }
}
