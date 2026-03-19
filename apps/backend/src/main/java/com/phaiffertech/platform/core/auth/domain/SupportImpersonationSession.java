package com.phaiffertech.platform.core.auth.domain;

import com.phaiffertech.platform.shared.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "support_impersonation_sessions")
public class SupportImpersonationSession extends BaseEntity {

    @Column(name = "platform_admin_user_id", nullable = false)
    private UUID platformAdminUserId;

    @Column(name = "platform_admin_tenant_id", nullable = false)
    private UUID platformAdminTenantId;

    @Column(name = "target_tenant_id", nullable = false)
    private UUID targetTenantId;

    @Column(name = "target_user_id")
    private UUID targetUserId;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private SupportImpersonationStatus status;

    public UUID getPlatformAdminUserId() {
        return platformAdminUserId;
    }

    public void setPlatformAdminUserId(UUID platformAdminUserId) {
        this.platformAdminUserId = platformAdminUserId;
    }

    public UUID getPlatformAdminTenantId() {
        return platformAdminTenantId;
    }

    public void setPlatformAdminTenantId(UUID platformAdminTenantId) {
        this.platformAdminTenantId = platformAdminTenantId;
    }

    public UUID getTargetTenantId() {
        return targetTenantId;
    }

    public void setTargetTenantId(UUID targetTenantId) {
        this.targetTenantId = targetTenantId;
    }

    public UUID getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(UUID targetUserId) {
        this.targetUserId = targetUserId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public SupportImpersonationStatus getStatus() {
        return status;
    }

    public void setStatus(SupportImpersonationStatus status) {
        this.status = status;
    }
}
