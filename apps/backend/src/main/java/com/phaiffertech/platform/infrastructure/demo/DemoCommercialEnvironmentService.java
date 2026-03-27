package com.phaiffertech.platform.infrastructure.demo;

import com.phaiffertech.platform.core.iam.domain.Role;
import com.phaiffertech.platform.core.iam.domain.UserTenant;
import com.phaiffertech.platform.core.iam.domain.UserTenantRole;
import com.phaiffertech.platform.core.iam.repository.RoleRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRepository;
import com.phaiffertech.platform.core.iam.repository.UserTenantRoleRepository;
import com.phaiffertech.platform.core.module.domain.ModuleDefinition;
import com.phaiffertech.platform.core.module.domain.TenantModule;
import com.phaiffertech.platform.core.module.repository.ModuleDefinitionRepository;
import com.phaiffertech.platform.core.module.repository.TenantModuleRepository;
import com.phaiffertech.platform.core.tenant.entitlement.service.TenantEntitlementService;
import com.phaiffertech.platform.core.tenant.domain.Tenant;
import com.phaiffertech.platform.core.tenant.domain.TenantThemeMode;
import com.phaiffertech.platform.core.tenant.repository.TenantRepository;
import com.phaiffertech.platform.core.tenant.service.TenantModuleContractService;
import com.phaiffertech.platform.core.user.domain.User;
import com.phaiffertech.platform.core.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoCommercialEnvironmentService {

        private static final String SEED_ACTOR = "demo-commercial";

        private static final UUID CRM_AGROTECH_COMPANY_ID = uuid("10000000-0000-0000-0000-000000000001");
        private static final UUID CRM_PETCARE_COMPANY_ID = uuid("10000000-0000-0000-0000-000000000002");
        private static final UUID CRM_DELTA_COMPANY_ID = uuid("10000000-0000-0000-0000-000000000003");

        private static final UUID CRM_CARLOS_CONTACT_ID = uuid("10000000-0000-0000-0000-000000000011");
        private static final UUID CRM_ANA_CONTACT_ID = uuid("10000000-0000-0000-0000-000000000012");
        private static final UUID CRM_JULIANA_CONTACT_ID = uuid("10000000-0000-0000-0000-000000000013");

        private static final UUID CRM_AGROTECH_LEAD_ID = uuid("10000000-0000-0000-0000-000000000021");
        private static final UUID CRM_PETCARE_LEAD_ID = uuid("10000000-0000-0000-0000-000000000022");
        private static final UUID CRM_DELTA_LEAD_ID = uuid("10000000-0000-0000-0000-000000000023");

        private static final UUID CRM_PIPELINE_ID = uuid("10000000-0000-0000-0000-000000000031");
        private static final UUID CRM_STAGE_LEAD_ID = uuid("10000000-0000-0000-0000-000000000032");
        private static final UUID CRM_STAGE_QUALIFICATION_ID = uuid("10000000-0000-0000-0000-000000000033");
        private static final UUID CRM_STAGE_PROPOSAL_ID = uuid("10000000-0000-0000-0000-000000000034");
        private static final UUID CRM_STAGE_NEGOTIATION_ID = uuid("10000000-0000-0000-0000-000000000035");
        private static final UUID CRM_STAGE_CLOSED_ID = uuid("10000000-0000-0000-0000-000000000036");

        private static final UUID CRM_AGROTECH_DEAL_ID = uuid("10000000-0000-0000-0000-000000000041");
        private static final UUID CRM_PETCARE_DEAL_ID = uuid("10000000-0000-0000-0000-000000000042");
        private static final UUID CRM_DELTA_DEAL_ID = uuid("10000000-0000-0000-0000-000000000043");

        private static final UUID CRM_AGROTECH_TASK_ID = uuid("10000000-0000-0000-0000-000000000051");
        private static final UUID CRM_PETCARE_TASK_ID = uuid("10000000-0000-0000-0000-000000000052");
        private static final UUID CRM_DELTA_TASK_ID = uuid("10000000-0000-0000-0000-000000000053");

        private static final UUID CRM_AGROTECH_NOTE_ID = uuid("10000000-0000-0000-0000-000000000061");
        private static final UUID CRM_PETCARE_NOTE_ID = uuid("10000000-0000-0000-0000-000000000062");

        private static final UUID PET_MARIA_CLIENT_ID = uuid("20000000-0000-0000-0000-000000000001");
        private static final UUID PET_JOAO_CLIENT_ID = uuid("20000000-0000-0000-0000-000000000002");

        private static final UUID PET_REX_ID = uuid("20000000-0000-0000-0000-000000000011");
        private static final UUID PET_LUNA_ID = uuid("20000000-0000-0000-0000-000000000012");
        private static final UUID PET_THOR_ID = uuid("20000000-0000-0000-0000-000000000013");

        private static final UUID PET_SERVICE_VACCINATION_ID = uuid("20000000-0000-0000-0000-000000000021");
        private static final UUID PET_SERVICE_CHECKUP_ID = uuid("20000000-0000-0000-0000-000000000022");
        private static final UUID PET_SERVICE_CONSULTATION_ID = uuid("20000000-0000-0000-0000-000000000023");

        private static final UUID PET_PROFESSIONAL_MARINA_ID = uuid("20000000-0000-0000-0000-000000000031");
        private static final UUID PET_PROFESSIONAL_RAFAEL_ID = uuid("20000000-0000-0000-0000-000000000032");

        private static final UUID PET_APPOINTMENT_REX_ID = uuid("20000000-0000-0000-0000-000000000041");
        private static final UUID PET_APPOINTMENT_THOR_ID = uuid("20000000-0000-0000-0000-000000000042");
        private static final UUID PET_APPOINTMENT_LUNA_ID = uuid("20000000-0000-0000-0000-000000000043");
        private static final UUID PET_PLAN_MARIA_ID = uuid("20000000-0000-0000-0000-000000000044");

        private static final UUID PET_RECORD_REX_ID = uuid("20000000-0000-0000-0000-000000000051");
        private static final UUID PET_RECORD_THOR_ID = uuid("20000000-0000-0000-0000-000000000052");

        private static final UUID PET_VACCINATION_REX_ID = uuid("20000000-0000-0000-0000-000000000061");
        private static final UUID PET_VACCINATION_LUNA_ID = uuid("20000000-0000-0000-0000-000000000062");

        private static final UUID PET_PRODUCT_RABIES_ID = uuid("20000000-0000-0000-0000-000000000071");
        private static final UUID PET_PRODUCT_SUPPLEMENT_ID = uuid("20000000-0000-0000-0000-000000000072");
        private static final UUID PET_PRODUCT_PARASITE_ID = uuid("20000000-0000-0000-0000-000000000073");

        private static final UUID PET_INVENTORY_RABIES_ID = uuid("20000000-0000-0000-0000-000000000081");
        private static final UUID PET_INVENTORY_SUPPLEMENT_ID = uuid("20000000-0000-0000-0000-000000000082");
        private static final UUID PET_INVENTORY_PARASITE_ID = uuid("20000000-0000-0000-0000-000000000083");

        private static final UUID PET_INVOICE_MARIA_ID = uuid("20000000-0000-0000-0000-000000000091");
        private static final UUID PET_INVOICE_JOAO_ID = uuid("20000000-0000-0000-0000-000000000092");
        private static final UUID PET_PAYMENT_MARIA_ID = uuid("20000000-0000-0000-0000-000000000093");
        private static final UUID PET_CASH_MARIA_ID = uuid("20000000-0000-0000-0000-000000000094");

        private static final UUID IOT_COMPRESSOR_DEVICE_ID = uuid("30000000-0000-0000-0000-000000000001");
        private static final UUID IOT_OVEN_DEVICE_ID = uuid("30000000-0000-0000-0000-000000000002");
        private static final UUID IOT_PANEL_DEVICE_ID = uuid("30000000-0000-0000-0000-000000000003");

        private static final UUID IOT_COMPRESSOR_TEMPERATURE_ID = uuid("30000000-0000-0000-0000-000000000011");
        private static final UUID IOT_COMPRESSOR_VIBRATION_ID = uuid("30000000-0000-0000-0000-000000000012");
        private static final UUID IOT_COMPRESSOR_POWER_ID = uuid("30000000-0000-0000-0000-000000000013");
        private static final UUID IOT_OVEN_TEMPERATURE_ID = uuid("30000000-0000-0000-0000-000000000021");
        private static final UUID IOT_OVEN_VIBRATION_ID = uuid("30000000-0000-0000-0000-000000000022");
        private static final UUID IOT_OVEN_POWER_ID = uuid("30000000-0000-0000-0000-000000000023");
        private static final UUID IOT_PANEL_TEMPERATURE_ID = uuid("30000000-0000-0000-0000-000000000031");
        private static final UUID IOT_PANEL_VIBRATION_ID = uuid("30000000-0000-0000-0000-000000000032");
        private static final UUID IOT_PANEL_POWER_ID = uuid("30000000-0000-0000-0000-000000000033");

        private static final UUID IOT_TEMPERATURE_ALARM_ID = uuid("30000000-0000-0000-0000-000000000041");
        private static final UUID IOT_VIBRATION_ALARM_ID = uuid("30000000-0000-0000-0000-000000000042");

        private static final UUID IOT_OVEN_MAINTENANCE_ID = uuid("30000000-0000-0000-0000-000000000051");
        private static final UUID IOT_PANEL_MAINTENANCE_ID = uuid("30000000-0000-0000-0000-000000000052");

        private final DemoCommercialProperties properties;
        private final TenantRepository tenantRepository;
        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final UserTenantRepository userTenantRepository;
        private final UserTenantRoleRepository userTenantRoleRepository;
        private final ModuleDefinitionRepository moduleDefinitionRepository;
        private final TenantModuleRepository tenantModuleRepository;
        private final TenantModuleContractService tenantModuleContractService;
        private final TenantEntitlementService tenantEntitlementService;
        private final PasswordEncoder passwordEncoder;
        private final JdbcTemplate jdbcTemplate;
        private final EntityManager entityManager;

        public DemoCommercialEnvironmentService(
                        DemoCommercialProperties properties,
                        TenantRepository tenantRepository,
                        UserRepository userRepository,
                        RoleRepository roleRepository,
                        UserTenantRepository userTenantRepository,
                        UserTenantRoleRepository userTenantRoleRepository,
                        ModuleDefinitionRepository moduleDefinitionRepository,
                        TenantModuleRepository tenantModuleRepository,
                        TenantModuleContractService tenantModuleContractService,
                        TenantEntitlementService tenantEntitlementService,
                        PasswordEncoder passwordEncoder,
                        JdbcTemplate jdbcTemplate,
                        EntityManager entityManager) {
                this.properties = properties;
                this.tenantRepository = tenantRepository;
                this.userRepository = userRepository;
                this.roleRepository = roleRepository;
                this.userTenantRepository = userTenantRepository;
                this.userTenantRoleRepository = userTenantRoleRepository;
                this.moduleDefinitionRepository = moduleDefinitionRepository;
                this.tenantModuleRepository = tenantModuleRepository;
                this.tenantModuleContractService = tenantModuleContractService;
                this.tenantEntitlementService = tenantEntitlementService;
                this.passwordEncoder = passwordEncoder;
                this.jdbcTemplate = jdbcTemplate;
                this.entityManager = entityManager;
        }

        @Transactional
        public DemoCommercialSeedSummary seed() {
                validateProperties();

                Tenant tenant = ensureTenant();
                User user = ensureUser();
                Role tenantAdminRole = roleRepository.findByCode("TENANT_ADMIN")
                                .orElseThrow(() -> new IllegalStateException(
                                                "TENANT_ADMIN role should exist before demo seeding."));

                UserTenant userTenant = ensureUserTenant(tenant, user, tenantAdminRole);
                ensureUserTenantRole(userTenant, tenantAdminRole);
                enableModules(tenant.getId());
                tenantModuleContractService.syncEffectiveModules(tenant.getId(), tenant.getPlanCode(), List.of());
                tenantEntitlementService.syncManualEntitlements(tenant.getId(), tenant.getPlanCode(), List.of());
                flushPersistenceState();

                Tenant persistedTenant = tenant;
                User persistedUser = user;

                clearTenantData(persistedTenant.getId());

                Instant now = Instant.now();
                seedCrm(persistedTenant.getId(), persistedUser.getId(), now);
                seedPet(persistedTenant.getId(), now);
                seedIot(persistedTenant.getId(), persistedUser.getId(), now);

                return new DemoCommercialSeedSummary(
                                persistedTenant.getCode(),
                                persistedUser.getEmail(),
                                25,
                                25,
                                33);
        }

        private void validateProperties() {
                if (!properties.hasCredentialsConfigured()) {
                        throw new IllegalStateException("Commercial demo seed requires demo user email and password.");
                }
        }

        private Tenant ensureTenant() {
                Tenant tenant = tenantRepository.findByCodeIgnoreCase(properties.getTenantCode())
                                .orElseGet(Tenant::new);
                tenant.setName(properties.getTenantName());
                tenant.setCode(properties.getTenantCode());
                tenant.setStatus("ACTIVE");
                tenant.setPrimaryColor("#0f172a");
                tenant.setAccentColor("#16a34a");
                tenant.setDefaultThemeMode(TenantThemeMode.DARK);
                tenant.setAllowUserThemeOverride(true);
                tenant.setPlatformOwner(false);
                tenant.setPlanCode("ENTERPRISE");
                tenant.setDeletedAt(null);
                return tenantRepository.saveAndFlush(tenant);
        }

        private User ensureUser() {
                User user = userRepository.findByEmailIgnoreCase(properties.getUserEmail())
                                .orElseGet(User::new);
                user.setEmail(properties.getUserEmail());
                user.setFullName(properties.getUserFullName());
                user.setPasswordHash(passwordEncoder.encode(properties.getUserPassword()));
                user.setActive(true);
                user.setDeletedAt(null);
                return userRepository.saveAndFlush(user);
        }

        private UserTenant ensureUserTenant(Tenant tenant, User user, Role tenantAdminRole) {
                UserTenant userTenant = userTenantRepository.findByTenantIdAndUserId(tenant.getId(), user.getId())
                                .orElseGet(UserTenant::new);
                userTenant.setTenantId(tenant.getId());
                userTenant.setUserId(user.getId());
                userTenant.setRoleId(tenantAdminRole.getId());
                userTenant.setActive(true);
                userTenant.setDeletedAt(null);
                return userTenantRepository.saveAndFlush(userTenant);
        }

        private void ensureUserTenantRole(UserTenant userTenant, Role tenantAdminRole) {
                if (userTenantRoleRepository.existsByUserTenantIdAndRoleId(userTenant.getId(),
                                tenantAdminRole.getId())) {
                        return;
                }

                UserTenantRole userTenantRole = new UserTenantRole();
                userTenantRole.setUserTenantId(userTenant.getId());
                userTenantRole.setRoleId(tenantAdminRole.getId());
                userTenantRoleRepository.save(userTenantRole);
        }

        private void enableModules(UUID tenantId) {
                List<ModuleDefinition> definitions = moduleDefinitionRepository
                                .findAllByCodeInAndActiveTrueAndDeletedAtIsNull(
                                                List.of("CORE_PLATFORM", "CRM", "PET", "IOT"));

                for (ModuleDefinition definition : definitions) {
                        UUID moduleId = definition.getId();

                        Optional<TenantModule> existing = tenantModuleRepository
                                        .findByTenantIdAndModuleDefinitionId(tenantId, moduleId);

                        TenantModule tenantModule;

                        if (existing.isPresent()) {
                                tenantModule = existing.get();
                        } else {
                                tenantModule = new TenantModule();
                                tenantModule.setTenantId(tenantId);
                                tenantModule.setModuleDefinitionId(moduleId);
                        }

                        tenantModule.setEnabled(true);
                        tenantModule.setDeletedAt(null);

                        tenantModuleRepository.save(tenantModule);
                }

                tenantModuleRepository.flush();
        }

        private void flushPersistenceState() {
                entityManager.flush();
                entityManager.clear();
        }

        private Tenant resolvePersistedTenant() {
                return tenantRepository.findByCodeIgnoreCase(properties.getTenantCode())
                                .orElseThrow(() -> new IllegalStateException(
                                                "Commercial demo tenant was not persisted for code '"
                                                                + properties.getTenantCode() + "'."));
        }

        private User resolvePersistedUser() {
                return userRepository.findByEmailIgnoreCase(properties.getUserEmail())
                                .orElseThrow(() -> new IllegalStateException(
                                                "Commercial demo user was not persisted for email '"
                                                                + properties.getUserEmail() + "'."));
        }

        private void clearTenantData(UUID tenantId) {
                deleteByTenant("refresh_tokens", tenantId);
                deleteByTenant("audit_logs", tenantId);

                deleteByTenant("crm_notes", tenantId);
                deleteByTenant("crm_tasks", tenantId);
                deleteByTenant("crm_deals", tenantId);
                deleteByTenant("crm_pipeline_stages", tenantId);
                deleteByTenant("crm_pipelines", tenantId);
                deleteByTenant("crm_leads", tenantId);
                deleteByTenant("crm_contacts", tenantId);
                deleteByTenant("crm_companies", tenantId);

                deleteByTenant("pet_vaccinations", tenantId);
                deleteByTenant("pet_prescriptions", tenantId);
                deleteByTenant("pet_medical_records", tenantId);
                deleteByTenant("pet_appointments", tenantId);
                deleteByTenant("pet_inventory_movements", tenantId);
                deleteByTenant("pet_invoices", tenantId);
                deleteByTenant("finance_cash_movements", tenantId);
                deleteByTenant("finance_payments", tenantId);
                deleteByTenant("finance_invoices", tenantId);
                deleteByTenant("pet_products", tenantId);
                deleteByTenant("pet_services", tenantId);
                deleteByTenant("pet_professionals", tenantId);
                deleteByTenant("pet_profiles", tenantId);
                deleteByTenant("pet_client_plans", tenantId);
                deleteByTenant("pet_clients", tenantId);

                deleteByTenant("iot_parts", tenantId);
                deleteByTenant("iot_maintenance", tenantId);
                deleteByTenant("iot_alarms", tenantId);
                deleteByTenant("iot_telemetry_records", tenantId);
                deleteByTenant("iot_registers", tenantId);
                deleteByTenant("iot_devices", tenantId);

                deleteByTenant("inventory_movements", tenantId);
                deleteByTenant("inventory_items", tenantId);
        }

        private void deleteByTenant(String tableName, UUID tenantId) {
                jdbcTemplate.update("DELETE FROM " + tableName + " WHERE tenant_id = ?", tenantId);
        }

        private void seedCrm(UUID tenantId, UUID userId, Instant now) {
                insertCrmCompany(
                                CRM_AGROTECH_COMPANY_ID,
                                tenantId,
                                "AgroTech Sul",
                                "AgroTech Sul Automacao Industrial Ltda",
                                "12.345.678/0001-90",
                                "comercial@agrotechsul.com.br",
                                "+55 41 3200-1100",
                                "https://agrotechsul.demo",
                                "Industrial Automation",
                                "ACTIVE",
                                userId,
                                now.minus(Duration.ofDays(30)));
                insertCrmCompany(
                                CRM_PETCARE_COMPANY_ID,
                                tenantId,
                                "PetCare Curitiba",
                                "PetCare Curitiba Clinica Veterinaria Ltda",
                                "23.456.789/0001-10",
                                "contato@petcarecuritiba.com.br",
                                "+55 41 3200-2200",
                                "https://petcarecuritiba.demo",
                                "Veterinary Services",
                                "ACTIVE",
                                userId,
                                now.minus(Duration.ofDays(24)));
                insertCrmCompany(
                                CRM_DELTA_COMPANY_ID,
                                tenantId,
                                "Industria Delta",
                                "Industria Delta Componentes S.A.",
                                "34.567.890/0001-21",
                                "operacoes@industriadelta.com.br",
                                "+55 41 3200-3300",
                                "https://industriadelta.demo",
                                "Manufacturing",
                                "ACTIVE",
                                userId,
                                now.minus(Duration.ofDays(18)));

                insertCrmContact(
                                CRM_CARLOS_CONTACT_ID,
                                tenantId,
                                "Carlos",
                                "Mendes",
                                "carlos.mendes@agrotechsul.com.br",
                                "+55 41 99800-1101",
                                "AgroTech Sul",
                                CRM_AGROTECH_COMPANY_ID,
                                "ACTIVE",
                                userId,
                                now.minus(Duration.ofDays(17)));
                insertCrmContact(
                                CRM_ANA_CONTACT_ID,
                                tenantId,
                                "Ana",
                                "Ferreira",
                                "ana.ferreira@petcarecuritiba.com.br",
                                "+55 41 99800-2202",
                                "PetCare Curitiba",
                                CRM_PETCARE_COMPANY_ID,
                                "ACTIVE",
                                userId,
                                now.minus(Duration.ofDays(12)));
                insertCrmContact(
                                CRM_JULIANA_CONTACT_ID,
                                tenantId,
                                "Juliana",
                                "Costa",
                                "juliana.costa@industriadelta.com.br",
                                "+55 41 99800-3303",
                                "Industria Delta",
                                CRM_DELTA_COMPANY_ID,
                                "ACTIVE",
                                userId,
                                now.minus(Duration.ofDays(9)));

                insertCrmLead(
                                CRM_AGROTECH_LEAD_ID,
                                tenantId,
                                "Industrial monitoring proposal",
                                "monitoring@agrotechsul.com.br",
                                "+55 41 3200-4400",
                                "FIELD_VISIT",
                                "QUALIFIED",
                                userId,
                                CRM_AGROTECH_COMPANY_ID,
                                CRM_CARLOS_CONTACT_ID,
                                "Pilot scope confirmed for compressor, oven and energy panel monitoring.",
                                now.minus(Duration.ofDays(8)));
                insertCrmLead(
                                CRM_PETCARE_LEAD_ID,
                                tenantId,
                                "Veterinary software expansion",
                                "expansao@petcarecuritiba.com.br",
                                "+55 41 3200-5500",
                                "REFERRAL",
                                "NEGOTIATION",
                                userId,
                                CRM_PETCARE_COMPANY_ID,
                                CRM_ANA_CONTACT_ID,
                                "Clinic wants scheduling, records and billing in a single tenant workspace.",
                                now.minus(Duration.ofDays(6)));
                insertCrmLead(
                                CRM_DELTA_LEAD_ID,
                                tenantId,
                                "Predictive maintenance contract",
                                "projetos@industriadelta.com.br",
                                "+55 41 3200-6600",
                                "EXECUTIVE_MEETING",
                                "CLOSED_WON",
                                userId,
                                CRM_DELTA_COMPANY_ID,
                                CRM_JULIANA_CONTACT_ID,
                                "Board approved the connected maintenance rollout after the plant walkthrough.",
                                now.minus(Duration.ofDays(3)));

                insertCrmPipeline(tenantId, CRM_PIPELINE_ID, "Commercial Demo Pipeline", true,
                                now.minus(Duration.ofDays(10)));
                insertCrmPipelineStage(tenantId, CRM_STAGE_LEAD_ID, CRM_PIPELINE_ID, "Lead", "LEAD", 1, "#2563eb",
                                false, now.minus(Duration.ofDays(10)));
                insertCrmPipelineStage(tenantId, CRM_STAGE_QUALIFICATION_ID, CRM_PIPELINE_ID, "Qualification",
                                "QUALIFICATION", 2, "#0ea5e9", false, now.minus(Duration.ofDays(10)));
                insertCrmPipelineStage(tenantId, CRM_STAGE_PROPOSAL_ID, CRM_PIPELINE_ID, "Proposal", "PROPOSAL", 3,
                                "#14b8a6", false, now.minus(Duration.ofDays(10)));
                insertCrmPipelineStage(tenantId, CRM_STAGE_NEGOTIATION_ID, CRM_PIPELINE_ID, "Negotiation",
                                "NEGOTIATION", 4, "#f59e0b", false, now.minus(Duration.ofDays(10)));
                insertCrmPipelineStage(tenantId, CRM_STAGE_CLOSED_ID, CRM_PIPELINE_ID, "Closed", "CLOSED", 5, "#22c55e",
                                true, now.minus(Duration.ofDays(10)));

                insertCrmDeal(
                                CRM_AGROTECH_DEAL_ID,
                                tenantId,
                                "Industrial monitoring proposal",
                                "AgroTech Sul wants connected visibility for compressor, oven and panel telemetry.",
                                new BigDecimal("185000.00"),
                                "BRL",
                                "OPEN",
                                CRM_PIPELINE_ID,
                                CRM_STAGE_PROPOSAL_ID,
                                CRM_AGROTECH_COMPANY_ID,
                                CRM_CARLOS_CONTACT_ID,
                                CRM_AGROTECH_LEAD_ID,
                                userId,
                                LocalDate.now(ZoneOffset.UTC).plusDays(21),
                                now.minus(Duration.ofDays(5)));
                insertCrmDeal(
                                CRM_PETCARE_DEAL_ID,
                                tenantId,
                                "Veterinary software expansion",
                                "PetCare Curitiba is negotiating rollout for appointments, records and invoicing.",
                                new BigDecimal("96000.00"),
                                "BRL",
                                "OPEN",
                                CRM_PIPELINE_ID,
                                CRM_STAGE_NEGOTIATION_ID,
                                CRM_PETCARE_COMPANY_ID,
                                CRM_ANA_CONTACT_ID,
                                CRM_PETCARE_LEAD_ID,
                                userId,
                                LocalDate.now(ZoneOffset.UTC).plusDays(12),
                                now.minus(Duration.ofDays(4)));
                insertCrmDeal(
                                CRM_DELTA_DEAL_ID,
                                tenantId,
                                "Predictive maintenance contract",
                                "Industry Delta closed the predictive maintenance program after the executive review.",
                                new BigDecimal("240000.00"),
                                "BRL",
                                "CLOSED_WON",
                                CRM_PIPELINE_ID,
                                CRM_STAGE_CLOSED_ID,
                                CRM_DELTA_COMPANY_ID,
                                CRM_JULIANA_CONTACT_ID,
                                CRM_DELTA_LEAD_ID,
                                userId,
                                LocalDate.now(ZoneOffset.UTC).minusDays(8),
                                now.minus(Duration.ofDays(2)));

                insertCrmTask(
                                CRM_AGROTECH_TASK_ID,
                                tenantId,
                                "Confirm plant network topology",
                                "Validate Modbus TCP segmentation before sending the final proposal revision.",
                                now.plus(Duration.ofDays(2)),
                                "OPEN",
                                "HIGH",
                                userId,
                                CRM_AGROTECH_COMPANY_ID,
                                CRM_CARLOS_CONTACT_ID,
                                CRM_AGROTECH_LEAD_ID,
                                CRM_AGROTECH_DEAL_ID,
                                "CRM.DEAL",
                                CRM_AGROTECH_DEAL_ID,
                                now.minus(Duration.ofDays(1)));
                insertCrmTask(
                                CRM_PETCARE_TASK_ID,
                                tenantId,
                                "Review rollout milestones",
                                "Align onboarding dates for reception, medical records and billing flows.",
                                now.plus(Duration.ofDays(1)),
                                "IN_PROGRESS",
                                "MEDIUM",
                                userId,
                                CRM_PETCARE_COMPANY_ID,
                                CRM_ANA_CONTACT_ID,
                                CRM_PETCARE_LEAD_ID,
                                CRM_PETCARE_DEAL_ID,
                                "CRM.DEAL",
                                CRM_PETCARE_DEAL_ID,
                                now.minus(Duration.ofHours(20)));
                insertCrmTask(
                                CRM_DELTA_TASK_ID,
                                tenantId,
                                "Share kickoff checklist",
                                "Send the post-sale checklist to the Delta maintenance manager.",
                                now.minus(Duration.ofDays(1)),
                                "DONE",
                                "LOW",
                                userId,
                                CRM_DELTA_COMPANY_ID,
                                CRM_JULIANA_CONTACT_ID,
                                CRM_DELTA_LEAD_ID,
                                CRM_DELTA_DEAL_ID,
                                "CRM.DEAL",
                                CRM_DELTA_DEAL_ID,
                                now.minus(Duration.ofHours(8)));

                insertCrmNote(
                                CRM_AGROTECH_NOTE_ID,
                                tenantId,
                                "Operations manager requested a proposal that includes temperature, vibration and power dashboards for the compressor line.",
                                CRM_AGROTECH_COMPANY_ID,
                                CRM_CARLOS_CONTACT_ID,
                                CRM_AGROTECH_LEAD_ID,
                                CRM_AGROTECH_DEAL_ID,
                                "CRM.DEAL",
                                CRM_AGROTECH_DEAL_ID,
                                userId,
                                now.minus(Duration.ofHours(6)));
                insertCrmNote(
                                CRM_PETCARE_NOTE_ID,
                                tenantId,
                                "Clinic director wants the PetFlow pilot to start with vaccination, checkup and billing flows already configured.",
                                CRM_PETCARE_COMPANY_ID,
                                CRM_ANA_CONTACT_ID,
                                CRM_PETCARE_LEAD_ID,
                                CRM_PETCARE_DEAL_ID,
                                "CRM.DEAL",
                                CRM_PETCARE_DEAL_ID,
                                userId,
                                now.minus(Duration.ofHours(3)));

                insertAuditLog(tenantId, userId, "CREATE", "crm_contact", CRM_ANA_CONTACT_ID,
                                "{\"company\":\"PetCare Curitiba\"}", now.minus(Duration.ofHours(9)));
                insertAuditLog(tenantId, userId, "CREATE", "crm_lead", CRM_PETCARE_LEAD_ID, "{\"source\":\"REFERRAL\"}",
                                now.minus(Duration.ofHours(8)));
                insertAuditLog(tenantId, userId, "UPDATE", "crm_deal", CRM_PETCARE_DEAL_ID,
                                "{\"stage\":\"NEGOTIATION\"}", now.minus(Duration.ofHours(5)));
                insertAuditLog(tenantId, userId, "CREATE", "crm_task", CRM_AGROTECH_TASK_ID, "{\"priority\":\"HIGH\"}",
                                now.minus(Duration.ofHours(4)));
                insertAuditLog(tenantId, userId, "CREATE", "crm_note", CRM_PETCARE_NOTE_ID,
                                "{\"related\":\"CRM.DEAL\"}", now.minus(Duration.ofHours(2)));
        }

        private void seedPet(UUID tenantId, Instant now) {
                LocalDate currentDate = LocalDate.now(ZoneOffset.UTC);
                Instant recurringBathCompletedAt = currentDate.atTime(9, 0).toInstant(ZoneOffset.UTC);
                Instant oneTimeBathInProgressAt = currentDate.atTime(13, 30).toInstant(ZoneOffset.UTC);
                Instant nextCycleRecurringAt = currentDate.plusMonths(1).withDayOfMonth(3).atTime(10, 30)
                                .toInstant(ZoneOffset.UTC);
                Instant mariaPlanExpiresAt = currentDate.plusDays(12).atTime(12, 0).toInstant(ZoneOffset.UTC);
                Instant mariaInvoiceIssuedAt = currentDate.minusDays(1).atTime(18, 0).toInstant(ZoneOffset.UTC);
                Instant joaoInvoiceIssuedAt = currentDate.minusDays(2).atTime(17, 30).toInstant(ZoneOffset.UTC);

                insertPetClient(
                                PET_MARIA_CLIENT_ID,
                                tenantId,
                                "Maria Oliveira",
                                "Maria Oliveira",
                                "maria@misterdog.demo",
                                "+55 41 99710-1101",
                                "CPF-MARIA-001",
                                "Rua das Araucarias, 120 - Curitiba/PR",
                                "ACTIVE",
                                now.minus(Duration.ofDays(20)));
                insertPetClient(
                                PET_JOAO_CLIENT_ID,
                                tenantId,
                                "Joao Batista",
                                "Joao Batista",
                                "joao@misterdog.demo",
                                "+55 41 99710-2202",
                                "CPF-JOAO-002",
                                "Av. Vicente Machado, 890 - Curitiba/PR",
                                "ACTIVE",
                                now.minus(Duration.ofDays(15)));

                insertPetProfile(PET_REX_ID, tenantId, PET_MARIA_CLIENT_ID, "Rex", "DOG", "Golden Retriever",
                                LocalDate.of(2020, 5, 14), "MALE", new BigDecimal("31.20"), "Golden",
                                "Recurring grooming client with renewal close to the penultimate bath.", now.minus(Duration.ofDays(14)));
                insertPetProfile(PET_LUNA_ID, tenantId, PET_MARIA_CLIENT_ID, "Luna", "DOG", "Shih Tzu",
                                LocalDate.of(2021, 8, 9), "FEMALE", new BigDecimal("5.40"), "Caramel",
                                "Pickup and delivery client for the next monthly cycle.", now.minus(Duration.ofDays(13)));
                insertPetProfile(PET_THOR_ID, tenantId, PET_JOAO_CLIENT_ID, "Thor", "DOG", "German Shepherd",
                                LocalDate.of(2019, 11, 3), "MALE", new BigDecimal("34.80"), "Black and tan",
                                "One-time bath and grooming client with pet taxi extra.", now.minus(Duration.ofDays(12)));

                insertPetService(PET_SERVICE_VACCINATION_ID, tenantId, "Banho e tosa premium",
                                "Full bath and grooming package for recurring customers.", new BigDecimal("95.00"), 120,
                                now.minus(Duration.ofDays(11)));
                insertPetService(PET_SERVICE_CHECKUP_ID, tenantId, "Banho essencial",
                                "Core bath package with reception and checkout ready for retail add-ons.", new BigDecimal("70.00"), 60,
                                now.minus(Duration.ofDays(11)));
                insertPetService(PET_SERVICE_CONSULTATION_ID, tenantId, "Tosa higienica",
                                "Focused grooming finish for between-cycle maintenance.", new BigDecimal("45.00"),
                                45, now.minus(Duration.ofDays(11)));

                insertPetProfessional(PET_PROFESSIONAL_MARINA_ID, tenantId, "Marina Lopes", "Banho e tosa premium",
                                "PR-GRM-11234", "+55 41 98800-1101", "marina@misterdog.demo",
                                new BigDecimal("0.1500"),
                                now.minus(Duration.ofDays(10)));
                insertPetProfessional(PET_PROFESSIONAL_RAFAEL_ID, tenantId, "Rafael Souza", "Acabamento e tosa higienica",
                                "PR-GRM-11888", "+55 41 98800-2202", "rafael@misterdog.demo",
                                new BigDecimal("0.1200"),
                                now.minus(Duration.ofDays(10)));

                insertPetClientPlan(
                                PET_PLAN_MARIA_ID,
                                tenantId,
                                PET_MARIA_CLIENT_ID,
                                "Plano mensal banho e tosa",
                                6,
                                4,
                                mariaPlanExpiresAt,
                                now.minus(Duration.ofDays(7)));

                insertPetAppointment(PET_APPOINTMENT_REX_ID, tenantId, PET_MARIA_CLIENT_ID, PET_REX_ID,
                                PET_SERVICE_VACCINATION_ID, PET_PROFESSIONAL_MARINA_ID, recurringBathCompletedAt,
                                "Banho e tosa premium",
                                "COMPLETED",
                                "Recurring appointment completed. Pet ready and pickup message already covered by client email.",
                                new BigDecimal("95.00"),
                                new BigDecimal("14.25"),
                                PET_PLAN_MARIA_ID,
                                true,
                                null,
                                null,
                                now.minus(Duration.ofHours(8)));
                insertPetAppointment(PET_APPOINTMENT_THOR_ID, tenantId, PET_JOAO_CLIENT_ID, PET_THOR_ID,
                                PET_SERVICE_CHECKUP_ID, PET_PROFESSIONAL_RAFAEL_ID, oneTimeBathInProgressAt,
                                "Banho essencial",
                                "IN_PROGRESS",
                                "One-time visit with pet taxi return already approved at checkout.",
                                new BigDecimal("70.00"),
                                new BigDecimal("8.40"),
                                null,
                                false,
                                new BigDecimal("18.00"),
                                "Pet taxi ida e volta",
                                now.minus(Duration.ofHours(2)));
                insertPetAppointment(PET_APPOINTMENT_LUNA_ID, tenantId, PET_MARIA_CLIENT_ID, PET_LUNA_ID,
                                PET_SERVICE_VACCINATION_ID, PET_PROFESSIONAL_MARINA_ID, nextCycleRecurringAt,
                                "Banho e tosa premium",
                                "SCHEDULED",
                                "Next cycle already reserved with pickup service on the way in.",
                                new BigDecimal("95.00"),
                                new BigDecimal("14.25"),
                                PET_PLAN_MARIA_ID,
                                false,
                                new BigDecimal("9.00"),
                                "Pet taxi ida",
                                now.minus(Duration.ofHours(1)));

                insertPetMedicalRecord(
                                PET_RECORD_REX_ID,
                                tenantId,
                                PET_REX_ID,
                                PET_PROFESSIONAL_MARINA_ID,
                                PET_APPOINTMENT_REX_ID,
                                "Bath and grooming finished with coat hydration and routine owner guidance.",
                                "Recurring package delivery completed successfully.",
                                "Hold the renewal conversation at the penultimate bath and keep pickup messaging active.",
                                now.minus(Duration.ofHours(7)));
                insertPetMedicalRecord(
                                PET_RECORD_THOR_ID,
                                tenantId,
                                PET_THOR_ID,
                                PET_PROFESSIONAL_RAFAEL_ID,
                                PET_APPOINTMENT_THOR_ID,
                                "One-time grooming visit in progress with pet taxi already tied to checkout.",
                                "Commercial demo flow active for standalone customer.",
                                "Keep the responsible professional, pet taxi extra, and charge visibility explicit at the end of the visit.",
                                now.minus(Duration.ofHours(5)));

                insertPetVaccination(PET_VACCINATION_REX_ID, tenantId, PET_REX_ID, PET_APPOINTMENT_REX_ID,
                                "Operational reminder",
                                recurringBathCompletedAt, currentDate.plusMonths(1).atTime(8, 0).toInstant(ZoneOffset.UTC),
                                "Internal follow-up reminder preserved for timeline completeness.", now.minus(Duration.ofHours(7)));
                insertPetVaccination(PET_VACCINATION_LUNA_ID, tenantId, PET_LUNA_ID, PET_APPOINTMENT_LUNA_ID,
                                "Next cycle reminder",
                                nextCycleRecurringAt, nextCycleRecurringAt.plus(Duration.ofDays(30)),
                                "Next recurring cycle already visible in the commercial demo queue.",
                                now.minus(Duration.ofHours(1)));

                insertPetProduct(PET_PRODUCT_RABIES_ID, tenantId, "Shampoo hipoalergenico", "PET-SHAM-001",
                                new BigDecimal("48.00"), 1, 2, 5, now.minus(Duration.ofDays(6)));
                insertPetProduct(PET_PRODUCT_SUPPLEMENT_ID, tenantId, "Mascara hidratante", "PET-HYDR-014",
                                new BigDecimal("36.00"), 6, 2, 4, now.minus(Duration.ofDays(6)));
                insertPetProduct(PET_PRODUCT_PARASITE_ID, tenantId, "Lacos sortidos", "PET-ACC-020",
                                new BigDecimal("18.00"), 2, 1, 3, now.minus(Duration.ofDays(6)));

                insertPetInventoryMovement(PET_INVENTORY_RABIES_ID, tenantId, PET_PRODUCT_RABIES_ID, "OUTBOUND", 2,
                                "Busy grooming days consumed more shampoo than expected before the next purchase window.",
                                now.minus(Duration.ofHours(12)));
                insertPetInventoryMovement(PET_INVENTORY_SUPPLEMENT_ID, tenantId, PET_PRODUCT_SUPPLEMENT_ID, "INBOUND",
                                4, "Partial replenishment received for the hydration line before the weekend rush.",
                                now.minus(Duration.ofDays(2)));
                insertPetInventoryMovement(PET_INVENTORY_PARASITE_ID, tenantId, PET_PRODUCT_PARASITE_ID, "OUTBOUND", 3,
                                "Accessory stock reserved for premium pickups and retail upsell.", now.minus(Duration.ofHours(18)));

                insertPetInvoice(
                                PET_INVOICE_MARIA_ID,
                                tenantId,
                                PET_MARIA_CLIENT_ID,
                                new BigDecimal("95.00"),
                                "PAID",
                                mariaInvoiceIssuedAt,
                                now.minus(Duration.ofDays(1)),
                                "Recurring package service settled during the last completed shift.",
                                "PET.APPOINTMENT",
                                PET_APPOINTMENT_REX_ID);
                insertFinancePayment(
                                PET_PAYMENT_MARIA_ID,
                                tenantId,
                                PET_INVOICE_MARIA_ID,
                                new BigDecimal("95.00"),
                                "PIX",
                                mariaInvoiceIssuedAt.plus(Duration.ofHours(2)),
                                "PIX-PETFLOW-MARIA",
                                "Customer settled the recurring grooming charge after pickup confirmation.",
                                now.minus(Duration.ofDays(1)));
                insertFinanceCashMovement(
                                PET_CASH_MARIA_ID,
                                tenantId,
                                PET_INVOICE_MARIA_ID,
                                PET_PAYMENT_MARIA_ID,
                                "IN",
                                "INVOICE_PAYMENT",
                                new BigDecimal("95.00"),
                                mariaInvoiceIssuedAt.plus(Duration.ofHours(2)),
                                "Cash entry generated from the paid recurring grooming invoice.",
                                now.minus(Duration.ofDays(1)));

                insertPetInvoice(
                                PET_INVOICE_JOAO_ID,
                                tenantId,
                                PET_JOAO_CLIENT_ID,
                                new BigDecimal("88.00"),
                                "ISSUED",
                                joaoInvoiceIssuedAt,
                                now.minus(Duration.ofDays(2)),
                                "One-time grooming visit still open with pet taxi extra pending collection.",
                                "PET.APPOINTMENT",
                                PET_APPOINTMENT_THOR_ID);
        }

        private void seedIot(UUID tenantId, UUID userId, Instant now) {
                Instant recent = now.minus(Duration.ofMinutes(3));
                Instant alertWindow = now.minus(Duration.ofMinutes(18));
                Instant acknowledgedWindow = now.minus(Duration.ofMinutes(42));
                Instant stale = now.minus(Duration.ofHours(5));

                insertIotDevice(
                                IOT_COMPRESSOR_DEVICE_ID,
                                tenantId,
                                "compressor-line-01",
                                "CMP-01-SN",
                                "compressor-line-01",
                                "ACTUATOR",
                                "Utility bay",
                                "Compressed-air line monitored for temperature, vibration and power draw.",
                                "MODBUS_TCP",
                                "10.20.0.21",
                                502,
                                1,
                                "5s",
                                "gw-demo-01",
                                "ONLINE",
                                recent,
                                now.minus(Duration.ofDays(7)));
                insertIotDevice(
                                IOT_OVEN_DEVICE_ID,
                                tenantId,
                                "industrial-oven-02",
                                "OVN-02-SN",
                                "industrial-oven-02",
                                "SENSOR",
                                "Heat treatment line",
                                "Industrial oven monitored for temperature stability and mechanical vibration.",
                                "MODBUS_TCP",
                                "10.20.0.22",
                                502,
                                2,
                                "10s",
                                "gw-demo-01",
                                "ALERT",
                                now.minus(Duration.ofMinutes(2)),
                                now.minus(Duration.ofDays(7)));
                insertIotDevice(
                                IOT_PANEL_DEVICE_ID,
                                tenantId,
                                "electrical-panel-03",
                                "PNL-03-SN",
                                "electrical-panel-03",
                                "GATEWAY",
                                "Main electrical room",
                                "Electrical distribution panel with telemetry for load and cabinet conditions.",
                                "MODBUS_TCP",
                                "10.20.0.30",
                                502,
                                3,
                                "15s",
                                "gw-demo-02",
                                "OFFLINE",
                                stale,
                                now.minus(Duration.ofDays(7)));

                insertIotRegister(IOT_COMPRESSOR_TEMPERATURE_ID, tenantId, IOT_COMPRESSOR_DEVICE_ID,
                                "Compressor temperature", "CMP_TEMP", "FC03", 40001, "temperature", "C", "DECIMAL",
                                new BigDecimal("35.0000"), new BigDecimal("85.0000"), "ACTIVE",
                                now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_COMPRESSOR_VIBRATION_ID, tenantId, IOT_COMPRESSOR_DEVICE_ID,
                                "Compressor vibration", "CMP_VIB", "FC03", 40002, "vibration", "mm/s", "DECIMAL",
                                new BigDecimal("0.5000"), new BigDecimal("4.5000"), "ACTIVE",
                                now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_COMPRESSOR_POWER_ID, tenantId, IOT_COMPRESSOR_DEVICE_ID,
                                "Compressor power consumption", "CMP_PWR", "FC03", 40003, "power_consumption", "kW",
                                "DECIMAL", new BigDecimal("20.0000"), new BigDecimal("95.0000"), "ACTIVE",
                                now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_OVEN_TEMPERATURE_ID, tenantId, IOT_OVEN_DEVICE_ID, "Oven temperature", "OVN_TEMP",
                                "FC03", 40101, "temperature", "C", "DECIMAL", new BigDecimal("120.0000"),
                                new BigDecimal("260.0000"), "ACTIVE", now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_OVEN_VIBRATION_ID, tenantId, IOT_OVEN_DEVICE_ID, "Oven vibration", "OVN_VIB",
                                "FC03", 40102, "vibration", "mm/s", "DECIMAL", new BigDecimal("0.3000"),
                                new BigDecimal("3.2000"), "ACTIVE", now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_OVEN_POWER_ID, tenantId, IOT_OVEN_DEVICE_ID, "Oven power consumption", "OVN_PWR",
                                "FC03", 40103, "power_consumption", "kW", "DECIMAL", new BigDecimal("40.0000"),
                                new BigDecimal("180.0000"), "ACTIVE", now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_PANEL_TEMPERATURE_ID, tenantId, IOT_PANEL_DEVICE_ID, "Panel temperature",
                                "PNL_TEMP", "FC04", 30011, "temperature", "C", "DECIMAL", new BigDecimal("18.0000"),
                                new BigDecimal("55.0000"), "ACTIVE", now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_PANEL_VIBRATION_ID, tenantId, IOT_PANEL_DEVICE_ID, "Panel vibration", "PNL_VIB",
                                "FC04", 30012, "vibration", "mm/s", "DECIMAL", new BigDecimal("0.0000"),
                                new BigDecimal("1.5000"), "ACTIVE", now.minus(Duration.ofDays(7)));
                insertIotRegister(IOT_PANEL_POWER_ID, tenantId, IOT_PANEL_DEVICE_ID, "Panel power consumption",
                                "PNL_PWR", "FC04", 30013, "power_consumption", "kW", "DECIMAL",
                                new BigDecimal("10.0000"), new BigDecimal("220.0000"), "ACTIVE",
                                now.minus(Duration.ofDays(7)));

                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_TEMPERATURE_ID, "temperature",
                                new BigDecimal("67.4000"), "C",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(26)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_VIBRATION_ID, "vibration",
                                new BigDecimal("2.8000"), "mm/s",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(22)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_POWER_ID, "power_consumption",
                                new BigDecimal("64.2000"), "kW",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(21)));
                insertTelemetryPoint(tenantId, IOT_OVEN_DEVICE_ID, IOT_OVEN_TEMPERATURE_ID, "temperature",
                                new BigDecimal("244.6000"), "C",
                                "{\"source\":\"demo-seed\",\"asset\":\"industrial-oven-02\"}",
                                now.minus(Duration.ofMinutes(19)));
                insertTelemetryPoint(tenantId, IOT_OVEN_DEVICE_ID, IOT_OVEN_VIBRATION_ID, "vibration",
                                new BigDecimal("2.1000"), "mm/s",
                                "{\"source\":\"demo-seed\",\"asset\":\"industrial-oven-02\"}",
                                now.minus(Duration.ofMinutes(18)));
                insertTelemetryPoint(tenantId, IOT_OVEN_DEVICE_ID, IOT_OVEN_POWER_ID, "power_consumption",
                                new BigDecimal("171.3000"), "kW",
                                "{\"source\":\"demo-seed\",\"asset\":\"industrial-oven-02\"}",
                                now.minus(Duration.ofMinutes(17)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_TEMPERATURE_ID, "temperature",
                                new BigDecimal("70.1000"), "C",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(11)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_VIBRATION_ID, "vibration",
                                new BigDecimal("3.6000"), "mm/s",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(9)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_POWER_ID, "power_consumption",
                                new BigDecimal("69.8000"), "kW",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(8)));
                insertTelemetryPoint(tenantId, IOT_OVEN_DEVICE_ID, IOT_OVEN_TEMPERATURE_ID, "temperature",
                                new BigDecimal("268.9000"), "C",
                                "{\"source\":\"demo-seed\",\"asset\":\"industrial-oven-02\"}",
                                now.minus(Duration.ofMinutes(6)));
                insertTelemetryPoint(tenantId, IOT_OVEN_DEVICE_ID, IOT_OVEN_VIBRATION_ID, "vibration",
                                new BigDecimal("2.4000"), "mm/s",
                                "{\"source\":\"demo-seed\",\"asset\":\"industrial-oven-02\"}",
                                now.minus(Duration.ofMinutes(5)));
                insertTelemetryPoint(tenantId, IOT_OVEN_DEVICE_ID, IOT_OVEN_POWER_ID, "power_consumption",
                                new BigDecimal("176.1000"), "kW",
                                "{\"source\":\"demo-seed\",\"asset\":\"industrial-oven-02\"}",
                                now.minus(Duration.ofMinutes(4)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_TEMPERATURE_ID, "temperature",
                                new BigDecimal("68.2000"), "C",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(3)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_VIBRATION_ID, "vibration",
                                new BigDecimal("3.9000"), "mm/s",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(2)));
                insertTelemetryPoint(tenantId, IOT_COMPRESSOR_DEVICE_ID, IOT_COMPRESSOR_POWER_ID, "power_consumption",
                                new BigDecimal("70.4000"), "kW",
                                "{\"source\":\"demo-seed\",\"asset\":\"compressor-line-01\"}",
                                now.minus(Duration.ofMinutes(1)));
                insertTelemetryPoint(tenantId, IOT_PANEL_DEVICE_ID, IOT_PANEL_TEMPERATURE_ID, "temperature",
                                new BigDecimal("32.5000"), "C",
                                "{\"source\":\"demo-seed\",\"asset\":\"electrical-panel-03\"}",
                                now.minus(Duration.ofHours(6)));
                insertTelemetryPoint(tenantId, IOT_PANEL_DEVICE_ID, IOT_PANEL_POWER_ID, "power_consumption",
                                new BigDecimal("118.0000"), "kW",
                                "{\"source\":\"demo-seed\",\"asset\":\"electrical-panel-03\"}",
                                now.minus(Duration.ofHours(6)).plus(Duration.ofMinutes(4)));

                insertIotAlarm(
                                IOT_TEMPERATURE_ALARM_ID,
                                tenantId,
                                IOT_OVEN_DEVICE_ID,
                                IOT_OVEN_TEMPERATURE_ID,
                                "temperature-high",
                                "HIGH",
                                "Industrial oven temperature exceeded the safe operating envelope.",
                                "OPEN",
                                alertWindow,
                                null,
                                null);
                insertIotAlarm(
                                IOT_VIBRATION_ALARM_ID,
                                tenantId,
                                IOT_COMPRESSOR_DEVICE_ID,
                                IOT_COMPRESSOR_VIBRATION_ID,
                                "vibration-anomaly",
                                "MEDIUM",
                                "Compressor vibration drifted above the normal baseline during the current shift.",
                                "ACKNOWLEDGED",
                                acknowledgedWindow,
                                acknowledgedWindow.plus(Duration.ofMinutes(7)),
                                userId);

                insertIotMaintenance(
                                IOT_OVEN_MAINTENANCE_ID,
                                tenantId,
                                IOT_OVEN_DEVICE_ID,
                                IOT_TEMPERATURE_ALARM_ID,
                                IOT_OVEN_TEMPERATURE_ID,
                                "Review oven cooling loop",
                                "Investigate the temperature excursion and validate the exhaust and cooling controls before the next batch.",
                                "PENDING",
                                "HIGH",
                                "ALARM",
                                "Temperature high alarm triggered on industrial-oven-02.",
                                now.plus(Duration.ofMinutes(90)),
                                null,
                                userId,
                                "Field Engineering Team",
                                now.minus(Duration.ofMinutes(12)));
                insertIotMaintenance(
                                IOT_PANEL_MAINTENANCE_ID,
                                tenantId,
                                IOT_PANEL_DEVICE_ID,
                                null,
                                IOT_PANEL_POWER_ID,
                                "Restore panel heartbeat",
                                "Confirm communication path to the electrical panel and recover the telemetry agent.",
                                "SCHEDULED",
                                "MEDIUM",
                                "OPERATIONS",
                                "No heartbeat received from electrical-panel-03 for more than four hours.",
                                now.plus(Duration.ofHours(4)),
                                null,
                                null,
                                "Remote Support",
                                now.minus(Duration.ofMinutes(50)));
        }

        private void insertCrmCompany(
                        UUID id,
                        UUID tenantId,
                        String name,
                        String legalName,
                        String document,
                        String email,
                        String phone,
                        String website,
                        String industry,
                        String status,
                        UUID ownerUserId,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_companies (
                                                    id, tenant_id, name, legal_name, document, email, phone, website, industry, status, owner_user_id,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, legalName, document, email, phone, website, industry, status,
                                ownerUserId,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmContact(
                        UUID id,
                        UUID tenantId,
                        String firstName,
                        String lastName,
                        String email,
                        String phone,
                        String company,
                        UUID companyId,
                        String status,
                        UUID ownerUserId,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_contacts (
                                                    id, tenant_id, first_name, last_name, email, phone, company, company_id, status, owner_user_id,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, firstName, lastName, email, phone, company, companyId, status,
                                ownerUserId,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmLead(
                        UUID id,
                        UUID tenantId,
                        String name,
                        String email,
                        String phone,
                        String source,
                        String status,
                        UUID assignedUserId,
                        UUID companyId,
                        UUID contactId,
                        String notes,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_leads (
                                                    id, tenant_id, name, email, phone, source, status, assigned_user_id, company_id, contact_id, notes,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, email, phone, source, status, assignedUserId, companyId, contactId,
                                notes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmPipeline(UUID tenantId, UUID id, String name, boolean isDefault, Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_pipelines (
                                                    id, tenant_id, name, is_default, created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, isDefault, ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmPipelineStage(
                        UUID tenantId,
                        UUID id,
                        UUID pipelineId,
                        String name,
                        String code,
                        int position,
                        String color,
                        boolean isDefault,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_pipeline_stages (
                                                    id, tenant_id, pipeline_id, name, code, position, color, is_default,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, pipelineId, name, code, position, color, isDefault,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmDeal(
                        UUID id,
                        UUID tenantId,
                        String title,
                        String description,
                        BigDecimal amount,
                        String currency,
                        String status,
                        UUID pipelineId,
                        UUID pipelineStageId,
                        UUID companyId,
                        UUID contactId,
                        UUID leadId,
                        UUID ownerUserId,
                        LocalDate expectedCloseDate,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_deals (
                                                    id, tenant_id, title, description, amount, currency, status, pipeline_id, pipeline_stage_id,
                                                    company_id, contact_id, lead_id, owner_user_id, expected_close_date,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, title, description, amount, currency, status, pipelineId, pipelineStageId,
                                companyId, contactId, leadId, ownerUserId, expectedCloseDate,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmTask(
                        UUID id,
                        UUID tenantId,
                        String title,
                        String description,
                        Instant dueDate,
                        String status,
                        String priority,
                        UUID assignedUserId,
                        UUID companyId,
                        UUID contactId,
                        UUID leadId,
                        UUID dealId,
                        String relatedType,
                        UUID relatedId,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_tasks (
                                                    id, tenant_id, title, description, due_date, status, priority, assigned_user_id,
                                                    company_id, contact_id, lead_id, deal_id, related_type, related_id,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, title, description, ts(dueDate), status, priority, assignedUserId,
                                companyId, contactId, leadId, dealId, relatedType, relatedId,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertCrmNote(
                        UUID id,
                        UUID tenantId,
                        String content,
                        UUID companyId,
                        UUID contactId,
                        UUID leadId,
                        UUID dealId,
                        String relatedType,
                        UUID relatedId,
                        UUID authorUserId,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO crm_notes (
                                                    id, tenant_id, content, company_id, contact_id, lead_id, deal_id, related_type, related_id, author_user_id,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, content, companyId, contactId, leadId, dealId, relatedType, relatedId,
                                authorUserId,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetClient(
                        UUID id,
                        UUID tenantId,
                        String fullName,
                        String name,
                        String email,
                        String phone,
                        String document,
                        String address,
                        String status,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_clients (
                                                    id, tenant_id, full_name, name, email, phone, document, address, status,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, fullName, name, email, phone, document, address, status,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetProfile(
                        UUID id,
                        UUID tenantId,
                        UUID clientId,
                        String name,
                        String species,
                        String breed,
                        LocalDate birthDate,
                        String gender,
                        BigDecimal weight,
                        String color,
                        String notes,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_profiles (
                                                    id, tenant_id, client_id, name, species, breed, birth_date, gender, weight, color, notes,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, clientId, name, species, breed, birthDate, gender, weight, color, notes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetService(
                        UUID id,
                        UUID tenantId,
                        String name,
                        String description,
                        BigDecimal price,
                        int durationMinutes,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_services (
                                                    id, tenant_id, name, description, price, duration_minutes,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, description, price, durationMinutes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetProfessional(
                        UUID id,
                        UUID tenantId,
                        String name,
                        String specialty,
                        String licenseNumber,
                        String phone,
                        String email,
                        BigDecimal commissionRate,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_professionals (
                                                    id, tenant_id, name, specialty, license_number, phone, email, commission_rate,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, specialty, licenseNumber, phone, email, commissionRate,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetClientPlan(
                        UUID id,
                        UUID tenantId,
                        UUID clientId,
                        String planName,
                        int totalSessions,
                        int usedSessions,
                        Instant expiresAt,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_client_plans (
                                                    id, tenant_id, client_id, plan_name, total_sessions, used_sessions, expires_at,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, clientId, planName, totalSessions, usedSessions, ts(expiresAt),
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetAppointment(
                        UUID id,
                        UUID tenantId,
                        UUID clientId,
                        UUID petId,
                        UUID serviceId,
                        UUID professionalId,
                        Instant scheduledAt,
                        String serviceName,
                        String status,
                        String notes,
                        BigDecimal servicePrice,
                        BigDecimal commissionAmount,
                        UUID clientPlanId,
                        boolean planSessionConsumed,
                        BigDecimal extrasAmount,
                        String extrasDescription,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_appointments (
                                                    id, tenant_id, client_id, pet_id, service_id, professional_id, scheduled_at, service_name, status, notes,
                                                    service_price, commission_amount, client_plan_id, plan_session_consumed, extras_amount, extras_description,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, clientId, petId, serviceId, professionalId, ts(scheduledAt), serviceName,
                                status, notes, servicePrice, commissionAmount, clientPlanId, planSessionConsumed,
                                extrasAmount, extrasDescription,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetMedicalRecord(
                        UUID id,
                        UUID tenantId,
                        UUID petId,
                        UUID professionalId,
                        UUID appointmentId,
                        String description,
                        String diagnosis,
                        String treatment,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_medical_records (
                                                    id, tenant_id, pet_id, professional_id, appointment_id, description, diagnosis, treatment,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, petId, professionalId, appointmentId, description, diagnosis, treatment,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetVaccination(
                        UUID id,
                        UUID tenantId,
                        UUID petId,
                        UUID appointmentId,
                        String vaccineName,
                        Instant appliedAt,
                        Instant nextDueAt,
                        String notes,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO pet_vaccinations (
                                                    id, tenant_id, pet_id, appointment_id, vaccine_name, applied_at, next_due_at, notes,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, petId, appointmentId, vaccineName, ts(appliedAt), ts(nextDueAt), notes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetProduct(
                        UUID id,
                        UUID tenantId,
                        String name,
                        String sku,
                        BigDecimal price,
                        int stockQuantity,
                        int minimumQuantity,
                        int reorderPoint,
                        Instant createdAt) {
                UUID inventoryItemId = UUID.randomUUID();
                insert(
                                """
                                                INSERT INTO inventory_items (
                                                    id, tenant_id, name, sku, category, unit_of_measure, current_quantity,
                                                    minimum_quantity, reorder_point, created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                inventoryItemId, tenantId, name, sku, "PET_RETAIL_GOOD", "UNIT", stockQuantity,
                                minimumQuantity, reorderPoint, ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
                insert(
                                """
                                                INSERT INTO pet_products (
                                                    id, tenant_id, name, sku, price, stock_quantity, inventory_item_id,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, sku, price, stockQuantity, inventoryItemId,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetInventoryMovement(
                        UUID id,
                        UUID tenantId,
                        UUID productId,
                        String movementType,
                        int quantity,
                        String notes,
                        Instant createdAt) {
                UUID inventoryItemId = jdbcTemplate.queryForObject(
                                "SELECT inventory_item_id FROM pet_products WHERE id = ?",
                                UUID.class,
                                productId);
                Integer currentQuantity = jdbcTemplate.queryForObject(
                                "SELECT current_quantity FROM inventory_items WHERE id = ?",
                                Integer.class,
                                inventoryItemId);
                boolean outbound = movementType != null && movementType.toUpperCase().startsWith("OUT");
                String normalizedMovementType = outbound ? "OUT" : "IN";
                int quantityBefore = outbound ? currentQuantity + quantity : currentQuantity - quantity;
                int quantityAfter = currentQuantity;

                insert(
                                """
                                                INSERT INTO pet_inventory_movements (
                                                    id, tenant_id, product_id, movement_type, quantity, notes,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, productId, movementType, quantity, notes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
                insert(
                                """
                                                INSERT INTO inventory_movements (
                                                    id, tenant_id, inventory_item_id, movement_type, quantity, quantity_before, quantity_after,
                                                    source_type, source_reference_id, reason, created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, inventoryItemId, normalizedMovementType, quantity, quantityBefore,
                                quantityAfter, "MANUAL", productId, notes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertPetInvoice(
                        UUID id,
                        UUID tenantId,
                        UUID clientId,
                        BigDecimal totalAmount,
                        String status,
                        Instant issuedAt,
                        Instant createdAt,
                        String description,
                        String businessContextType,
                        UUID businessContextId) {
                BigDecimal paidAmount = "PAID".equalsIgnoreCase(status) ? totalAmount : BigDecimal.ZERO;
                Instant paidAt = "PAID".equalsIgnoreCase(status) ? issuedAt.plus(Duration.ofHours(2)) : null;

                insert(
                                """
                                                INSERT INTO finance_invoices (
                                                    id, tenant_id, source_module, counterparty_reference_type, counterparty_reference_id, counterparty_name,
                                                    business_context_type, business_context_id, business_context_label, description,
                                                    status, currency, total_amount, paid_amount, issued_at, due_at, paid_at, canceled_at,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, 'PET', 'PET.CLIENT', ?, ?, ?, ?, ?, ?, ?, 'BRL', ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
                                                """,
                                id, tenantId, clientId, resolvePetClientName(clientId), businessContextType, businessContextId,
                                businessContextType == null ? null : description, description, status,
                                totalAmount, paidAmount, ts(issuedAt), ts(issuedAt.plus(Duration.ofDays(7))), ts(paidAt),
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
                insert(
                                """
                                                INSERT INTO pet_invoices (
                                                    id, tenant_id, client_id, finance_invoice_id,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, clientId, id,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertFinancePayment(
                        UUID id,
                        UUID tenantId,
                        UUID invoiceId,
                        BigDecimal amount,
                        String method,
                        Instant receivedAt,
                        String referenceCode,
                        String notes,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO finance_payments (
                                                    id, tenant_id, invoice_id, status, method, amount, received_at, reference_code, notes,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, 'CONFIRMED', ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, invoiceId, method, amount, ts(receivedAt), referenceCode, notes,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertFinanceCashMovement(
                        UUID id,
                        UUID tenantId,
                        UUID invoiceId,
                        UUID paymentId,
                        String direction,
                        String category,
                        BigDecimal amount,
                        Instant occurredAt,
                        String description,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO finance_cash_movements (
                                                    id, tenant_id, invoice_id, payment_id, direction, category, amount, currency, occurred_at, description,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'BRL', ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, invoiceId, paymentId, direction, category, amount, ts(occurredAt), description,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private String resolvePetClientName(UUID clientId) {
                if (PET_MARIA_CLIENT_ID.equals(clientId)) {
                        return "Maria Oliveira";
                }
                if (PET_JOAO_CLIENT_ID.equals(clientId)) {
                        return "Joao Batista";
                }
                return "Pet client";
        }

        private void insertIotDevice(
                        UUID id,
                        UUID tenantId,
                        String name,
                        String serialNumber,
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
                        String status,
                        Instant lastSeenAt,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO iot_devices (
                                                    id, tenant_id, name, identifier, serial_number, type, location, description, transport, host, port,
                                                    unit_id, polling_profile, gateway, status, last_seen_at,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, name, identifier, serialNumber, type, location, description, transport,
                                host, port,
                                unitId, pollingProfile, gateway, status, ts(lastSeenAt),
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertIotRegister(
                        UUID id,
                        UUID tenantId,
                        UUID deviceId,
                        String name,
                        String code,
                        String functionCode,
                        int registerAddress,
                        String metricName,
                        String unit,
                        String dataType,
                        BigDecimal minThreshold,
                        BigDecimal maxThreshold,
                        String status,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO iot_registers (
                                                    id, tenant_id, device_id, name, code, function_code, register_address, metric_name, unit, data_type,
                                                    min_threshold, max_threshold, status, created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, deviceId, name, code, functionCode, registerAddress, metricName, unit,
                                dataType,
                                minThreshold, maxThreshold, status, ts(createdAt), ts(createdAt), SEED_ACTOR,
                                SEED_ACTOR);
        }

        private void insertTelemetryPoint(
                        UUID tenantId,
                        UUID deviceId,
                        UUID registerId,
                        String metricName,
                        BigDecimal metricValue,
                        String unit,
                        String metadata,
                        Instant recordedAt) {
                insert(
                                """
                                                INSERT INTO iot_telemetry_records (
                                                    id, tenant_id, device_id, register_id, metric_name, metric_value, unit, metadata, recorded_at,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                UUID.randomUUID(), tenantId, deviceId, registerId, metricName, metricValue, unit,
                                metadata, ts(recordedAt),
                                ts(recordedAt), ts(recordedAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertIotAlarm(
                        UUID id,
                        UUID tenantId,
                        UUID deviceId,
                        UUID registerId,
                        String code,
                        String severity,
                        String message,
                        String status,
                        Instant triggeredAt,
                        Instant acknowledgedAt,
                        UUID acknowledgedBy) {
                insert(
                                """
                                                INSERT INTO iot_alarms (
                                                    id, tenant_id, device_id, register_id, code, severity, message, status, triggered_at, acknowledged_at, acknowledged_by,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, deviceId, registerId, code, severity, message, status, ts(triggeredAt),
                                ts(acknowledgedAt), acknowledgedBy,
                                ts(triggeredAt), ts(triggeredAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertIotMaintenance(
                        UUID id,
                        UUID tenantId,
                        UUID deviceId,
                        UUID linkedAlarmId,
                        UUID linkedRegisterId,
                        String title,
                        String description,
                        String status,
                        String priority,
                        String origin,
                        String trigger,
                        Instant scheduledAt,
                        Instant completedAt,
                        UUID assignedUserId,
                        String assignedUserLabel,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO iot_maintenance (
                                                    id, tenant_id, device_id, linked_alarm_id, linked_register_id, title, description, status, priority, origin,
                                                    trigger_message, scheduled_at, completed_at, assigned_user_id, assigned_user_label,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                id, tenantId, deviceId, linkedAlarmId, linkedRegisterId, title, description, status,
                                priority, origin,
                                trigger, ts(scheduledAt), ts(completedAt), assignedUserId, assignedUserLabel,
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insertAuditLog(
                        UUID tenantId,
                        UUID userId,
                        String action,
                        String entityName,
                        UUID entityId,
                        String payload,
                        Instant createdAt) {
                insert(
                                """
                                                INSERT INTO audit_logs (
                                                    id, tenant_id, user_id, action, entity_name, entity_id, payload, ip_address,
                                                    created_at, updated_at, created_by, updated_by
                                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                """,
                                UUID.randomUUID(), tenantId, userId, action, entityName, entityId.toString(), payload,
                                "127.0.0.1",
                                ts(createdAt), ts(createdAt), SEED_ACTOR, SEED_ACTOR);
        }

        private void insert(String sql, Object... args) {
                jdbcTemplate.update(sql, args);
        }

        private Timestamp ts(Instant value) {
                return value == null ? null : Timestamp.from(value);
        }

        private static UUID uuid(String value) {
                return UUID.fromString(value);
        }

        public record DemoCommercialSeedSummary(
                        String tenantCode,
                        String userEmail,
                        int crmRecords,
                        int petRecords,
                        int iotRecords) {
        }
}
