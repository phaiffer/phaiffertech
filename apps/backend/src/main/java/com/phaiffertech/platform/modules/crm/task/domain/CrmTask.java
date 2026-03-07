package com.phaiffertech.platform.modules.crm.task.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "crm_tasks")
@SQLDelete(sql = "UPDATE crm_tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class CrmTask extends BaseTenantEntity {

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "OPEN";

    @Column(name = "priority", nullable = false, length = 40)
    private String priority = "MEDIUM";

    @Column(name = "assigned_user_id", columnDefinition = "char(36)")
    private UUID assignedUserId;

    @Column(name = "company_id", columnDefinition = "char(36)")
    private UUID companyId;

    @Column(name = "contact_id", columnDefinition = "char(36)")
    private UUID contactId;

    @Column(name = "lead_id", columnDefinition = "char(36)")
    private UUID leadId;

    @Column(name = "deal_id", columnDefinition = "char(36)")
    private UUID dealId;

    @Column(name = "related_type", nullable = false, length = 60)
    private String relatedType;

    @Column(name = "related_id", nullable = false, columnDefinition = "char(36)")
    private UUID relatedId;

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

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public UUID getAssignedUserId() {
        return assignedUserId;
    }

    public void setAssignedUserId(UUID assignedUserId) {
        this.assignedUserId = assignedUserId;
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

    public UUID getDealId() {
        return dealId;
    }

    public void setDealId(UUID dealId) {
        this.dealId = dealId;
    }

    public String getRelatedType() {
        return relatedType;
    }

    public void setRelatedType(String relatedType) {
        this.relatedType = relatedType;
    }

    public UUID getRelatedId() {
        return relatedId;
    }

    public void setRelatedId(UUID relatedId) {
        this.relatedId = relatedId;
    }
}
