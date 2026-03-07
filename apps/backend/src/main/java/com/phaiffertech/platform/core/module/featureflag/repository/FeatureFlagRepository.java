package com.phaiffertech.platform.core.module.featureflag.repository;

import com.phaiffertech.platform.core.module.featureflag.domain.FeatureFlag;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, UUID> {

    Optional<FeatureFlag> findByFlagKeyAndTenantIdAndDeletedAtIsNull(String flagKey, UUID tenantId);

    Optional<FeatureFlag> findByFlagKeyAndTenantIdIsNullAndDeletedAtIsNull(String flagKey);

    List<FeatureFlag> findAllByTenantIdIsNullAndDeletedAtIsNull();

    List<FeatureFlag> findAllByTenantIdAndDeletedAtIsNull(UUID tenantId);
}
