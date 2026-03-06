package com.phaiffertech.platform.core.iam.repository;

import com.phaiffertech.platform.core.iam.domain.Role;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByCode(String code);
}
