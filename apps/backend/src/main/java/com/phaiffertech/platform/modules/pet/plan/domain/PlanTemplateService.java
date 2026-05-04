package com.phaiffertech.platform.modules.pet.plan.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Getter
@Setter
@Entity
@Table(name = "pet_plan_template_services")
@SQLDelete(sql = "UPDATE pet_plan_template_services SET deleted_at = NOW() WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PlanTemplateService extends BaseTenantEntity {

    @Column(name = "plan_template_id", nullable = false)
    private UUID planTemplateId;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;
}
