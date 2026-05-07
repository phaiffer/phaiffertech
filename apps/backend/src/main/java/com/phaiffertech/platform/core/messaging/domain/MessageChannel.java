package com.phaiffertech.platform.core.messaging.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "message_channels")
@SQLDelete(sql = "UPDATE message_channels SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class MessageChannel extends BaseTenantEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_type", nullable = false, length = 40)
    private MessageChannelType channelType;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 60)
    private MessageProvider provider;

    @Column(name = "display_name", length = 120)
    private String displayName;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "phone_number_id", length = 120)
    private String phoneNumberId;

    @Column(name = "business_account_id", length = 120)
    private String businessAccountId;

    @Column(name = "access_token_secret", columnDefinition = "text")
    private String accessTokenSecret;

    @Column(name = "webhook_verify_token_secret", columnDefinition = "text")
    private String webhookVerifyTokenSecret;

    @Column(name = "provider_api_version", nullable = false, length = 24)
    private String providerApiVersion = "v25.0";

    public MessageChannelType getChannelType() {
        return channelType;
    }

    public void setChannelType(MessageChannelType channelType) {
        this.channelType = channelType;
    }

    public MessageProvider getProvider() {
        return provider;
    }

    public void setProvider(MessageProvider provider) {
        this.provider = provider;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPhoneNumberId() {
        return phoneNumberId;
    }

    public void setPhoneNumberId(String phoneNumberId) {
        this.phoneNumberId = phoneNumberId;
    }

    public String getBusinessAccountId() {
        return businessAccountId;
    }

    public void setBusinessAccountId(String businessAccountId) {
        this.businessAccountId = businessAccountId;
    }

    public String getAccessTokenSecret() {
        return accessTokenSecret;
    }

    public void setAccessTokenSecret(String accessTokenSecret) {
        this.accessTokenSecret = accessTokenSecret;
    }

    public String getWebhookVerifyTokenSecret() {
        return webhookVerifyTokenSecret;
    }

    public void setWebhookVerifyTokenSecret(String webhookVerifyTokenSecret) {
        this.webhookVerifyTokenSecret = webhookVerifyTokenSecret;
    }

    public String getProviderApiVersion() {
        return providerApiVersion;
    }

    public void setProviderApiVersion(String providerApiVersion) {
        this.providerApiVersion = providerApiVersion;
    }
}
