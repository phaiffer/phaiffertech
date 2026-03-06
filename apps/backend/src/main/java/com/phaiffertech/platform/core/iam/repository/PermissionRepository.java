package com.phaiffertech.platform.core.iam.repository;

import com.phaiffertech.platform.core.iam.domain.Permission;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    boolean existsByCode(String code);
}
