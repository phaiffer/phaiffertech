package com.phaiffertech.platform.shared.crud;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import java.time.Instant;

public interface BaseSoftDeleteService<E extends BaseTenantEntity> {

    default void softDelete(E entity) {
        entity.setDeletedAt(Instant.now());
    }

    default void restore(E entity) {
        entity.setDeletedAt(null);
    }
}
