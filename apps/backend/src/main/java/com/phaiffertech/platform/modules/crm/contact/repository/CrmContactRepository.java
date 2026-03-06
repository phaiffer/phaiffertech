package com.phaiffertech.platform.modules.crm.contact.repository;

import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmContactRepository extends JpaRepository<CrmContact, UUID> {

    Page<CrmContact> findAllByTenantId(UUID tenantId, Pageable pageable);
}
