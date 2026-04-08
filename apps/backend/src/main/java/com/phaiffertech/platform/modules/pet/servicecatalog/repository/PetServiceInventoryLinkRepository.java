package com.phaiffertech.platform.modules.pet.servicecatalog.repository;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceInventoryLink;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetServiceInventoryLinkRepository extends JpaRepository<PetServiceInventoryLink, UUID> {

    List<PetServiceInventoryLink> findAllByTenantIdAndServiceIdInOrderByServiceIdAscCreatedAtAsc(
            UUID tenantId,
            Collection<UUID> serviceIds
    );

    List<PetServiceInventoryLink> findAllByTenantIdAndServiceIdInAndActiveTrueOrderByServiceIdAscCreatedAtAsc(
            UUID tenantId,
            Collection<UUID> serviceIds
    );

    void deleteAllByTenantIdAndServiceId(UUID tenantId, UUID serviceId);
}
