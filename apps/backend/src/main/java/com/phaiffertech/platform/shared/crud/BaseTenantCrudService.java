package com.phaiffertech.platform.shared.crud;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public abstract class BaseTenantCrudService<E extends BaseTenantEntity, CreateReq, UpdateReq, Res>
        implements BaseSoftDeleteService<E>, BaseAuditableCrudHooks<E, CreateReq, UpdateReq> {

    private final BaseTenantCrudRepository<E> repository;
    private final JpaRepository<E, UUID> writableRepository;
    private final BaseCrudMapper<E, CreateReq, UpdateReq, Res> mapper;
    private final String notFoundMessage;

    protected BaseTenantCrudService(
            BaseTenantCrudRepository<E> repository,
            JpaRepository<E, UUID> writableRepository,
            BaseCrudMapper<E, CreateReq, UpdateReq, Res> mapper,
            String notFoundMessage
    ) {
        this.repository = repository;
        this.writableRepository = writableRepository;
        this.mapper = mapper;
        this.notFoundMessage = notFoundMessage;
    }

    protected Res doCreate(CreateReq request) {
        UUID tenantId = currentTenantId();
        E entity = mapper.toNewEntity(request);
        entity.setTenantId(tenantId);

        beforeCreate(tenantId, request, entity);
        return mapper.toResponse(writableRepository.save(entity));
    }

    protected PageResponseDto<Res> doList(
            PageRequestDto pageRequest,
            Sort defaultSort,
            Function<BasePageQuery, Page<E>> pageLoader
    ) {
        BasePageQuery query = BasePageQuery.of(pageRequest, defaultSort);
        Page<Res> mapped = pageLoader.apply(query).map(mapper::toResponse);
        return PaginationUtils.fromPage(mapped);
    }

    protected Res doGetById(UUID id) {
        UUID tenantId = currentTenantId();
        return mapper.toResponse(getOrThrow(id, tenantId));
    }

    protected Res doUpdate(UUID id, UpdateReq request) {
        UUID tenantId = currentTenantId();
        E entity = getOrThrow(id, tenantId);

        mapper.updateEntity(entity, request);
        beforeUpdate(tenantId, request, entity);

        return mapper.toResponse(writableRepository.save(entity));
    }

    protected void doSoftDelete(UUID id) {
        UUID tenantId = currentTenantId();
        E entity = getOrThrow(id, tenantId);

        beforeDelete(tenantId, entity);
        softDelete(entity);
        writableRepository.save(entity);
    }

    protected Res doRestore(UUID id) {
        UUID tenantId = currentTenantId();
        E entity = getIncludingDeletedOrThrow(id, tenantId);

        beforeRestore(tenantId, entity);
        restore(entity);

        return mapper.toResponse(writableRepository.save(entity));
    }

    protected E getOrThrow(UUID id, UUID tenantId) {
        return repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException(notFoundMessage));
    }

    protected E getIncludingDeletedOrThrow(UUID id, UUID tenantId) {
        return repository.findByIdIncludingDeleted(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException(notFoundMessage));
    }

    protected UUID currentTenantId() {
        return TenantContext.getRequiredTenantId();
    }
}
