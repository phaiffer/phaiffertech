package com.phaiffertech.platform.modules.iot.alarm.mapper;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmCreateRequest;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmResponse;
import com.phaiffertech.platform.modules.iot.alarm.dto.IotAlarmUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.time.Instant;

public final class IotAlarmMapper implements BaseCrudMapper<
        IotAlarm,
        IotAlarmCreateRequest,
        IotAlarmUpdateRequest,
        IotAlarmResponse> {

    public static final IotAlarmMapper INSTANCE = new IotAlarmMapper();

    private IotAlarmMapper() {
    }

    @Override
    public IotAlarm toNewEntity(IotAlarmCreateRequest request) {
        IotAlarm alarm = new IotAlarm();
        alarm.setDeviceId(request.deviceId());
        alarm.setRegisterId(request.registerId());
        alarm.setCode(request.code().trim().toUpperCase());
        alarm.setMessage(request.message().trim());
        alarm.setSeverity(request.severity().trim().toUpperCase());
        alarm.setStatus(resolveStatus(request.status()));
        alarm.setTriggeredAt(request.triggeredAt() == null ? Instant.now() : request.triggeredAt());
        return alarm;
    }

    @Override
    public void updateEntity(IotAlarm entity, IotAlarmUpdateRequest request) {
        entity.setDeviceId(request.deviceId());
        entity.setRegisterId(request.registerId());
        entity.setCode(request.code().trim().toUpperCase());
        entity.setMessage(request.message().trim());
        entity.setSeverity(request.severity().trim().toUpperCase());
        entity.setStatus(resolveStatus(request.status()));
        entity.setTriggeredAt(request.triggeredAt() == null ? entity.getTriggeredAt() : request.triggeredAt());
        entity.setAcknowledgedAt(request.acknowledgedAt());
    }

    @Override
    public IotAlarmResponse toResponse(IotAlarm alarm) {
        return new IotAlarmResponse(
                alarm.getId(),
                alarm.getDeviceId(),
                alarm.getRegisterId(),
                alarm.getCode(),
                alarm.getMessage(),
                alarm.getSeverity(),
                alarm.getStatus(),
                alarm.getTriggeredAt(),
                alarm.getAcknowledgedAt(),
                alarm.getAcknowledgedBy(),
                alarm.getCreatedAt(),
                alarm.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "OPEN";
        }
        return status.trim().toUpperCase();
    }
}
