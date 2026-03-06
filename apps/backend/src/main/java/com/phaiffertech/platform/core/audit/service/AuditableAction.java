package com.phaiffertech.platform.core.audit.service;

import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditableAction {

    AuditActionType action();

    String entity();
}
