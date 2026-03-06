package com.phaiffertech.platform.modules.pet.client.service;

import com.phaiffertech.platform.modules.pet.client.domain.PetClient;
import com.phaiffertech.platform.modules.pet.client.repository.PetClientRepository;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientCreateRequest;
import com.phaiffertech.platform.modules.pet.client.dto.PetClientResponse;
import com.phaiffertech.platform.modules.pet.client.mapper.PetClientMapper;
import com.phaiffertech.platform.shared.response.PageResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PetClientService {

    private final PetClientRepository repository;

    public PetClientService(PetClientRepository repository) {
        this.repository = repository;
    }

    @Transactional
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
    public PageResponse<PetClientResponse> list(int page, int size) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        Page<PetClient> result = repository.findAllByTenantId(tenantId, PageRequest.of(page, size));

        return new PageResponse<>(
                result.getContent().stream().map(PetClientMapper::toResponse).toList(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize()
        );
    }
}
