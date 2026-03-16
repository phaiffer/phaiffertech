package com.phaiffertech.platform.core.auth.controller;

import com.phaiffertech.platform.core.auth.service.AuthService;
import com.phaiffertech.platform.core.auth.service.LoginAttemptService;
import com.phaiffertech.platform.core.auth.dto.AuthTokenResponse;
import com.phaiffertech.platform.core.auth.dto.AuthenticatedUserResponse;
import com.phaiffertech.platform.core.auth.dto.ChangePasswordRequest;
import com.phaiffertech.platform.core.auth.dto.LoginRequest;
import com.phaiffertech.platform.shared.response.ApiResponse;
import com.phaiffertech.platform.shared.security.JwtProperties;
import com.phaiffertech.platform.shared.web.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
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
    private final JwtProperties jwtProperties;

    public AuthController(AuthService authService, LoginAttemptService loginAttemptService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.loginAttemptService = loginAttemptService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    ) {
        applyNoStore(httpServletResponse);
        String ipAddress = ClientIpResolver.resolve(httpServletRequest);
        loginAttemptService.checkAllowed(request.tenantCode(), request.email(), ipAddress);
        try {
            AuthService.AuthSessionResult result = authService.login(request);
            writeRefreshTokenCookie(httpServletResponse, result.refreshToken());
            loginAttemptService.onSuccess(request.tenantCode(), request.email(), ipAddress);
            return ApiResponse.success(result.response());
        } catch (RuntimeException ex) {
            loginAttemptService.onFailure(request.tenantCode(), request.email(), ipAddress);
            throw ex;
        }
    }

    @PostMapping("/demo-login")
    public ApiResponse<AuthTokenResponse> demoLogin(
            HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse
    ) {
        applyNoStore(httpServletResponse);
        String ipAddress = ClientIpResolver.resolve(httpServletRequest);
        loginAttemptService.checkAllowed("demo", "demo", ipAddress);
        try {
            AuthService.AuthSessionResult result = authService.demoLogin();
            writeRefreshTokenCookie(httpServletResponse, result.refreshToken());
            loginAttemptService.onSuccess("demo", "demo", ipAddress);
            return ApiResponse.success(result.response());
        } catch (RuntimeException ex) {
            loginAttemptService.onFailure("demo", "demo", ipAddress);
            throw ex;
        }
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthTokenResponse> refresh(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        applyNoStore(httpServletResponse);
        String refreshToken = requireRefreshToken(httpServletRequest);
        try {
            AuthService.AuthSessionResult result = authService.refresh(refreshToken);
            writeRefreshTokenCookie(httpServletResponse, result.refreshToken());
            return ApiResponse.success(result.response());
        } catch (RuntimeException ex) {
            clearRefreshTokenCookie(httpServletResponse);
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) {
        applyNoStore(httpServletResponse);
        String refreshToken = extractRefreshToken(httpServletRequest);
        clearRefreshTokenCookie(httpServletResponse);
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        return ApiResponse.success(null);
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletResponse httpServletResponse
    ) {
        applyNoStore(httpServletResponse);
        authService.changePassword(request);
        clearRefreshTokenCookie(httpServletResponse);
        return ApiResponse.success(null);
    }

    @GetMapping("/me")
    public ApiResponse<AuthenticatedUserResponse> me(HttpServletResponse httpServletResponse) {
        applyNoStore(httpServletResponse);
        return ApiResponse.success(authService.me());
    }

    private void writeRefreshTokenCookie(HttpServletResponse httpServletResponse, String refreshToken) {
        httpServletResponse.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(jwtProperties.getRefreshCookieName(), refreshToken)
                .httpOnly(true)
                .secure(jwtProperties.isRefreshCookieSecure())
                .sameSite(jwtProperties.getRefreshCookieSameSite())
                .path(jwtProperties.getRefreshCookiePath())
                .maxAge(Duration.ofDays(jwtProperties.getRefreshDays()))
                .build()
                .toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse httpServletResponse) {
        httpServletResponse.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(jwtProperties.getRefreshCookieName(), "")
                .httpOnly(true)
                .secure(jwtProperties.isRefreshCookieSecure())
                .sameSite(jwtProperties.getRefreshCookieSameSite())
                .path(jwtProperties.getRefreshCookiePath())
                .maxAge(Duration.ZERO)
                .build()
                .toString());
    }

    private String requireRefreshToken(HttpServletRequest httpServletRequest) {
        String refreshToken = extractRefreshToken(httpServletRequest);
        if (refreshToken == null) {
            throw new IllegalArgumentException("Refresh token cookie is missing.");
        }
        return refreshToken;
    }

    private String extractRefreshToken(HttpServletRequest httpServletRequest) {
        if (httpServletRequest.getCookies() == null) {
            return null;
        }

        for (var cookie : httpServletRequest.getCookies()) {
            if (jwtProperties.getRefreshCookieName().equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private void applyNoStore(HttpServletResponse httpServletResponse) {
        httpServletResponse.setHeader(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate");
        httpServletResponse.setHeader(HttpHeaders.PRAGMA, "no-cache");
        httpServletResponse.setDateHeader(HttpHeaders.EXPIRES, 0);
    }
}
