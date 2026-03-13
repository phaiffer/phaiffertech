package com.phaiffertech.platform.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public class JwtProperties {

    private String secret;
    private long accessMinutes;
    private long refreshDays;
    private String issuer;
    private String refreshCookieName = "platform_refresh_token";
    private String refreshCookiePath = "/api/v1/auth";
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
