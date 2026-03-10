package com.phaiffertech.platform.core.tenant.repository;

import com.phaiffertech.platform.core.tenant.domain.Tenant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Optional<Tenant> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);

    boolean existsByPlatformOwnerTrueAndDeletedAtIsNull();

    boolean existsByPlatformOwnerTrueAndDeletedAtIsNullAndIdNot(UUID id);

    Page<Tenant> findAllByDeletedAtIsNull(Pageable pageable);

    List<Tenant> findAllByIdIn(Collection<UUID> ids);
}
