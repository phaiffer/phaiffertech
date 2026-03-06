package com.phaiffertech.platform.modules.pet.client.repository;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetClientRepository extends JpaRepository<PetClient, UUID> {

    Page<PetClient> findAllByTenantId(UUID tenantId, Pageable pageable);
}
