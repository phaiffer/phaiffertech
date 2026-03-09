package com.phaiffertech.platform.modules.iot.device.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "iot_devices")
@SQLDelete(sql = "UPDATE iot_devices SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class IotDevice extends BaseTenantEntity {

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "identifier", nullable = false, length = 100)
    private String identifier;

    @Column(name = "serial_number", nullable = false, length = 100)
    private String serialNumber;

    @Column(name = "type", length = 80)
    private String type;

    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "transport", length = 40)
    private String transport;

    @Column(name = "host", length = 120)
    private String host;

    @Column(name = "port")
    private Integer port;

    @Column(name = "unit_id")
    private Integer unitId;

    @Column(name = "polling_profile", length = 40)
    private String pollingProfile;

    @Column(name = "gateway", length = 120)
    private String gateway;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "ONLINE";

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTransport() {
        return transport;
    }

    public void setTransport(String transport) {
        this.transport = transport;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Integer getUnitId() {
        return unitId;
    }

    public void setUnitId(Integer unitId) {
        this.unitId = unitId;
    }

    public String getPollingProfile() {
        return pollingProfile;
    }

    public void setPollingProfile(String pollingProfile) {
        this.pollingProfile = pollingProfile;
    }

    public String getGateway() {
        return gateway;
    }

    public void setGateway(String gateway) {
        this.gateway = gateway;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }
}
