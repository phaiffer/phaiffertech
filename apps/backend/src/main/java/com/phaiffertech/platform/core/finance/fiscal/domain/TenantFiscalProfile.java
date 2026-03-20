package com.phaiffertech.platform.core.finance.fiscal.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "tenant_fiscal_profiles")
@SQLDelete(sql = "UPDATE tenant_fiscal_profiles SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class TenantFiscalProfile extends BaseTenantEntity {

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Enumerated(EnumType.STRING)
    @Column(name = "environment", nullable = false, length = 20)
    private TenantFiscalEnvironment environment = TenantFiscalEnvironment.SANDBOX;

    @Column(name = "provider_code", length = 40)
    private String providerCode;

    @Column(name = "provider_settings_reference", length = 120)
    private String providerSettingsReference;

    @Column(name = "issuer_legal_name", length = 160)
    private String issuerLegalName;

    @Column(name = "issuer_trade_name", length = 160)
    private String issuerTradeName;

    @Column(name = "issuer_document_type", length = 20)
    private String issuerDocumentType;

    @Column(name = "issuer_document_number", length = 32)
    private String issuerDocumentNumber;

    @Column(name = "issuer_state_registration", length = 40)
    private String issuerStateRegistration;

    @Column(name = "issuer_municipal_registration", length = 40)
    private String issuerMunicipalRegistration;

    @Column(name = "issuer_tax_regime_code", length = 40)
    private String issuerTaxRegimeCode;

    @Column(name = "issuer_city_code", length = 16)
    private String issuerCityCode;

    @Column(name = "issuer_country_code", nullable = false, length = 2)
    private String issuerCountryCode = "BR";

    @Column(name = "last_validated_at")
    private Instant lastValidatedAt;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public TenantFiscalEnvironment getEnvironment() {
        return environment;
    }

    public void setEnvironment(TenantFiscalEnvironment environment) {
        this.environment = environment;
    }

    public String getProviderCode() {
        return providerCode;
    }

    public void setProviderCode(String providerCode) {
        this.providerCode = providerCode;
    }

    public String getProviderSettingsReference() {
        return providerSettingsReference;
    }

    public void setProviderSettingsReference(String providerSettingsReference) {
        this.providerSettingsReference = providerSettingsReference;
    }

    public String getIssuerLegalName() {
        return issuerLegalName;
    }

    public void setIssuerLegalName(String issuerLegalName) {
        this.issuerLegalName = issuerLegalName;
    }

    public String getIssuerTradeName() {
        return issuerTradeName;
    }

    public void setIssuerTradeName(String issuerTradeName) {
        this.issuerTradeName = issuerTradeName;
    }

    public String getIssuerDocumentType() {
        return issuerDocumentType;
    }

    public void setIssuerDocumentType(String issuerDocumentType) {
        this.issuerDocumentType = issuerDocumentType;
    }

    public String getIssuerDocumentNumber() {
        return issuerDocumentNumber;
    }

    public void setIssuerDocumentNumber(String issuerDocumentNumber) {
        this.issuerDocumentNumber = issuerDocumentNumber;
    }

    public String getIssuerStateRegistration() {
        return issuerStateRegistration;
    }

    public void setIssuerStateRegistration(String issuerStateRegistration) {
        this.issuerStateRegistration = issuerStateRegistration;
    }

    public String getIssuerMunicipalRegistration() {
        return issuerMunicipalRegistration;
    }

    public void setIssuerMunicipalRegistration(String issuerMunicipalRegistration) {
        this.issuerMunicipalRegistration = issuerMunicipalRegistration;
    }

    public String getIssuerTaxRegimeCode() {
        return issuerTaxRegimeCode;
    }

    public void setIssuerTaxRegimeCode(String issuerTaxRegimeCode) {
        this.issuerTaxRegimeCode = issuerTaxRegimeCode;
    }

    public String getIssuerCityCode() {
        return issuerCityCode;
    }

    public void setIssuerCityCode(String issuerCityCode) {
        this.issuerCityCode = issuerCityCode;
    }

    public String getIssuerCountryCode() {
        return issuerCountryCode;
    }

    public void setIssuerCountryCode(String issuerCountryCode) {
        this.issuerCountryCode = issuerCountryCode;
    }

    public Instant getLastValidatedAt() {
        return lastValidatedAt;
    }

    public void setLastValidatedAt(Instant lastValidatedAt) {
        this.lastValidatedAt = lastValidatedAt;
    }
}
