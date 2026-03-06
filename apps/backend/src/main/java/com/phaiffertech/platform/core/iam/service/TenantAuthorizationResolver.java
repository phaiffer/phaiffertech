package com.phaiffertech.platform.core.iam.service;

import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.repository.PermissionRepository;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRoleRepository;
import com.phaiffertech.platform.shared.exception.ForbiddenOperationException;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import java.util.Comparator;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TenantAuthorizationResolver {

    private final UserTenantRoleRepository userTenantRoleRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public TenantAuthorizationResolver(
            UserTenantRoleRepository userTenantRoleRepository,
            RoleRepository roleRepository,
            PermissionRepository permissionRepository
    ) {
        this.userTenantRoleRepository = userTenantRoleRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    public ResolvedTenantAuthorization resolve(UserTenant userTenant) {
        Set<UUID> roleIds = resolveRoleIds(userTenant);
        Set<Role> roles = roleRepository.findAllById(roleIds).stream().collect(Collectors.toSet());

        if (roles.isEmpty()) {
            throw new ForbiddenOperationException("No active roles found for this tenant user.");
        }

        Set<String> roleCodes = roles.stream().map(Role::getCode).collect(Collectors.toSet());
        Set<String> permissions = permissionRepository.findPermissionCodesByRoleIds(roleIds);

        String primaryRole = resolvePrimaryRole(userTenant, roles);

        return new ResolvedTenantAuthorization(primaryRole, roleCodes, permissions);
    }

    public String resolvePrimaryRole(UserTenant userTenant) {
        Set<UUID> roleIds = resolveRoleIds(userTenant);
        Set<Role> roles = roleRepository.findAllById(roleIds).stream().collect(Collectors.toSet());
        if (roles.isEmpty()) {
            throw new ForbiddenOperationException("No active roles found for this tenant user.");
        }

        return resolvePrimaryRole(userTenant, roles);
    }

    private Set<UUID> resolveRoleIds(UserTenant userTenant) {
        Set<UUID> roleIds = userTenantRoleRepository.findRoleIdsByUserTenantId(userTenant.getId());

        if (roleIds.isEmpty() && userTenant.getRoleId() != null) {
            roleIds = Set.of(userTenant.getRoleId());
        }

        if (roleIds.isEmpty()) {
            throw new ForbiddenOperationException("No role assigned for this tenant user.");
        }

        return roleIds;
    }

    private String resolvePrimaryRole(UserTenant userTenant, Set<Role> roles) {
        if (userTenant.getRoleId() != null) {
            for (Role role : roles) {
                if (role.getId().equals(userTenant.getRoleId())) {
                    return role.getCode();
                }
            }
        }

        return roles.stream()
                .map(Role::getCode)
                .sorted(Comparator.naturalOrder())
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Role not found for user tenant."));
    }

    public record ResolvedTenantAuthorization(
            String primaryRole,
            Set<String> roles,
            Set<String> permissions
    ) {
    }
}
