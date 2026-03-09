package com.phaiffertech.platform.modules.iot.device.mapper;

import com.phaiffertech.platform.modules.iot.device.domain.IotDevice;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceCreateRequest;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceResponse;
import com.phaiffertech.platform.modules.iot.device.dto.IotDeviceUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.util.regex.Pattern;

public final class IotDeviceMapper implements BaseCrudMapper<
        IotDevice,
        IotDeviceCreateRequest,
        IotDeviceUpdateRequest,
        IotDeviceResponse> {

    public static final IotDeviceMapper INSTANCE = new IotDeviceMapper();

    private IotDeviceMapper() {
    }

    @Override
    public IotDevice toNewEntity(IotDeviceCreateRequest request) {
        DeviceConnection connection = resolveConnection(
                request.transport(),
                request.host(),
                request.port(),
                request.unitId(),
                request.pollingProfile(),
                request.gateway(),
                request.description(),
                null
        );
        IotDevice device = new IotDevice();
        device.setName(request.name().trim());
        device.setIdentifier(request.identifier().trim());
        device.setSerialNumber(request.identifier().trim());
        device.setType(normalizeUpper(request.type()));
        device.setLocation(normalizeText(request.location()));
        device.setDescription(normalizeText(request.description()));
        device.setTransport(connection.transport());
        device.setHost(connection.host());
        device.setPort(connection.port());
        device.setUnitId(connection.unitId());
        device.setPollingProfile(connection.pollingProfile());
        device.setGateway(connection.gateway());
        device.setStatus(resolveStatus(request.status()));
        return device;
    }

    @Override
    public void updateEntity(IotDevice entity, IotDeviceUpdateRequest request) {
        DeviceConnection connection = resolveConnection(
                request.transport(),
                request.host(),
                request.port(),
                request.unitId(),
                request.pollingProfile(),
                request.gateway(),
                request.description(),
                entity
        );
        entity.setName(request.name().trim());
        entity.setIdentifier(request.identifier().trim());
        entity.setSerialNumber(request.identifier().trim());
        entity.setType(normalizeUpper(request.type()));
        entity.setLocation(normalizeText(request.location()));
        entity.setDescription(normalizeText(request.description()));
        entity.setTransport(connection.transport());
        entity.setHost(connection.host());
        entity.setPort(connection.port());
        entity.setUnitId(connection.unitId());
        entity.setPollingProfile(connection.pollingProfile());
        entity.setGateway(connection.gateway());
        entity.setStatus(resolveStatus(request.status()));
    }

    @Override
    public IotDeviceResponse toResponse(IotDevice device) {
        DeviceConnection connection = resolveConnection(
                device.getTransport(),
                device.getHost(),
                device.getPort(),
                device.getUnitId(),
                device.getPollingProfile(),
                device.getGateway(),
                device.getDescription(),
                device
        );
        return new IotDeviceResponse(
                device.getId(),
                device.getName(),
                device.getIdentifier(),
                device.getType(),
                device.getLocation(),
                device.getDescription(),
                connection.transport(),
                connection.host(),
                connection.port(),
                connection.unitId(),
                connection.pollingProfile(),
                connection.gateway(),
                device.getStatus(),
                device.getLastSeenAt(),
                device.getCreatedAt(),
                device.getUpdatedAt()
        );
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ONLINE";
        }
        return status.trim().toUpperCase();
    }

    private String normalizeUpper(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private DeviceConnection resolveConnection(
            String transport,
            String host,
            Integer port,
            Integer unitId,
            String pollingProfile,
            String gateway,
            String description,
            IotDevice current
    ) {
        DeviceConnection parsed = parseLegacyDescription(description);

        String resolvedTransport = firstNonBlank(
                normalizeUpper(transport),
                parsed.transport(),
                current == null ? null : normalizeUpper(current.getTransport())
        );
        String resolvedHost = firstNonBlank(
                normalizeText(host),
                parsed.host(),
                current == null ? null : normalizeText(current.getHost())
        );
        Integer resolvedPort = firstNonNull(
                port,
                parsed.port(),
                current == null ? null : current.getPort()
        );
        Integer resolvedUnitId = firstNonNull(
                unitId,
                parsed.unitId(),
                current == null ? null : current.getUnitId()
        );
        String resolvedPollingProfile = firstNonBlank(
                normalizeText(pollingProfile),
                current == null ? null : normalizeText(current.getPollingProfile())
        );
        String resolvedGateway = firstNonBlank(
                normalizeText(gateway),
                parsed.gateway(),
                current == null ? null : normalizeText(current.getGateway())
        );

        if (resolvedTransport != null && resolvedPort == null) {
            resolvedPort = 502;
        }

        if ("MODBUS_RTU".equals(resolvedTransport) && resolvedGateway == null) {
            resolvedGateway = resolvedHost;
        }

        return new DeviceConnection(
                resolvedTransport,
                resolvedHost,
                resolvedPort,
                resolvedUnitId,
                resolvedPollingProfile,
                resolvedGateway
        );
    }

    private DeviceConnection parseLegacyDescription(String description) {
        String normalizedDescription = normalizeText(description);
        if (normalizedDescription == null) {
            return DeviceConnection.EMPTY;
        }

        var tcpMatcher = MODBUS_TCP_PATTERN.matcher(normalizedDescription);
        if (tcpMatcher.find()) {
            return new DeviceConnection(
                    "MODBUS_TCP",
                    normalizeText(tcpMatcher.group(1)),
                    parseInteger(tcpMatcher.group(2)),
                    parseInteger(tcpMatcher.group(3)),
                    null,
                    null
            );
        }

        var rtuMatcher = MODBUS_RTU_PATTERN.matcher(normalizedDescription);
        if (rtuMatcher.find()) {
            String resolvedGateway = normalizeText(rtuMatcher.group(1));
            return new DeviceConnection(
                    "MODBUS_RTU",
                    resolvedGateway,
                    502,
                    parseInteger(rtuMatcher.group(2)),
                    null,
                    resolvedGateway
            );
        }

        return DeviceConnection.EMPTY;
    }

    private Integer parseInteger(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    @SafeVarargs
    private <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private static final Pattern MODBUS_TCP_PATTERN = Pattern.compile(
            "Modbus TCP\\s+([A-Za-z0-9._-]+):(\\d+)\\s+•\\s+Unit\\s+(\\d+)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern MODBUS_RTU_PATTERN = Pattern.compile(
            "Modbus RTU/RS-485\\s+•\\s+Gateway\\s+([^|•]+?)\\s+•\\s+Slave\\s+(\\d+)",
            Pattern.CASE_INSENSITIVE
    );

    private record DeviceConnection(
            String transport,
            String host,
            Integer port,
            Integer unitId,
            String pollingProfile,
            String gateway
    ) {
        private static final DeviceConnection EMPTY = new DeviceConnection(null, null, null, null, null, null);
    }
}
