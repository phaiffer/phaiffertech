package com.phaiffertech.platform.core.finance.payment.domain;

public enum PaymentEventType {
    INVOICE_CREATED,
    INVOICE_ISSUED,
    INVOICE_CANCELED,
    CHARGE_REQUESTED,
    CHARGE_CREATED,
    CHARGE_FAILED,
    WEBHOOK_RECEIVED,
    PAYMENT_RECORDED,
    PAYMENT_CONFIRMED,
    PAYMENT_CANCELED,
    REFUND_RECORDED
}
