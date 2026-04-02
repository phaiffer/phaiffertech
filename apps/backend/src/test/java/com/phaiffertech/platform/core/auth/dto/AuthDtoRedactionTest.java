package com.phaiffertech.platform.core.auth.dto;

import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthDtoRedactionTest {

    @Test
    void shouldRedactSensitiveFieldsInDtoToStringRepresentations() {
        LoginRequest loginRequest = new LoginRequest("default", "admin@local.test", "Admin@123");
        ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest("Admin@123", "NewAdmin@123", "NewAdmin@123");
        PasswordResetRequest passwordResetRequest = new PasswordResetRequest("default", "admin@local.test");
        PasswordResetConfirmRequest passwordResetConfirmRequest = new PasswordResetConfirmRequest(
                "raw-reset-token",
                "NewAdmin@123",
                "NewAdmin@123"
        );
        RefreshRequest refreshRequest = new RefreshRequest("refresh-token");
        LogoutRequest logoutRequest = new LogoutRequest("refresh-token");
        AuthTokenResponse authTokenResponse = new AuthTokenResponse(
                "access-token",
                300,
                new AuthenticatedUserResponse(
                        UUID.fromString("11111111-1111-1111-1111-111111111110"),
                        "admin@local.test",
                        "Admin Local",
                        UUID.fromString("11111111-1111-1111-1111-111111111111"),
                        "Default Tenant",
                        "default",
                        "BANHO_TOSA_CLINICA",
                        null,
                        "#0f172a",
                        "#2563eb",
                        TenantThemeMode.SYSTEM,
                        true,
                        true,
                        true,
                        false,
                        "ADMIN",
                        Set.of("ADMIN"),
                        Set.of("tenant.read"),
                        List.of("pet.full"),
                        null
                )
        );

        assertTrue(loginRequest.toString().contains("[REDACTED]"));
        assertTrue(changePasswordRequest.toString().contains("[REDACTED]"));
        assertTrue(passwordResetRequest.toString().contains("[REDACTED]"));
        assertTrue(passwordResetConfirmRequest.toString().contains("[REDACTED]"));
        assertTrue(refreshRequest.toString().contains("[REDACTED]"));
        assertTrue(logoutRequest.toString().contains("[REDACTED]"));
        assertTrue(authTokenResponse.toString().contains("[REDACTED]"));

        assertFalse(loginRequest.toString().contains("Admin@123"));
        assertFalse(loginRequest.toString().contains("admin@local.test"));
        assertFalse(changePasswordRequest.toString().contains("NewAdmin@123"));
        assertFalse(passwordResetRequest.toString().contains("admin@local.test"));
        assertFalse(passwordResetConfirmRequest.toString().contains("raw-reset-token"));
        assertFalse(passwordResetConfirmRequest.toString().contains("NewAdmin@123"));
        assertFalse(refreshRequest.toString().contains("refresh-token"));
        assertFalse(logoutRequest.toString().contains("refresh-token"));
        assertFalse(authTokenResponse.toString().contains("access-token"));
        assertFalse(authTokenResponse.toString().contains("Admin Local"));
        assertFalse(authTokenResponse.toString().contains("admin@local.test"));
    }
}
