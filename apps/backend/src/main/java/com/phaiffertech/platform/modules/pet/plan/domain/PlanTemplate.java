package com.phaiffertech.platform.modules.pet.plan.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Getter
@Setter
@Entity
@Table(name = "pet_plan_templates")
@SQLDelete(sql = "UPDATE pet_plan_templates SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PlanTemplate extends BaseTenantEntity {

    @Column(name = "commercial_name", nullable = false, length = 150)
    private String commercialName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "validity_days", nullable = false)
    private Integer validityDays;

    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions;

    @Column(name = "renewal_rules", columnDefinition = "text")
    private String renewalRules;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
