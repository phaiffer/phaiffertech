package com.phaiffertech.platform.modules.pet.client.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.modules.pet.client.mapper.PetClientMapper;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetClientService {

    private final PetClientRepository repository;

    public PetClientService(PetClientRepository repository) {
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_client")
    public PetClientResponse create(PetClientCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        PetClient client = new PetClient();
        client.setTenantId(tenantId);
        client.setFullName(request.fullName());
        client.setEmail(request.email());
        client.setPhone(request.phone());
        client = repository.save(client);

        return PetClientMapper.toResponse(client);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetClientResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<PetClientResponse> result = repository.findAllByTenantIdAndSearch(
                        tenantId,
                        pageRequest.normalizedSearch(),
                        PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(PetClientMapper::toResponse);

        return PaginationUtils.fromPage(result);
    }
}
