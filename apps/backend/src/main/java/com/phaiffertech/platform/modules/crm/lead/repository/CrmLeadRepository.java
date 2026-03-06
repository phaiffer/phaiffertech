package com.phaiffertech.platform.modules.crm.lead.repository;

import com.phaiffertech.platform.modules.crm.lead.domain.CrmLead;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmLeadRepository extends JpaRepository<CrmLead, UUID> {
}
