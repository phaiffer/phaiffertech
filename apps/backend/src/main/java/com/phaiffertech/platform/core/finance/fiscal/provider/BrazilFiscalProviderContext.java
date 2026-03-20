package com.phaiffertech.platform.core.finance.fiscal.provider;

import com.phaiffertech.platform.core.finance.domain.FinanceInvoice;
import com.phaiffertech.platform.core.finance.fiscal.domain.TenantFiscalProfile;

public record BrazilFiscalProviderContext(
        TenantFiscalProfile tenantFiscalProfile,
        FinanceInvoice invoice
) {
}
