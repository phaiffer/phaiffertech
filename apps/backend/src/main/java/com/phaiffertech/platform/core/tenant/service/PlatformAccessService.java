package com.phaiffertech.platform.core.tenant.service;

import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.security.AuthenticatedUser;
import com.phaiffertech.platform.shared.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformAccessService {

    private final CurrentUserService currentUserService;
    private final TenantRepository tenantRepository;

    public PlatformAccessService(CurrentUserService currentUserService, TenantRepository tenantRepository) {
        this.currentUserService = currentUserService;
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public Tenant getCurrentTenant() {
        AuthenticatedUser user = currentUserService.getRequiredUser();
        return tenantRepository.findById(user.tenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found."));
    }

    @Transactional(readOnly = true)
    public boolean isPlatformAdministrator() {
        AuthenticatedUser user = currentUserService.getRequiredUser();
        boolean hasPlatformRole = user.roles() != null && !user.roles().isEmpty()
                ? user.roles().contains(RoleCode.PLATFORM_ADMIN.name())
                : RoleCode.PLATFORM_ADMIN.name().equals(user.role());

        return hasPlatformRole && getCurrentTenant().isPlatformOwner();
    }

    @Transactional(readOnly = true)
    public void assertPlatformAdministrationAccess() {
        if (!isPlatformAdministrator()) {
            throw new ForbiddenOperationException("Platform administration is restricted to platform owner administrators.");
        }
    }
}
