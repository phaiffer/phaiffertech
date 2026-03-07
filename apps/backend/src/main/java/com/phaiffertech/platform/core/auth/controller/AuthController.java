package com.phaiffertech.platform.core.auth.controller;

import com.phaiffertech.platform.core.auth.service.AuthService;
import com.phaiffertech.platform.core.auth.service.LoginAttemptService;
import com.phaiffertech.platform.core.auth.dto.AuthTokenResponse;
import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.LoginRequest;
import com.phaiffertech.platform.core.auth.dto.LogoutRequest;
import com.phaiffertech.platform.core.auth.dto.RefreshRequest;
import com.phaiffertech.platform.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final LoginAttemptService loginAttemptService;

    public AuthController(AuthService authService, LoginAttemptService loginAttemptService) {
        this.authService = authService;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
        String ipAddress = httpServletRequest.getRemoteAddr();
        loginAttemptService.checkAllowed(request.tenantCode(), request.email(), ipAddress);
        try {
            AuthTokenResponse response = authService.login(request);
            loginAttemptService.onSuccess(request.tenantCode(), request.email(), ipAddress);
            return ApiResponse.success(response);
        } catch (RuntimeException ex) {
            loginAttemptService.onFailure(request.tenantCode(), request.email(), ipAddress);
            throw ex;
        }
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthTokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ApiResponse.success(null);
    }

    @GetMapping("/me")
    public ApiResponse<AuthenticatedUserResponse> me() {
        return ApiResponse.success(authService.me());
    }
}
