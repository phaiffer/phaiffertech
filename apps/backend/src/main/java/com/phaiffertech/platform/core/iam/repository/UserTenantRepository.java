package com.phaiffertech.platform.core.iam.repository;

import com.phaiffertech.platform.core.iam.domain.UserTenant;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTenantRepository extends JpaRepository<UserTenant, UUID> {

    long countByTenantIdAndActiveTrue(UUID tenantId);

    Optional<UserTenant> findByTenantIdAndUserIdAndActiveTrue(UUID tenantId, UUID userId);

    Page<UserTenant> findAllByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    boolean existsByTenantIdAndUserId(UUID tenantId, UUID userId);
}
