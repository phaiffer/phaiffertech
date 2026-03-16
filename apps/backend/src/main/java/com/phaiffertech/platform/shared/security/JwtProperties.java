package com.phaiffertech.platform.shared.security;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app.security.jwt")
@Validated
public class JwtProperties {

    @NotBlank(message = "JWT secret must be configured.")
    private String secret;

    @Min(value = 1, message = "Access token lifetime must be at least one minute.")
    private long accessMinutes;

    @Min(value = 1, message = "Refresh token lifetime must be at least one day.")
    private long refreshDays;

    @NotBlank(message = "JWT issuer must be configured.")
    private String issuer;

    @NotBlank(message = "Refresh cookie name must be configured.")
    private String refreshCookieName = "platform_refresh_token";

    @NotBlank(message = "Refresh cookie path must be configured.")
    private String refreshCookiePath = "/api/v1/auth";

    @Pattern(
            regexp = "^(?i)(Strict|Lax|None)$",
            message = "Refresh cookie SameSite policy must be Strict, Lax or None."
    )
    private String refreshCookieSameSite = "Lax";
    private boolean refreshCookieSecure;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessMinutes() {
        return accessMinutes;
    }

    public void setAccessMinutes(long accessMinutes) {
        this.accessMinutes = accessMinutes;
    }

    public long getRefreshDays() {
        return refreshDays;
    }

    public void setRefreshDays(long refreshDays) {
        this.refreshDays = refreshDays;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getRefreshCookieName() {
        return refreshCookieName;
    }

    public void setRefreshCookieName(String refreshCookieName) {
        this.refreshCookieName = refreshCookieName;
    }

    public String getRefreshCookiePath() {
        return refreshCookiePath;
    }

    public void setRefreshCookiePath(String refreshCookiePath) {
        this.refreshCookiePath = refreshCookiePath;
    }

    public String getRefreshCookieSameSite() {
        return refreshCookieSameSite;
    }

    public void setRefreshCookieSameSite(String refreshCookieSameSite) {
        this.refreshCookieSameSite = refreshCookieSameSite;
    }

    public boolean isRefreshCookieSecure() {
        return refreshCookieSecure;
    }

    public void setRefreshCookieSecure(boolean refreshCookieSecure) {
        this.refreshCookieSecure = refreshCookieSecure;
    }
}
