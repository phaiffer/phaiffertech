package com.phaiffertech.platform.modules.crm.pipeline.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "crm_pipelines")
@SQLDelete(sql = "UPDATE crm_pipelines SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class CrmPipeline extends BaseTenantEntity {

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "is_default", nullable = false)
    private boolean defaultPipeline;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isDefaultPipeline() {
        return defaultPipeline;
    }

    public void setDefaultPipeline(boolean defaultPipeline) {
        this.defaultPipeline = defaultPipeline;
    }
}
