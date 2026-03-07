package com.phaiffertech.platform.shared.crud;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import java.util.UUID;

public interface BaseAuditableCrudHooks<E extends BaseTenantEntity, CreateReq, UpdateReq> {

    default void beforeCreate(UUID tenantId, CreateReq request, E entity) {
    }

    default void beforeUpdate(UUID tenantId, UpdateReq request, E entity) {
    }

    default void beforeDelete(UUID tenantId, E entity) {
    }

    default void beforeRestore(UUID tenantId, E entity) {
    }
}
