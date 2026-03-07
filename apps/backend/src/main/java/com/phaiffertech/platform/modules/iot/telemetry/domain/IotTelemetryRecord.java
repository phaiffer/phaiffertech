package com.phaiffertech.platform.modules.iot.telemetry.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "iot_telemetry_records")
@SQLDelete(sql = "UPDATE iot_telemetry_records SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class IotTelemetryRecord extends BaseTenantEntity {

    @Column(name = "device_id", nullable = false, columnDefinition = "char(36)")
    private UUID deviceId;

    @Column(name = "metric_name", nullable = false, length = 80)
    private String metricName;

    @Column(name = "metric_value", nullable = false, precision = 15, scale = 4)
    private BigDecimal metricValue;

    @Column(name = "unit", length = 40)
    private String unit;

    @Column(name = "metadata", columnDefinition = "text")
    private String metadata;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    public UUID getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(UUID deviceId) {
        this.deviceId = deviceId;
    }

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public BigDecimal getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(BigDecimal metricValue) {
        this.metricValue = metricValue;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
    }

    public String getMetric() {
        return metricName;
    }

    public BigDecimal getValue() {
        return metricValue;
    }
}
