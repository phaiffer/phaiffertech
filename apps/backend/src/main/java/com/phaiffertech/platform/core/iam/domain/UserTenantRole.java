package com.phaiffertech.platform.core.iam.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_tenant_roles")
public class UserTenantRole {

    @Id
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "char(36)")
    private UUID id;

    @Column(name = "user_tenant_id", nullable = false, columnDefinition = "char(36)")
    private UUID userTenantId;

    @Column(name = "role_id", nullable = false, columnDefinition = "char(36)")
    private UUID roleId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserTenantId() {
        return userTenantId;
    }

    public void setUserTenantId(UUID userTenantId) {
        this.userTenantId = userTenantId;
    }

    public UUID getRoleId() {
        return roleId;
    }

    public void setRoleId(UUID roleId) {
        this.roleId = roleId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
