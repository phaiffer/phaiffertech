package com.phaiffertech.platform.shared.domain.base;

import com.phaiffertech.platform.shared.tenancy.TenantContext;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import java.util.UUID;

@MappedSuperclass
public abstract class BaseTenantEntity extends BaseEntity {

    @Column(name = "tenant_id", nullable = false, columnDefinition = "char(36)")
    private UUID tenantId;

    @PrePersist
    public void ensureTenantId() {
        if (tenantId == null) {
            tenantId = TenantContext.getRequiredTenantId();
        }
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }
}
