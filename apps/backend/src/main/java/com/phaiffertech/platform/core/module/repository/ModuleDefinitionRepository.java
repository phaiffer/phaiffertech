package com.phaiffertech.platform.core.module.repository;

import com.phaiffertech.platform.core.module.domain.ModuleDefinition;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModuleDefinitionRepository extends JpaRepository<ModuleDefinition, UUID> {

    Optional<ModuleDefinition> findByCode(String code);

    Optional<ModuleDefinition> findByCodeAndActiveTrueAndDeletedAtIsNull(String code);
}
