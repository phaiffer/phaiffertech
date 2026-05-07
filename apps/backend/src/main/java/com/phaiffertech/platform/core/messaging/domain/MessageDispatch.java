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
@Table(name = "message_dispatches")
@SQLDelete(sql = "UPDATE message_dispatches SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class MessageDispatch extends BaseTenantEntity {

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "template_mapping_id")
    private UUID templateMappingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_type", nullable = false, length = 40)
    private MessageChannelType channelType;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 60)
    private MessageProvider provider;

    @Column(name = "business_key", nullable = false, length = 80)
    private String businessKey;

    @Column(name = "recipient_phone", nullable = false, length = 40)
    private String recipientPhone;

    @Column(name = "recipient_name", length = 160)
    private String recipientName;

    @Column(name = "subject", length = 180)
    private String subject;

    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private MessageDispatchStatus status = MessageDispatchStatus.PENDING;

    @Column(name = "provider_message_id", length = 160)
    private String providerMessageId;

    @Column(name = "related_type", length = 80)
    private String relatedType;

    @Column(name = "related_id")
    private UUID relatedId;

    @Column(name = "failure_reason", columnDefinition = "text")
    private String failureReason;

    @Column(name = "provider_request_payload", columnDefinition = "text")
    private String providerRequestPayload;

    @Column(name = "provider_response_payload", columnDefinition = "text")
    private String providerResponsePayload;

    @Column(name = "sent_at")
    private Instant sentAt;

    public UUID getChannelId() { return channelId; }
    public void setChannelId(UUID channelId) { this.channelId = channelId; }
    public UUID getTemplateMappingId() { return templateMappingId; }
    public void setTemplateMappingId(UUID templateMappingId) { this.templateMappingId = templateMappingId; }
    public MessageChannelType getChannelType() { return channelType; }
    public void setChannelType(MessageChannelType channelType) { this.channelType = channelType; }
    public MessageProvider getProvider() { return provider; }
    public void setProvider(MessageProvider provider) { this.provider = provider; }
    public String getBusinessKey() { return businessKey; }
    public void setBusinessKey(String businessKey) { this.businessKey = businessKey; }
    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public MessageDispatchStatus getStatus() { return status; }
    public void setStatus(MessageDispatchStatus status) { this.status = status; }
    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String providerMessageId) { this.providerMessageId = providerMessageId; }
    public String getRelatedType() { return relatedType; }
    public void setRelatedType(String relatedType) { this.relatedType = relatedType; }
    public UUID getRelatedId() { return relatedId; }
    public void setRelatedId(UUID relatedId) { this.relatedId = relatedId; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public String getProviderRequestPayload() { return providerRequestPayload; }
    public void setProviderRequestPayload(String providerRequestPayload) { this.providerRequestPayload = providerRequestPayload; }
    public String getProviderResponsePayload() { return providerResponsePayload; }
    public void setProviderResponsePayload(String providerResponsePayload) { this.providerResponsePayload = providerResponsePayload; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
