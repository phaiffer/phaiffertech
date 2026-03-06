package com.phaiffertech.platform.core.user.service;

import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.shared.domain.enums.RoleCode;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import com.phaiffertech.platform.core.user.dto.UserCreateRequest;
import com.phaiffertech.platform.core.user.dto.UserResponse;
import com.phaiffertech.platform.core.user.mapper.UserMapper;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.response.PageResponse;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserTenantRepository userTenantRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            UserTenantRepository userTenantRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.userTenantRepository = userTenantRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("User email already exists.");
        }

        String roleCode = request.roleCode() == null || request.roleCode().isBlank()
                ? RoleCode.OPERATOR.name()
                : request.roleCode();

        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleCode));

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setFullName(request.fullName());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setActive(true);
        user = userRepository.save(user);

        UserTenant userTenant = new UserTenant();
        userTenant.setTenantId(tenantId);
        userTenant.setUserId(user.getId());
        userTenant.setRoleId(role.getId());
        userTenant.setActive(true);
        userTenantRepository.save(userTenant);

        return UserMapper.toResponse(user, role);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(int page, int size) {
        UUID tenantId = TenantContext.getRequiredTenantId();

        Page<UserTenant> mappings = userTenantRepository.findAllByTenantIdAndActiveTrue(tenantId, PageRequest.of(page, size));

        Set<UUID> userIds = mappings.getContent().stream().map(UserTenant::getUserId).collect(Collectors.toSet());
        Set<UUID> roleIds = mappings.getContent().stream().map(UserTenant::getRoleId).collect(Collectors.toSet());

        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));
        Map<UUID, Role> rolesById = roleRepository.findAllById(roleIds).stream()
                .collect(Collectors.toMap(Role::getId, role -> role));

        return new PageResponse<>(
                mappings.getContent().stream().map(mapping -> {
                    User user = usersById.get(mapping.getUserId());
                    Role role = rolesById.get(mapping.getRoleId());
                    if (user == null || role == null) {
                        return new UserResponse(mapping.getUserId(), "unknown", "unknown", "unknown", false);
                    }
                    return UserMapper.toResponse(user, role);
                }).toList(),
                mappings.getTotalElements(),
                mappings.getTotalPages(),
                mappings.getNumber(),
                mappings.getSize()
        );
    }
}
