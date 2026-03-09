package com.phaiffertech.platform.modules.iot.register.mapper;

import com.phaiffertech.platform.modules.iot.register.domain.IotRegister;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterCreateRequest;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterResponse;
import com.phaiffertech.platform.modules.iot.register.dto.IotRegisterUpdateRequest;
import com.phaiffertech.platform.shared.crud.BaseCrudMapper;
import java.util.regex.Pattern;

public final class IotRegisterMapper implements BaseCrudMapper<
        IotRegister,
        IotRegisterCreateRequest,
        IotRegisterUpdateRequest,
        IotRegisterResponse> {

    public static final IotRegisterMapper INSTANCE = new IotRegisterMapper();

    private IotRegisterMapper() {
    }

    @Override
    public IotRegister toNewEntity(IotRegisterCreateRequest request) {
        ModbusMapping mapping = resolveMapping(
                request.code(),
                request.functionCode(),
                request.registerAddress(),
                null
        );
        IotRegister entity = new IotRegister();
        entity.setDeviceId(request.deviceId());
        entity.setName(request.name().trim());
        entity.setCode(mapping.code());
        entity.setFunctionCode(mapping.functionCode());
        entity.setRegisterAddress(mapping.registerAddress());
        entity.setMetricName(normalizeMetric(request.metricName()));
        entity.setUnit(normalizeUnit(request.unit()));
        entity.setDataType(normalizeUpper(request.dataType()));
        entity.setMinThreshold(request.minThreshold());
        entity.setMaxThreshold(request.maxThreshold());
        entity.setStatus(resolveStatus(request.status()));
        return entity;
    }

    @Override
    public void updateEntity(IotRegister entity, IotRegisterUpdateRequest request) {
        ModbusMapping mapping = resolveMapping(
                request.code(),
                request.functionCode(),
                request.registerAddress(),
                entity
        );
        entity.setDeviceId(request.deviceId());
        entity.setName(request.name().trim());
        entity.setCode(mapping.code());
        entity.setFunctionCode(mapping.functionCode());
        entity.setRegisterAddress(mapping.registerAddress());
        entity.setMetricName(normalizeMetric(request.metricName()));
        entity.setUnit(normalizeUnit(request.unit()));
        entity.setDataType(normalizeUpper(request.dataType()));
        entity.setMinThreshold(request.minThreshold());
        entity.setMaxThreshold(request.maxThreshold());
        entity.setStatus(resolveStatus(request.status()));
    }

    @Override
    public IotRegisterResponse toResponse(IotRegister entity) {
        ModbusMapping mapping = resolveMapping(
                entity.getCode(),
                entity.getFunctionCode(),
                entity.getRegisterAddress(),
                entity
        );
        return new IotRegisterResponse(
                entity.getId(),
                entity.getDeviceId(),
                entity.getName(),
                mapping.code(),
                mapping.functionCode(),
                mapping.registerAddress(),
                entity.getMetricName(),
                entity.getUnit(),
                entity.getDataType(),
                entity.getMinThreshold(),
                entity.getMaxThreshold(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalizeUpper(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private String normalizeMetric(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String normalizeUnit(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }

    private String resolveStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ACTIVE";
        }
        return status.trim().toUpperCase();
    }

    private ModbusMapping resolveMapping(
            String code,
            String functionCode,
            Integer registerAddress,
            IotRegister current
    ) {
        String normalizedCode = normalizeUpper(code);
        String normalizedFunctionCode = normalizeUpper(functionCode);
        ModbusMapping parsed = parseLegacyCode(normalizedCode);

        String resolvedFunctionCode = firstNonBlank(
                normalizedFunctionCode,
                parsed.functionCode(),
                current == null ? null : normalizeUpper(current.getFunctionCode())
        );
        Integer resolvedRegisterAddress = firstNonNull(
                registerAddress,
                parsed.registerAddress(),
                current == null ? null : current.getRegisterAddress()
        );

        String resolvedCode;
        if (resolvedFunctionCode != null && resolvedRegisterAddress != null) {
            resolvedCode = buildCode(resolvedFunctionCode, resolvedRegisterAddress);
        } else {
            resolvedCode = firstNonBlank(
                    normalizedCode,
                    current == null ? null : normalizeUpper(current.getCode())
            );
        }

        return new ModbusMapping(resolvedCode, resolvedFunctionCode, resolvedRegisterAddress);
    }

    private ModbusMapping parseLegacyCode(String code) {
        if (code == null) {
            return ModbusMapping.EMPTY;
        }

        var matcher = LEGACY_MODBUS_CODE_PATTERN.matcher(code);
        if (!matcher.matches()) {
            return ModbusMapping.EMPTY;
        }

        Integer parsedRegisterAddress = parseInteger(matcher.group(2));
        return new ModbusMapping(
                buildCode(matcher.group(1), parsedRegisterAddress),
                normalizeUpper(matcher.group(1)),
                parsedRegisterAddress
        );
    }

    private String buildCode(String functionCode, Integer registerAddress) {
        if (functionCode == null || registerAddress == null) {
            return null;
        }
        return functionCode + ":" + registerAddress;
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

    private static final Pattern LEGACY_MODBUS_CODE_PATTERN = Pattern.compile(
            "(?i)^(FC\\d{2})\\s*[:\\-]\\s*(\\d{1,6})$"
    );

    private record ModbusMapping(String code, String functionCode, Integer registerAddress) {
        private static final ModbusMapping EMPTY = new ModbusMapping(null, null, null);
    }
}
