package com.phaiffertech.platform.modules.pet.billing.repository;

import com.phaiffertech.platform.modules.pet.billing.domain.PetBillingMessageSettings;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetBillingMessageSettingsRepository
        extends JpaRepository<PetBillingMessageSettings, UUID>, BaseTenantCrudRepository<PetBillingMessageSettings> {

    Optional<PetBillingMessageSettings> findByTenantId(UUID tenantId);

    Optional<PetBillingMessageSettings> findByIdAndTenantId(UUID id, UUID tenantId);
}
