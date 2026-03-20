package com.phaiffertech.platform.core.finance.fiscal.repository;

import com.phaiffertech.platform.core.finance.fiscal.domain.TenantFiscalProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TenantFiscalProfileRepository extends JpaRepository<TenantFiscalProfile, UUID> {

    Optional<TenantFiscalProfile> findByTenantIdAndDeletedAtIsNull(UUID tenantId);

    Optional<TenantFiscalProfile> findByTenantIdAndDeletedAtIsNullAndEnabledTrue(UUID tenantId);

    @Query(value = """
            SELECT *
            FROM tenant_fiscal_profiles p
            WHERE p.tenant_id = :tenantId
            LIMIT 1
            """, nativeQuery = true)
    Optional<TenantFiscalProfile> findByTenantIdIncludingDeleted(@Param("tenantId") UUID tenantId);
}
