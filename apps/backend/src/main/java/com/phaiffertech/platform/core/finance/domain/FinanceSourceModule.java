package com.phaiffertech.platform.core.finance.domain;

public enum FinanceSourceModule {
    MANUAL,
    CRM,
    PET,
    // Historical invoices can still carry the archived module code.
    IOT
}
