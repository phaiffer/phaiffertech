package com.phaiffertech.platform.modules.pet.plan.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "pet_client_plans")
@SQLDelete(sql = "UPDATE pet_client_plans SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class ClientPlan extends BaseTenantEntity {

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "pet_id")
    private UUID petId;

    @Column(name = "plan_template_id")
    private UUID planTemplateId;

    @Column(name = "plan_name", nullable = false)
    private String planName;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions;

    @Column(name = "used_sessions", nullable = false)
    private Integer usedSessions = 0;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "final_price", precision = 10, scale = 2)
    private java.math.BigDecimal finalPrice;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "ACTIVE";

    @Column(name = "renewal_rules", columnDefinition = "text")
    private String renewalRules;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    public int getRemainingSessions() {
        if (totalSessions == null || usedSessions == null) {
            return 0;
        }
        return totalSessions - usedSessions;
    }
}
