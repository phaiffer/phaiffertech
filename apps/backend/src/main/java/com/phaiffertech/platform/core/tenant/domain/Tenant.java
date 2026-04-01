package com.phaiffertech.platform.core.tenant.domain;

import com.phaiffertech.platform.shared.domain.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "tenants")
public class Tenant extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "code", nullable = false, unique = true, length = 80)
    private String code;

    @Column(name = "status", nullable = false, length = 30)
    private String status = TenantCommercialStatus.ACTIVE.name();

    @Column(name = "plan_code", nullable = false, length = 80)
    private String planCode = "PETSHOP";

    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    @Column(name = "primary_color", length = 7)
    private String primaryColor;

    @Column(name = "accent_color", length = 7)
    private String accentColor;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_theme_mode", nullable = false, length = 20)
    private TenantThemeMode defaultThemeMode = TenantThemeMode.SYSTEM;

    @Column(name = "allow_user_theme_override", nullable = false)
    private boolean allowUserThemeOverride = true;

    @Column(name = "platform_owner", nullable = false)
    private boolean platformOwner;

    @Column(name = "trial_end_date")
    private LocalDate trialEndDate;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = TenantCommercialStatus.from(status).name();
    }

    public TenantCommercialStatus getCommercialStatus() {
        return TenantCommercialStatus.from(status);
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
    }

    public TenantThemeMode getDefaultThemeMode() {
        return defaultThemeMode;
    }

    public void setDefaultThemeMode(TenantThemeMode defaultThemeMode) {
        this.defaultThemeMode = defaultThemeMode;
    }

    public boolean isAllowUserThemeOverride() {
        return allowUserThemeOverride;
    }

    public void setAllowUserThemeOverride(boolean allowUserThemeOverride) {
        this.allowUserThemeOverride = allowUserThemeOverride;
    }

    public boolean isPlatformOwner() {
        return platformOwner;
    }

    public void setPlatformOwner(boolean platformOwner) {
        this.platformOwner = platformOwner;
    }

    public LocalDate getTrialEndDate() {
        return trialEndDate;
    }

    public void setTrialEndDate(LocalDate trialEndDate) {
        this.trialEndDate = trialEndDate;
    }

    public boolean isTrialExpired(LocalDate referenceDate) {
        return getCommercialStatus() == TenantCommercialStatus.TRIAL
                && trialEndDate != null
                && referenceDate.isAfter(trialEndDate);
    }
}
