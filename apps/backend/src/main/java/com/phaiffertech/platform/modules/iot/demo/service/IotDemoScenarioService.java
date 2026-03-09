package com.phaiffertech.platform.modules.iot.demo.service;

import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.modules.iot.alarm.domain.IotAlarm;
import com.phaiffertech.platform.modules.iot.alarm.repository.IotAlarmRepository;
import com.phaiffertech.platform.modules.iot.demo.config.IotDemoProperties;
import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.repository.IotDeviceRepository;
import com.phaiffertech.platform.modules.iot.device.service.IotDeviceService;
import com.phaiffertech.platform.modules.iot.maintenance.dto.IotMaintenanceCreateRequest;
import com.phaiffertech.platform.modules.iot.maintenance.repository.IotMaintenanceRepository;
import com.phaiffertech.platform.modules.iot.maintenance.service.IotMaintenanceService;
import com.phaiffertech.platform.modules.iot.processing.TelemetryWriter;
import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterCreateRequest;
import com.phaiffertech.platform.modules.iot.register.repository.IotRegisterRepository;
import com.phaiffertech.platform.modules.iot.register.service.IotRegisterService;
import com.phaiffertech.platform.modules.iot.telemetry.dto.IotTelemetryCreateRequest;
import com.phaiffertech.platform.shared.exception.ResourceNotFoundException;
import com.phaiffertech.platform.shared.tenancy.TenantContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IotDemoScenarioService {

    private static final List<String> OPEN_ALARM_STATUSES = List.of("OPEN", "ACKNOWLEDGED");
    private static final List<String> PENDING_MAINTENANCE_STATUSES = List.of("PENDING", "SCHEDULED", "IN_PROGRESS");
    private static final List<String> CRITICAL_ALARM_SEVERITIES = List.of("CRITICAL");
    private static final String DEMO_SOURCE = "demo-simulator";
    private static final String DEMO_ASSIGNEE = "Demo Field Team";
    private static final Duration START_OFFLINE_AGE = Duration.ofHours(2);
    private static final int STARTUP_OFFLINE_WARMUP_CYCLES = 4;

    private static final List<DemoDeviceProfile> DEVICE_PROFILES = List.of(
            new DemoDeviceProfile(
                    "compressor",
                    "DEMO Compressor CP-01",
                    "DEMO-IOT-CP01",
                    "ACTUATOR",
                    "North Plant / Utility Bay",
                    "DEMO compressor connected over Modbus with pressure, temperature, vibration and current monitoring.",
                    "MODBUS_TCP",
                    "10.14.0.21",
                    502,
                    1,
                    "5s",
                    "gw-demo-01",
                    false,
                    List.of(
                            new DemoRegisterProfile("DEMO Discharge Temperature", "temperature", "FC03", 40001, "c", "DECIMAL", 42, 85, 68, 4.2, 0.7, 1),
                            new DemoRegisterProfile("DEMO Line Pressure", "pressure", "FC03", 40002, "bar", "DECIMAL", 3.5, 7.2, 5.6, 0.55, 0.15, 2),
                            new DemoRegisterProfile("DEMO Bearing Vibration", "vibration", "FC03", 40003, "mm/s", "DECIMAL", 0, 4.5, 1.9, 0.45, 0.12, 4),
                            new DemoRegisterProfile("DEMO Motor Current", "current", "FC03", 40004, "a", "DECIMAL", 0, 90, 57, 6.5, 1.4, 5),
                            new DemoRegisterProfile("DEMO Communication Status", "communication_status", "FC01", 1, null, "BOOLEAN", 1, 1, 1, 0, 0, 0)
                    )
            ),
            new DemoDeviceProfile(
                    "tower",
                    "DEMO Cooling Tower CT-02",
                    "DEMO-IOT-CT02",
                    "SENSOR",
                    "North Plant / Cooling Loop",
                    "DEMO cooling tower with inlet temperature, level and fan behavior mapped over Modbus.",
                    "MODBUS_TCP",
                    "10.14.0.22",
                    502,
                    2,
                    "10s",
                    "gw-demo-01",
                    false,
                    List.of(
                            new DemoRegisterProfile("DEMO Water Inlet Temperature", "temperature", "FC03", 40101, "c", "DECIMAL", 18, 36, 27.5, 2.2, 0.5, 2),
                            new DemoRegisterProfile("DEMO Basin Level", "level", "FC03", 40102, "%", "DECIMAL", 25, 88, 63, 6.8, 1.1, 3),
                            new DemoRegisterProfile("DEMO Fan Current", "current", "FC03", 40103, "a", "DECIMAL", 0, 72, 41, 5.0, 1.0, 5),
                            new DemoRegisterProfile("DEMO Tower Vibration", "vibration", "FC03", 40104, "mm/s", "DECIMAL", 0, 4.0, 1.5, 0.35, 0.1, 6),
                            new DemoRegisterProfile("DEMO Communication Status", "communication_status", "FC01", 101, null, "BOOLEAN", 1, 1, 1, 0, 0, 0)
                    )
            ),
            new DemoDeviceProfile(
                    "power-panel",
                    "DEMO Power Panel QGBT-01",
                    "DEMO-IOT-QGBT01",
                    "GATEWAY",
                    "Main Substation / Electrical Room",
                    "DEMO power panel summarizing voltage, load current and backup battery on the IoT showcase.",
                    "MODBUS_TCP",
                    "10.14.0.30",
                    502,
                    3,
                    "15s",
                    "gw-demo-02",
                    false,
                    List.of(
                            new DemoRegisterProfile("DEMO Line Voltage", "voltage", "FC04", 30011, "v", "DECIMAL", 360, 440, 398, 7.5, 1.5, 1),
                            new DemoRegisterProfile("DEMO Line Current", "current", "FC04", 30012, "a", "DECIMAL", 0, 130, 76, 9.0, 2.2, 4),
                            new DemoRegisterProfile("DEMO Backup Battery", "battery", "FC04", 30013, "%", "DECIMAL", 25, 100, 74, 3.5, 0.8, 5),
                            new DemoRegisterProfile("DEMO Communication Status", "communication_status", "FC01", 201, null, "BOOLEAN", 1, 1, 1, 0, 0, 0)
                    )
            ),
            new DemoDeviceProfile(
                    "pump",
                    "DEMO Pump Station BM-03",
                    "DEMO-IOT-BM03",
                    "ACTUATOR",
                    "South Line / Tank House",
                    "DEMO pump station starting offline and then returning to service to support the live demo narrative.",
                    "MODBUS_TCP",
                    "10.14.0.41",
                    502,
                    4,
                    "5s",
                    "gw-demo-03",
                    true,
                    List.of(
                            new DemoRegisterProfile("DEMO Suction Pressure", "pressure", "FC03", 40201, "bar", "DECIMAL", 2.2, 6.5, 4.4, 0.45, 0.12, 1),
                            new DemoRegisterProfile("DEMO Tank Level", "level", "FC03", 40202, "%", "DECIMAL", 18, 82, 57, 7.2, 1.2, 2),
                            new DemoRegisterProfile("DEMO Pump Current", "current", "FC03", 40203, "a", "DECIMAL", 0, 82, 49, 5.4, 1.1, 3),
                            new DemoRegisterProfile("DEMO Pump Vibration", "vibration", "FC03", 40204, "mm/s", "DECIMAL", 0, 4.3, 1.7, 0.3, 0.08, 4),
                            new DemoRegisterProfile("DEMO Communication Status", "communication_status", "FC01", 301, null, "BOOLEAN", 1, 1, 1, 0, 0, 0)
                    )
            )
    );

    private static final List<SeedMaintenanceProfile> SEED_MAINTENANCE = List.of(
            new SeedMaintenanceProfile(
                    "DEMO - Preventive inspection - QGBT-01",
                    "DEMO preventive check for the main panel before the executive walkthrough.",
                    "power-panel",
                    "SCHEDULED",
                    "MEDIUM",
                    Duration.ofMinutes(45),
                    "Electrical Squad Demo"
            ),
            new SeedMaintenanceProfile(
                    "DEMO - Cleaning plan - CT-02",
                    "DEMO action to review level sensors and remove scale from the cooling tower basin.",
                    "tower",
                    "PENDING",
                    "HIGH",
                    Duration.ofMinutes(20),
                    "Utilities Team Demo"
            )
    );

    private final IotDemoProperties properties;
    private final TenantRepository tenantRepository;
    private final IotDeviceRepository deviceRepository;
    private final IotRegisterRepository registerRepository;
    private final IotAlarmRepository alarmRepository;
    private final IotMaintenanceRepository maintenanceRepository;
    private final IotDeviceService deviceService;
    private final IotRegisterService registerService;
    private final IotMaintenanceService maintenanceService;
    private final TelemetryWriter telemetryWriter;
    private final AtomicLong cycleCounter = new AtomicLong();

    public IotDemoScenarioService(
            IotDemoProperties properties,
            TenantRepository tenantRepository,
            IotDeviceRepository deviceRepository,
            IotRegisterRepository registerRepository,
            IotAlarmRepository alarmRepository,
            IotMaintenanceRepository maintenanceRepository,
            IotDeviceService deviceService,
            IotRegisterService registerService,
            IotMaintenanceService maintenanceService,
            TelemetryWriter telemetryWriter
    ) {
        this.properties = properties;
        this.tenantRepository = tenantRepository;
        this.deviceRepository = deviceRepository;
        this.registerRepository = registerRepository;
        this.alarmRepository = alarmRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.deviceService = deviceService;
        this.registerService = registerService;
        this.maintenanceService = maintenanceService;
        this.telemetryWriter = telemetryWriter;
    }

    @Transactional
    public DemoSeedSummary ensureDemoBase() {
        UUID tenantId = resolveTenantId();
        return withTenantContext(tenantId, () -> {
            List<DemoDeviceContext> devices = new ArrayList<>();
            int totalRegisters = 0;

            for (DemoDeviceProfile profile : DEVICE_PROFILES) {
                DemoDeviceContext context = ensureDeviceContext(tenantId, profile);
                devices.add(context);
                totalRegisters += context.registers().size();
            }

            int totalMaintenance = ensureSeedMaintenance(devices);
            return new DemoSeedSummary(devices.size(), totalRegisters, totalMaintenance);
        });
    }

    @Transactional
    public DemoTickSummary generateTick() {
        UUID tenantId = resolveTenantId();
        return withTenantContext(tenantId, () -> {
            List<DemoDeviceContext> devices = new ArrayList<>();
            for (DemoDeviceProfile profile : DEVICE_PROFILES) {
                devices.add(ensureDeviceContext(tenantId, profile));
            }

            long cycle = cycleCounter.incrementAndGet();
            Instant baseRecordedAt = Instant.now();
            int telemetryPoints = 0;

            for (DemoDeviceContext deviceContext : devices) {
                if (shouldHoldDeviceOffline(deviceContext.profile(), cycle)) {
                    continue;
                }

                for (DemoRegisterContext registerContext : deviceContext.registers()) {
                    BigDecimal metricValue = simulateMetricValue(deviceContext.profile(), registerContext.profile(), cycle);
                    telemetryWriter.write(
                            tenantId,
                            new IotTelemetryCreateRequest(
                                    deviceContext.device().getId(),
                                    registerContext.register().getId(),
                                    registerContext.profile().metricName(),
                                    metricValue,
                                    registerContext.profile().unit(),
                                    buildMetadata(deviceContext.profile(), registerContext.profile(), cycle),
                                    baseRecordedAt.plusMillis(telemetryPoints * 75L)
                            )
                    );
                    telemetryPoints++;
                }
            }

            int maintenanceCreated = syncMaintenanceFromCriticalAlarms(devices);
            return new DemoTickSummary(cycle, telemetryPoints, maintenanceCreated);
        });
    }

    private DemoDeviceContext ensureDeviceContext(UUID tenantId, DemoDeviceProfile profile) {
        IotDevice device = deviceRepository.findByTenantIdAndIdentifierIgnoreCaseAndDeletedAtIsNull(tenantId, profile.identifier())
                .orElseGet(() -> createDevice(profile));

        if (profile.startsOffline() && device.getLastSeenAt() == null) {
            device.setStatus("OFFLINE");
            device.setLastSeenAt(Instant.now().minus(START_OFFLINE_AGE));
            device = deviceRepository.save(device);
        }

        UUID deviceId = device.getId();
        List<DemoRegisterContext> registers = new ArrayList<>();
        for (DemoRegisterProfile registerProfile : profile.registers()) {
            IotRegister register = registerRepository
                    .findByTenantIdAndDeviceIdAndFunctionCodeIgnoreCaseAndRegisterAddressAndDeletedAtIsNull(
                            tenantId,
                            deviceId,
                            registerProfile.functionCode(),
                            registerProfile.registerAddress()
                    )
                    .orElseGet(() -> createRegister(deviceId, registerProfile));
            registers.add(new DemoRegisterContext(registerProfile, register));
        }

        return new DemoDeviceContext(profile, device, registers);
    }

    private IotDevice createDevice(DemoDeviceProfile profile) {
        var response = deviceService.create(new IotDeviceCreateRequest(
                profile.name(),
                profile.identifier(),
                profile.type(),
                profile.location(),
                profile.description(),
                "ONLINE",
                profile.transport(),
                profile.host(),
                profile.port(),
                profile.unitId(),
                profile.pollingProfile(),
                profile.gateway()
        ));

        return deviceRepository.findByIdAndTenantId(response.id(), TenantContext.getRequiredTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Seeded IoT demo device not found for tenant."));
    }

    private IotRegister createRegister(UUID deviceId, DemoRegisterProfile profile) {
        var response = registerService.create(new IotRegisterCreateRequest(
                deviceId,
                profile.name(),
                null,
                profile.functionCode(),
                profile.registerAddress(),
                profile.metricName(),
                profile.unit(),
                profile.dataType(),
                toDecimal(profile.minThreshold()),
                toDecimal(profile.maxThreshold()),
                "ACTIVE"
        ));

        return registerRepository.findByIdAndTenantId(response.id(), TenantContext.getRequiredTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Seeded IoT demo register not found for tenant."));
    }

    private int ensureSeedMaintenance(List<DemoDeviceContext> devices) {
        Map<String, DemoDeviceContext> byKey = new LinkedHashMap<>();
        devices.forEach(device -> byKey.put(device.profile().key(), device));

        int created = 0;
        for (SeedMaintenanceProfile profile : SEED_MAINTENANCE) {
            if (maintenanceRepository.existsByTenantIdAndTitleIgnoreCaseAndDeletedAtIsNull(
                    TenantContext.getRequiredTenantId(),
                    profile.title()
            )) {
                continue;
            }

            DemoDeviceContext context = byKey.get(profile.deviceKey());
            if (context == null) {
                continue;
            }

            maintenanceService.create(new IotMaintenanceCreateRequest(
                    context.device().getId(),
                    null,
                    null,
                    profile.title(),
                    profile.description(),
                    profile.status(),
                    profile.priority(),
                    "MANUAL",
                    "Demo showcase preparation",
                    Instant.now().plus(profile.scheduleOffset()),
                    null,
                    null,
                    profile.assignedUserLabel()
            ));
            created++;
        }

        int reactiveCreated = syncMaintenanceFromCriticalAlarms(devices);
        return created + reactiveCreated;
    }

    private int syncMaintenanceFromCriticalAlarms(List<DemoDeviceContext> devices) {
        UUID tenantId = TenantContext.getRequiredTenantId();
        long pendingMaintenance = maintenanceRepository.countByTenantIdAndStatusInAndDeletedAtIsNull(
                tenantId,
                PENDING_MAINTENANCE_STATUSES
        );
        if (pendingMaintenance >= properties.getMaxPendingMaintenance()) {
            return 0;
        }

        Map<UUID, DemoDeviceContext> devicesById = new LinkedHashMap<>();
        devices.forEach(device -> devicesById.put(device.device().getId(), device));

        int created = 0;
        for (IotAlarm alarm : alarmRepository.findTop5ByTenantIdAndSeverityInAndStatusInOrderByTriggeredAtDesc(
                tenantId,
                CRITICAL_ALARM_SEVERITIES,
                OPEN_ALARM_STATUSES
        )) {
            if (maintenanceRepository.existsByTenantIdAndLinkedAlarmIdAndDeletedAtIsNull(tenantId, alarm.getId())) {
                continue;
            }
            if (maintenanceRepository.countByTenantIdAndStatusInAndDeletedAtIsNull(tenantId, PENDING_MAINTENANCE_STATUSES)
                    >= properties.getMaxPendingMaintenance()) {
                break;
            }

            DemoDeviceContext context = devicesById.get(alarm.getDeviceId());
            String title = context == null
                    ? "DEMO - Incident response"
                    : "DEMO - Incident response - " + context.device().getName();

            maintenanceService.create(new IotMaintenanceCreateRequest(
                    alarm.getDeviceId(),
                    alarm.getId(),
                    alarm.getRegisterId(),
                    title,
                    "DEMO field action opened automatically from a critical IoT alarm.",
                    "PENDING",
                    "CRITICAL",
                    null,
                    null,
                    Instant.now().plus(Duration.ofMinutes(10)),
                    null,
                    null,
                    DEMO_ASSIGNEE
            ));
            created++;
        }

        return created;
    }

    private boolean shouldHoldDeviceOffline(DemoDeviceProfile profile, long cycle) {
        return profile.startsOffline() && cycle <= STARTUP_OFFLINE_WARMUP_CYCLES;
    }

    private Map<String, Object> buildMetadata(DemoDeviceProfile device, DemoRegisterProfile register, long cycle) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", DEMO_SOURCE);
        metadata.put("functionCode", register.functionCode());
        metadata.put("registerAddress", register.registerAddress());
        metadata.put("deviceProfile", device.key());
        metadata.put("demoCycle", cycle);
        metadata.put("pollingProfile", device.pollingProfile());
        return metadata;
    }

    private BigDecimal simulateMetricValue(DemoDeviceProfile device, DemoRegisterProfile register, long cycle) {
        if ("BOOLEAN".equalsIgnoreCase(register.dataType())) {
            return shouldHoldDeviceOffline(device, cycle) ? BigDecimal.ZERO : BigDecimal.ONE;
        }

        double value = register.baseValue()
                + Math.sin((cycle + register.phaseOffset()) / 2.7d) * register.amplitude()
                + Math.cos((cycle + register.phaseOffset()) / 4.9d) * register.noise();

        value = applyExcursion(device.key(), register.metricName(), cycle, value, register);
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private double applyExcursion(
            String deviceKey,
            String metricName,
            long cycle,
            double value,
            DemoRegisterProfile register
    ) {
        if ("compressor".equals(deviceKey) && "pressure".equals(metricName) && cycle % 10L <= 1L) {
            return register.maxThreshold() + (cycle % 10L == 0L ? 1.4d : 0.8d);
        }
        if ("tower".equals(deviceKey) && "vibration".equals(metricName) && cycle % 12L == 5L) {
            return register.maxThreshold() + 1.2d;
        }
        if ("power-panel".equals(deviceKey) && "battery".equals(metricName) && cycle % 14L >= 6L && cycle % 14L <= 7L) {
            return register.minThreshold() - 7.0d;
        }
        if ("pump".equals(deviceKey) && "level".equals(metricName) && cycle % 16L == 8L) {
            return register.minThreshold() - 10.0d;
        }

        double floor = register.minThreshold() - 1.5d;
        double ceiling = register.maxThreshold() + 1.5d;
        return Math.max(floor, Math.min(ceiling, value));
    }

    private BigDecimal toDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private UUID resolveTenantId() {
        return tenantRepository.findByCodeIgnoreCase(properties.getTenantCode())
                .map(tenant -> tenant.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Demo tenant not found for code '" + properties.getTenantCode() + "'."
                ));
    }

    private <T> T withTenantContext(UUID tenantId, Supplier<T> callback) {
        UUID previousTenantId = TenantContext.getTenantId();
        TenantContext.setTenantId(tenantId);
        try {
            return callback.get();
        } finally {
            if (previousTenantId == null) {
                TenantContext.clear();
            } else {
                TenantContext.setTenantId(previousTenantId);
            }
        }
    }

    public record DemoSeedSummary(int totalDevices, int totalRegisters, int totalMaintenance) {
    }

    public record DemoTickSummary(long cycle, int telemetryPoints, int maintenanceCreated) {
    }

    private record DemoDeviceContext(DemoDeviceProfile profile, IotDevice device, List<DemoRegisterContext> registers) {
    }

    private record DemoRegisterContext(DemoRegisterProfile profile, IotRegister register) {
    }

    private record DemoDeviceProfile(
            String key,
            String name,
            String identifier,
            String type,
            String location,
            String description,
            String transport,
            String host,
            int port,
            int unitId,
            String pollingProfile,
            String gateway,
            boolean startsOffline,
            List<DemoRegisterProfile> registers
    ) {
    }

    private record DemoRegisterProfile(
            String name,
            String metricName,
            String functionCode,
            int registerAddress,
            String unit,
            String dataType,
            double minThreshold,
            double maxThreshold,
            double baseValue,
            double amplitude,
            double noise,
            int phaseOffset
    ) {
    }

    private record SeedMaintenanceProfile(
            String title,
            String description,
            String deviceKey,
            String status,
            String priority,
            Duration scheduleOffset,
            String assignedUserLabel
    ) {
    }
}
