package com.phaiffertech.platform.core.messaging.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "message_template_mappings")
@SQLDelete(sql = "UPDATE message_template_mappings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class MessageTemplateMapping extends BaseTenantEntity {

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "business_key", nullable = false, length = 80)
    private String businessKey;

    @Column(name = "provider_template_name", length = 120)
    private String providerTemplateName;

    @Column(name = "provider_template_language", length = 16)
    private String providerTemplateLanguage;

    @Column(name = "fallback_body", columnDefinition = "text")
    private String fallbackBody;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public UUID getChannelId() {
        return channelId;
    }

    public void setChannelId(UUID channelId) {
        this.channelId = channelId;
    }

    public String getBusinessKey() {
        return businessKey;
    }

    public void setBusinessKey(String businessKey) {
        this.businessKey = businessKey;
    }

    public String getProviderTemplateName() {
        return providerTemplateName;
    }

    public void setProviderTemplateName(String providerTemplateName) {
        this.providerTemplateName = providerTemplateName;
    }

    public String getProviderTemplateLanguage() {
        return providerTemplateLanguage;
    }

    public void setProviderTemplateLanguage(String providerTemplateLanguage) {
        this.providerTemplateLanguage = providerTemplateLanguage;
    }

    public String getFallbackBody() {
        return fallbackBody;
    }

    public void setFallbackBody(String fallbackBody) {
        this.fallbackBody = fallbackBody;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
