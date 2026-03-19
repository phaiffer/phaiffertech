package com.phaiffertech.platform.modules.pet.invoice.domain;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_invoices")
@SQLDelete(sql = "UPDATE pet_invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetInvoice extends BaseTenantEntity {

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "finance_invoice_id", nullable = false)
    private UUID financeInvoiceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finance_invoice_id", insertable = false, updatable = false)
    private FinanceInvoice financeInvoice;

    public UUID getClientId() {
        return clientId;
    }

    public void setClientId(UUID clientId) {
        this.clientId = clientId;
    }

    public UUID getFinanceInvoiceId() {
        return financeInvoiceId;
    }

    public void setFinanceInvoiceId(UUID financeInvoiceId) {
        this.financeInvoiceId = financeInvoiceId;
    }

    public FinanceInvoice getFinanceInvoice() {
        return financeInvoice;
    }

    public void setFinanceInvoice(FinanceInvoice financeInvoice) {
        this.financeInvoice = financeInvoice;
    }
}
