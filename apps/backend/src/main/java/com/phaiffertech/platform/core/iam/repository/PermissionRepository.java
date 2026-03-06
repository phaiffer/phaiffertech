package com.phaiffertech.platform.core.iam.repository;

import com.phaiffertech.platform.core.iam.domain.Permission;

import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    boolean existsByCode(String code);

    @Query(
            value = """
                    SELECT p.code
                    FROM permissions p
                    JOIN role_permissions rp ON rp.permission_id = p.id
                    WHERE rp.role_id = :roleId
                    """,
            nativeQuery = true
    )
    Set<String> findPermissionCodesByRoleId(@Param("roleId") UUID roleId);

    @Query(
            value = """
                    SELECT DISTINCT p.code
                    FROM permissions p
                    JOIN role_permissions rp ON rp.permission_id = p.id
                    WHERE rp.role_id IN (:roleIds)
                    """,
            nativeQuery = true
    )
    Set<String> findPermissionCodesByRoleIds(@Param("roleIds") Collection<UUID> roleIds);
}
