package com.phaiffertech.platform.core.module.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "tenant_modules")
public class TenantModule extends BaseTenantEntity {

    @Column(name = "module_definition_id", nullable = false, columnDefinition = "char(36)")
    private UUID moduleDefinitionId;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    public UUID getModuleDefinitionId() {
        return moduleDefinitionId;
    }

    public void setModuleDefinitionId(UUID moduleDefinitionId) {
        this.moduleDefinitionId = moduleDefinitionId;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
