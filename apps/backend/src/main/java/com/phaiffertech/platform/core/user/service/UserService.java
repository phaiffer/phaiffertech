package com.phaiffertech.platform.core.user.service;

import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import com.phaiffertech.platform.core.audit.service.AuditableAction;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.domain.UserTenantRole;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRoleRepository;
import com.phaiffertech.platform.core.iam.service.TenantAuthorizationResolver;
import com.phaiffertech.platform.core.tenant.service.PlatformAccessService;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.core.user.dto.UserCreateRequest;
import com.phaiffertech.platform.core.user.dto.UserResponse;
import com.phaiffertech.platform.core.user.mapper.UserMapper;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.domain.enums.AuditActionType;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.pagination.PageRequestDto;
import com.phaiffertech.platform.shared.pagination.PageResponseDto;
import com.phaiffertech.platform.shared.pagination.PaginationUtils;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final UserTenantRoleRepository userTenantRoleRepository;
    private final TenantAuthorizationResolver tenantAuthorizationResolver;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlatformAccessService platformAccessService;

    public UserService(
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            UserTenantRoleRepository userTenantRoleRepository,
            TenantAuthorizationResolver tenantAuthorizationResolver,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            PlatformAccessService platformAccessService
    ) {
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.tenantAuthorizationResolver = tenantAuthorizationResolver;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.platformAccessService = platformAccessService;
    }

    @Transactional
    @AuditableAction(action = AuditActionType.CREATE, entity = "user")
    public UserResponse create(UserCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        CreatedUserAccess createdAccess = createUserAccess(
                tenantId,
                request.email(),
                request.fullName(),
                request.password(),
                request.roleCode(),
                RoleCode.OPERATOR.name(),
                false
        );

        return UserMapper.toResponse(createdAccess.user(), createdAccess.role());
    }

    @Transactional
    public void createTenantAdministrator(
            UUID tenantId,
            String fullName,
            String email,
            String temporaryPassword,
            boolean requirePasswordChangeOnFirstAccess
    ) {
        createUserAccess(
                tenantId,
                email,
                fullName,
                temporaryPassword,
                RoleCode.TENANT_ADMIN.name(),
                RoleCode.TENANT_ADMIN.name(),
                requirePasswordChangeOnFirstAccess
        );
    }

    @Transactional(readOnly = true)
    public PageResponseDto<UserResponse> list(PageRequestDto pageRequest) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        Page<UserTenant> mappings = userTenantRepository.findAllByTenantIdAndActiveTrue(
                tenantId,
                PaginationUtils.toPageable(pageRequest, Sort.by(Sort.Direction.ASC, "createdAt"))
        );

        Set<UUID> userIds = mappings.getContent().stream().map(UserTenant::getUserId).collect(Collectors.toSet());

        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        Page<UserResponse> mappedResult = mappings.map(mapping -> {
            User user = usersById.get(mapping.getUserId());
            if (user == null) {
                return new UserResponse(mapping.getUserId(), "unknown", "unknown", "unknown", false);
            }

            String primaryRole = tenantAuthorizationResolver.resolvePrimaryRole(mapping);
            return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), primaryRole, user.isActive());
        });

        return PaginationUtils.fromPage(mappedResult);
    }

    private CreatedUserAccess createUserAccess(
            UUID tenantId,
            String email,
            String fullName,
            String password,
            String requestedRoleCode,
            String fallbackRoleCode,
            boolean requirePasswordChangeOnFirstAccess
    ) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("User email already exists.");
        }

        String roleCode = requestedRoleCode == null || requestedRoleCode.isBlank()
                ? fallbackRoleCode
                : requestedRoleCode.trim().toUpperCase();

        if (RoleCode.PLATFORM_ADMIN.name().equals(roleCode) && !platformAccessService.isPlatformAdministrator()) {
            throw new ForbiddenOperationException("PLATFORM_ADMIN can only be assigned by platform owner administrators.");
        }

        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode));

        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setFullName(fullName.trim());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setActive(true);
        user.setRequirePasswordChangeOnFirstAccess(requirePasswordChangeOnFirstAccess);
        user = userRepository.save(user);

        UserTenant userTenant = new UserTenant();
        userTenant.setTenantId(tenantId);
        userTenant.setUserId(user.getId());
        userTenant.setRoleId(role.getId());
        userTenant.setActive(true);
        userTenant = userTenantRepository.save(userTenant);

        if (!userTenantRoleRepository.existsByUserTenantIdAndRoleId(userTenant.getId(), role.getId())) {
            UserTenantRole userTenantRole = new UserTenantRole();
            userTenantRole.setUserTenantId(userTenant.getId());
            userTenantRole.setRoleId(role.getId());
            userTenantRoleRepository.save(userTenantRole);
        }

        return new CreatedUserAccess(user, role);
    }

    private record CreatedUserAccess(User user, Role role) {
    }
}
