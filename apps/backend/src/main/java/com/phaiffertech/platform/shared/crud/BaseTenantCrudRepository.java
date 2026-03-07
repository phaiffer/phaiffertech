package com.phaiffertech.platform.shared.crud;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import java.util.Optional;
import java.util.UUID;

public interface BaseTenantCrudRepository<E extends BaseTenantEntity> {

    Optional<E> findByIdAndTenantId(UUID id, UUID tenantId);

    default Optional<E> findByIdIncludingDeleted(UUID id, UUID tenantId) {
        return findByIdAndTenantId(id, tenantId);
    }

}
