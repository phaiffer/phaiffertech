package com.phaiffertech.platform.modules.iot.telemetry.repository;

import com.phaiffertech.platform.modules.iot.telemetry.domain.IotTelemetryRecord;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IotTelemetryRecordRepository extends JpaRepository<IotTelemetryRecord, UUID> {
}
