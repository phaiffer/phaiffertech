package com.phaiffertech.platform.modules.iot.maintenance.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "iot_maintenance")
@SQLDelete(sql = "UPDATE iot_maintenance SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class IotMaintenance extends BaseTenantEntity {

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "linked_alarm_id")
    private UUID linkedAlarmId;

    @Column(name = "linked_register_id")
    private UUID linkedRegisterId;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "status", nullable = false, length = 40)
    private String status = "PENDING";

    @Column(name = "priority", nullable = false, length = 40)
    private String priority = "MEDIUM";

    @Column(name = "origin", length = 40)
    private String origin;

    @Column(name = "trigger_message", length = 255)
    private String trigger;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "assigned_user_id")
    private UUID assignedUserId;

    @Column(name = "assigned_user_label", length = 120)
    private String assignedUserLabel;

    public UUID getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(UUID deviceId) {
        this.deviceId = deviceId;
    }

    public UUID getLinkedAlarmId() {
        return linkedAlarmId;
    }

    public void setLinkedAlarmId(UUID linkedAlarmId) {
        this.linkedAlarmId = linkedAlarmId;
    }

    public UUID getLinkedRegisterId() {
        return linkedRegisterId;
    }

    public void setLinkedRegisterId(UUID linkedRegisterId) {
        this.linkedRegisterId = linkedRegisterId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getTrigger() {
        return trigger;
    }

    public void setTrigger(String trigger) {
        this.trigger = trigger;
    }

    public Instant getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(Instant scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public UUID getAssignedUserId() {
        return assignedUserId;
    }

    public void setAssignedUserId(UUID assignedUserId) {
        this.assignedUserId = assignedUserId;
    }

    public String getAssignedUserLabel() {
        return assignedUserLabel;
    }

    public void setAssignedUserLabel(String assignedUserLabel) {
        this.assignedUserLabel = assignedUserLabel;
    }
}
