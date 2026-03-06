package com.phaiffertech.platform.modules.iot.alarm.repository;

import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IotAlarmRepository extends JpaRepository<IotAlarm, UUID> {
}
