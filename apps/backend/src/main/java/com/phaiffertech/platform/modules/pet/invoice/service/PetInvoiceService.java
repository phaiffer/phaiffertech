package com.phaiffertech.platform.modules.pet.invoice.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
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
import java.util.UUID;
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
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetInvoiceResponse> list(
            PageRequestDto pageRequest,
            UUID clientId,
            String status
    ) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.DESC, "issuedAt"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        clientId,
                        BaseSearchSpecificationBuilder.normalizeUpper(status),
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetInvoiceResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_invoice")
    public PetInvoiceResponse update(UUID id, PetInvoiceUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_invoice")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_invoice")
    public PetInvoiceResponse restore(UUID id) {
        return doRestore(id);
    }

    private void validateClient(UUID tenantId, UUID clientId) {
        petClientRepository.findByIdAndTenantId(clientId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet client not found for tenant."));
    }
}
