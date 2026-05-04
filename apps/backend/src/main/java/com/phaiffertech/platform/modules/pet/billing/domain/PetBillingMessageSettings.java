package com.phaiffertech.platform.modules.pet.billing.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_billing_message_settings")
@SQLDelete(sql = "UPDATE pet_billing_message_settings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetBillingMessageSettings extends BaseTenantEntity {

    @Column(name = "pix_key", length = 180)
    private String pixKey;

    @Column(name = "billing_display_name", length = 150)
    private String billingDisplayName;

    @Column(name = "plan_renewal_message_template", columnDefinition = "text")
    private String planRenewalMessageTemplate;

    @Column(name = "pet_ready_message_template", columnDefinition = "text")
    private String petReadyMessageTemplate;

    public String getPixKey() {
        return pixKey;
    }

    public void setPixKey(String pixKey) {
        this.pixKey = pixKey;
    }

    public String getBillingDisplayName() {
        return billingDisplayName;
    }

    public void setBillingDisplayName(String billingDisplayName) {
        this.billingDisplayName = billingDisplayName;
    }

    public String getPlanRenewalMessageTemplate() {
        return planRenewalMessageTemplate;
    }

    public void setPlanRenewalMessageTemplate(String planRenewalMessageTemplate) {
        this.planRenewalMessageTemplate = planRenewalMessageTemplate;
    }

    public String getPetReadyMessageTemplate() {
        return petReadyMessageTemplate;
    }

    public void setPetReadyMessageTemplate(String petReadyMessageTemplate) {
        this.petReadyMessageTemplate = petReadyMessageTemplate;
    }
}
