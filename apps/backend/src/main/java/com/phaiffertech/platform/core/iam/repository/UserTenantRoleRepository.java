package com.phaiffertech.platform.core.iam.repository;

import com.phaiffertech.platform.core.iam.domain.UserTenantRole;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTenantRoleRepository extends JpaRepository<UserTenantRole, UUID> {

    List<UserTenantRole> findAllByUserTenantId(UUID userTenantId);

    boolean existsByUserTenantIdAndRoleId(UUID userTenantId, UUID roleId);

    @Query(
            value = """
                    SELECT utr.role_id
                    FROM user_tenant_roles utr
                    WHERE utr.user_tenant_id = :userTenantId
                    """,
            nativeQuery = true
    )
    Set<UUID> findRoleIdsByUserTenantId(@Param("userTenantId") UUID userTenantId);

    @Query(
            value = """
                    SELECT r.code
                    FROM user_tenant_roles utr
                    JOIN roles r ON r.id = utr.role_id
                    WHERE utr.user_tenant_id = :userTenantId
                    """,
            nativeQuery = true
    )
    Set<String> findRoleCodesByUserTenantId(@Param("userTenantId") UUID userTenantId);
}
