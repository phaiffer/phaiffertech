package com.phaiffertech.platform.modules.iot.register.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "iot_registers")
@SQLDelete(sql = "UPDATE iot_registers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class IotRegister extends BaseTenantEntity {

    @Column(name = "device_id", nullable = false, columnDefinition = "char(36)")
    private UUID deviceId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "code", nullable = false, length = 80)
    private String code;

    @Column(name = "metric_name", nullable = false, length = 80)
    private String metricName;

    @Column(name = "unit", length = 40)
    private String unit;

    @Column(name = "data_type", nullable = false, length = 40)
    private String dataType;

    @Column(name = "min_threshold", precision = 15, scale = 4)
    private BigDecimal minThreshold;

    @Column(name = "max_threshold", precision = 15, scale = 4)
    private BigDecimal maxThreshold;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "ACTIVE";

    public UUID getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(UUID deviceId) {
        this.deviceId = deviceId;
    }

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

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public BigDecimal getMinThreshold() {
        return minThreshold;
    }

    public void setMinThreshold(BigDecimal minThreshold) {
        this.minThreshold = minThreshold;
    }

    public BigDecimal getMaxThreshold() {
        return maxThreshold;
    }

    public void setMaxThreshold(BigDecimal maxThreshold) {
        this.maxThreshold = maxThreshold;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
