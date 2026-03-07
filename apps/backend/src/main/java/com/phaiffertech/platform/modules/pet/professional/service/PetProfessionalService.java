package com.phaiffertech.platform.modules.pet.professional.service;

import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.modules.pet.professional.domain.PetProfessional;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalCreateRequest;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalResponse;
import com.phaiffertech.platform.modules.pet.professional.dto.PetProfessionalUpdateRequest;
import com.phaiffertech.platform.modules.pet.professional.mapper.PetProfessionalMapper;
import com.phaiffertech.platform.modules.pet.professional.repository.PetProfessionalRepository;
import com.phaiffertech.platform.shared.crud.BasePageQuery;
import com.phaiffertech.platform.shared.crud.BaseTenantCrudService;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PetProfessionalService extends BaseTenantCrudService<
        PetProfessional,
        PetProfessionalCreateRequest,
        PetProfessionalUpdateRequest,
        PetProfessionalResponse> {

    private final PetProfessionalRepository repository;

    public PetProfessionalService(PetProfessionalRepository repository) {
        super(repository, repository, PetProfessionalMapper.INSTANCE, "Pet professional not found.");
        this.repository = repository;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "pet_professional")
    public PetProfessionalResponse create(PetProfessionalCreateRequest request) {
        return doCreate(request);
    }

    @Transactional(readOnly = true)
    public PageResponseDto<PetProfessionalResponse> list(PageRequestDto pageRequest) {
        return doList(
                pageRequest,
                Sort.by(Sort.Direction.ASC, "name"),
                (BasePageQuery query) -> repository.findAllByTenantIdAndSearch(
                        currentTenantId(),
                        query.search(),
                        query.pageable()
                )
        );
    }

    @Transactional(readOnly = true)
    public PetProfessionalResponse getById(UUID id) {
        return doGetById(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.UPDATE, entity = "pet_professional")
    public PetProfessionalResponse update(UUID id, PetProfessionalUpdateRequest request) {
        return doUpdate(id, request);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.DELETE, entity = "pet_professional")
    public void delete(UUID id) {
        doSoftDelete(id);
    }

    @Transactional
    @AuditableAction(action = AuditActionType.RESTORE, entity = "pet_professional")
    public PetProfessionalResponse restore(UUID id) {
        return doRestore(id);
    }
}
