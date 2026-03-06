package com.phaiffertech.platform.core.audit.repository;

import com.phaiffertech.platform.core.audit.domain.AuditLog;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
}
