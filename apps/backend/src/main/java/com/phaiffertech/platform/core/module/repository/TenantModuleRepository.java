package com.phaiffertech.platform.core.module.repository;

import com.phaiffertech.platform.core.module.domain.TenantModule;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantModuleRepository extends JpaRepository<TenantModule, UUID> {

    List<TenantModule> findByTenantIdAndEnabledTrue(UUID tenantId);

    boolean existsByTenantIdAndModuleDefinitionIdAndEnabledTrueAndDeletedAtIsNull(UUID tenantId, UUID moduleDefinitionId);
}
