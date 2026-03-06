package com.phaiffertech.platform.modules.crm.contact.service;

import com.phaiffertech.platform.modules.crm.contact.domain.CrmContact;
import com.phaiffertech.platform.modules.crm.contact.repository.CrmContactRepository;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactCreateRequest;
import com.phaiffertech.platform.modules.crm.contact.dto.CrmContactResponse;
import com.phaiffertech.platform.modules.crm.contact.mapper.CrmContactMapper;
import com.phaiffertech.platform.shared.response.PageResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmContactService {

    private final CrmContactRepository repository;

    public CrmContactService(CrmContactRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CrmContactResponse create(CrmContactCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        CrmContact contact = new CrmContact();
        contact.setTenantId(tenantId);
        contact.setFirstName(request.firstName());
        contact.setLastName(request.lastName());
        contact.setEmail(request.email());
        contact.setPhone(request.phone());
        contact = repository.save(contact);

        return CrmContactMapper.toResponse(contact);
    }

    @Transactional(readOnly = true)
    public PageResponse<CrmContactResponse> list(int page, int size) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<CrmContact> result = repository.findAllByTenantId(tenantId, PageRequest.of(page, size));

        return new PageResponse<>(
                result.getContent().stream().map(CrmContactMapper::toResponse).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }
}
