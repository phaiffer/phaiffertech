package com.phaiffertech.platform.core.tenant.service;

public final class TenantContractGrantSource {

    public static final String PLAN = "PLAN";
    public static final String MANUAL = "MANUAL";
    public static final String PLAN_MANUAL = "PLAN_MANUAL";

    private TenantContractGrantSource() {
    }

    public static boolean includesPlan(String source) {
        return PLAN.equals(source) || PLAN_MANUAL.equals(source);
    }

    public static boolean includesManual(String source) {
        return MANUAL.equals(source) || PLAN_MANUAL.equals(source);
    }

    public static String resolve(boolean planEnabled, boolean manualEnabled) {
        if (planEnabled && manualEnabled) {
            return PLAN_MANUAL;
        }
        if (planEnabled) {
            return PLAN;
        }
        if (manualEnabled) {
            return MANUAL;
        }
        return null;
    }
}
