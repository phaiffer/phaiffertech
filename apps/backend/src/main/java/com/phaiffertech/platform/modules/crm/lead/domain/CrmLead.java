package com.phaiffertech.platform.modules.crm.lead.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "crm_leads")
@SQLDelete(sql = "UPDATE crm_leads SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class CrmLead extends BaseTenantEntity {

    @Column(name = "contact_name", nullable = false, length = 150)
    private String contactName;

    @Column(name = "email", length = 180)
    private String email;

    @Column(name = "source", length = 80)
    private String source;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "NEW";

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
