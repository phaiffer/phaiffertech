package com.phaiffertech.platform.modules.crm.deal.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "crm_deals")
@SQLDelete(sql = "UPDATE crm_deals SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class CrmDeal extends BaseTenantEntity {

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "amount", precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 8)
    private String currency = "BRL";

    @Column(name = "status", nullable = false, length = 40)
    private String status = "OPEN";

    @Column(name = "pipeline_id", nullable = false, columnDefinition = "char(36)")
    private UUID pipelineId;

    @Column(name = "pipeline_stage_id", columnDefinition = "char(36)")
    private UUID pipelineStageId;

    @Column(name = "company_id", columnDefinition = "char(36)")
    private UUID companyId;

    @Column(name = "contact_id", columnDefinition = "char(36)")
    private UUID contactId;

    @Column(name = "lead_id", columnDefinition = "char(36)")
    private UUID leadId;

    @Column(name = "owner_user_id", columnDefinition = "char(36)")
    private UUID ownerUserId;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getPipelineId() {
        return pipelineId;
    }

    public void setPipelineId(UUID pipelineId) {
        this.pipelineId = pipelineId;
    }

    public UUID getPipelineStageId() {
        return pipelineStageId;
    }

    public void setPipelineStageId(UUID pipelineStageId) {
        this.pipelineStageId = pipelineStageId;
    }

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        this.companyId = companyId;
    }

    public UUID getContactId() {
        return contactId;
    }

    public void setContactId(UUID contactId) {
        this.contactId = contactId;
    }

    public UUID getLeadId() {
        return leadId;
    }

    public void setLeadId(UUID leadId) {
        this.leadId = leadId;
    }

    public UUID getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(UUID ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public LocalDate getExpectedCloseDate() {
        return expectedCloseDate;
    }

    public void setExpectedCloseDate(LocalDate expectedCloseDate) {
        this.expectedCloseDate = expectedCloseDate;
    }
}
