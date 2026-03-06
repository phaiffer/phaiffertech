package com.phaiffertech.platform.core.user.mapper;

import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.dto.UserResponse;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user, Role role) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), role.getCode(), user.isActive());
    }
}
