package com.phaiffertech.platform.core.messaging.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "message_delivery_events")
@SQLDelete(sql = "UPDATE message_delivery_events SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class MessageDeliveryEvent extends BaseTenantEntity {

    @Column(name = "channel_id")
    private UUID channelId;

    @Column(name = "dispatch_id")
    private UUID dispatchId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_type", nullable = false, length = 40)
    private MessageChannelType channelType;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 60)
    private MessageProvider provider;

    @Column(name = "provider_message_id", length = 160)
    private String providerMessageId;

    @Column(name = "provider_event_type", nullable = false, length = 80)
    private String providerEventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", length = 30)
    private MessageDispatchStatus deliveryStatus;

    @Column(name = "raw_payload", nullable = false, columnDefinition = "text")
    private String rawPayload;

    @Column(name = "occurred_at")
    private Instant occurredAt;

    public UUID getChannelId() { return channelId; }
    public void setChannelId(UUID channelId) { this.channelId = channelId; }
    public UUID getDispatchId() { return dispatchId; }
    public void setDispatchId(UUID dispatchId) { this.dispatchId = dispatchId; }
    public MessageChannelType getChannelType() { return channelType; }
    public void setChannelType(MessageChannelType channelType) { this.channelType = channelType; }
    public MessageProvider getProvider() { return provider; }
    public void setProvider(MessageProvider provider) { this.provider = provider; }
    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String providerMessageId) { this.providerMessageId = providerMessageId; }
    public String getProviderEventType() { return providerEventType; }
    public void setProviderEventType(String providerEventType) { this.providerEventType = providerEventType; }
    public MessageDispatchStatus getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(MessageDispatchStatus deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public String getRawPayload() { return rawPayload; }
    public void setRawPayload(String rawPayload) { this.rawPayload = rawPayload; }
    public Instant getOccurredAt() { return occurredAt; }
    public void setOccurredAt(Instant occurredAt) { this.occurredAt = occurredAt; }
}
