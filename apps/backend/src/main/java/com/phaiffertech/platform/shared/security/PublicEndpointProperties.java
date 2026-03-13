package com.phaiffertech.platform.shared.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.public-endpoints")
public class PublicEndpointProperties {

    private boolean docsEnabled = true;
    private boolean observabilityEnabled = true;

    public boolean isDocsEnabled() {
        return docsEnabled;
    }

    public void setDocsEnabled(boolean docsEnabled) {
        this.docsEnabled = docsEnabled;
    }

    public boolean isObservabilityEnabled() {
        return observabilityEnabled;
    }

    public void setObservabilityEnabled(boolean observabilityEnabled) {
        this.observabilityEnabled = observabilityEnabled;
    }
}
