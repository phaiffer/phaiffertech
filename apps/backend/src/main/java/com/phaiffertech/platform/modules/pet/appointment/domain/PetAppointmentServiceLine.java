package com.phaiffertech.platform.modules.pet.appointment.domain;

import com.phaiffertech.platform.modules.pet.servicecatalog.domain.PetServiceCategory;
import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "pet_appointment_services")
public class PetAppointmentServiceLine extends BaseTenantEntity {

    @Column(name = "appointment_id", nullable = false)
    private UUID appointmentId;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "line_order", nullable = false)
    private int lineOrder;

    @Column(name = "service_name", nullable = false, length = 120)
    private String serviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_category", length = 30)
    private PetServiceCategory serviceCategory;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "service_price", precision = 10, scale = 2)
    private BigDecimal servicePrice;

    @Column(name = "professional_id")
    private UUID professionalId;

    @Column(name = "professional_name", length = 150)
    private String professionalName;

    @Column(name = "commission_eligible")
    private Boolean commissionEligible;

    @Column(name = "commission_rate", precision = 5, scale = 4)
    private BigDecimal commissionRate;

    @Column(name = "commission_amount", precision = 10, scale = 2)
    private BigDecimal commissionAmount;

    public UUID getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(UUID appointmentId) {
        this.appointmentId = appointmentId;
    }

    public UUID getServiceId() {
        return serviceId;
    }

    public void setServiceId(UUID serviceId) {
        this.serviceId = serviceId;
    }

    public int getLineOrder() {
        return lineOrder;
    }

    public void setLineOrder(int lineOrder) {
        this.lineOrder = lineOrder;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public PetServiceCategory getServiceCategory() {
        return serviceCategory;
    }

    public void setServiceCategory(PetServiceCategory serviceCategory) {
        this.serviceCategory = serviceCategory;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public BigDecimal getServicePrice() {
        return servicePrice;
    }

    public void setServicePrice(BigDecimal servicePrice) {
        this.servicePrice = servicePrice;
    }

    public UUID getProfessionalId() {
        return professionalId;
    }

    public void setProfessionalId(UUID professionalId) {
        this.professionalId = professionalId;
    }

    public String getProfessionalName() {
        return professionalName;
    }

    public void setProfessionalName(String professionalName) {
        this.professionalName = professionalName;
    }

    public Boolean getCommissionEligible() {
        return commissionEligible;
    }

    public void setCommissionEligible(Boolean commissionEligible) {
        this.commissionEligible = commissionEligible;
    }

    public BigDecimal getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(BigDecimal commissionRate) {
        this.commissionRate = commissionRate;
    }

    public BigDecimal getCommissionAmount() {
        return commissionAmount;
    }

    public void setCommissionAmount(BigDecimal commissionAmount) {
        this.commissionAmount = commissionAmount;
    }
}
