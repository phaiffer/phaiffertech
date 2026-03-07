package com.phaiffertech.platform.modules.crm.pipeline.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "crm_pipeline_stages")
@SQLDelete(sql = "UPDATE crm_pipeline_stages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class CrmPipelineStage extends BaseTenantEntity {

    @Column(name = "pipeline_id", nullable = false, columnDefinition = "char(36)")
    private UUID pipelineId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "code", length = 60)
    private String code;

    @Column(name = "position", nullable = false)
    private int position;

    @Column(name = "color", length = 24)
    private String color;

    @Column(name = "is_default", nullable = false)
    private boolean defaultStage;

    public UUID getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(UUID pipelineId) {
        this.pipelineId = pipelineId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public boolean isDefaultStage() {
        return defaultStage;
    }

    public void setDefaultStage(boolean defaultStage) {
        this.defaultStage = defaultStage;
    }
}
