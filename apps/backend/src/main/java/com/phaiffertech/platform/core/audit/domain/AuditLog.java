package com.phaiffertech.platform.core.audit.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog extends BaseTenantEntity {

    @Column(name = "user_id", columnDefinition = "char(36)")
    private UUID userId;

    @Column(name = "action", nullable = false, length = 80)
    private String action;

    @Column(name = "entity_name", nullable = false, length = 120)
    private String entity;

    @Column(name = "entity_id", length = 36)
    private String entityId;

    @Column(name = "payload", columnDefinition = "text")
    private String payload;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getEntity() {
        return entity;
    }

    public void setEntity(String entity) {
        this.entity = entity;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
}
