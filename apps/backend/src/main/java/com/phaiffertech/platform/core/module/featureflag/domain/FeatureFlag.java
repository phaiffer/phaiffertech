package com.phaiffertech.platform.core.module.featureflag.domain;

import com.phaiffertech.platform.shared.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "feature_flags")
public class FeatureFlag extends BaseEntity {

    @Column(name = "flag_key", nullable = false, length = 120)
    private String flagKey;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "tenant_id", columnDefinition = "char(36)")
    private UUID tenantId;

    public String getFlagKey() {
        return flagKey;
    }

    public void setFlagKey(String flagKey) {
        this.flagKey = flagKey;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }
}
