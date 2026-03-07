package com.phaiffertech.platform.modules.crm.note.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "crm_notes")
@SQLDelete(sql = "UPDATE crm_notes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class CrmNote extends BaseTenantEntity {

    @Column(name = "content", nullable = false)
    private String content;

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

    @Column(name = "author_user_id", columnDefinition = "char(36)")
    private UUID authorUserId;

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getRelatedType() {
        return relatedType;
    }

    public void setRelatedType(String relatedType) {
        this.relatedType = relatedType;
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

    public UUID getRelatedId() {
        return relatedId;
    }

    public void setRelatedId(UUID relatedId) {
        this.relatedId = relatedId;
    }

    public UUID getAuthorUserId() {
        return authorUserId;
    }

    public void setAuthorUserId(UUID authorUserId) {
        this.authorUserId = authorUserId;
    }
}
