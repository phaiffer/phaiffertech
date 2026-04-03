package com.phaiffertech.platform.modules.pet.servicecatalog.domain;

import com.phaiffertech.platform.shared.domain.base.BaseTenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

@Entity
@Table(name = "pet_services")
@SQLDelete(sql = "UPDATE pet_services SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
public class PetServiceCatalog extends BaseTenantEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private PetServiceCategory category = PetServiceCategory.GROOMING;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes = 60;

    @Column(name = "commission_eligible", nullable = false)
    private boolean commissionEligible = true;

    @Column(name = "allow_in_plans", nullable = false)
    private boolean allowInPlans = true;

    @Column(name = "allow_standalone_booking", nullable = false)
    private boolean allowStandaloneBooking = true;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public PetServiceCategory getCategory() {
        return category;
    }

    public void setCategory(PetServiceCategory category) {
        this.category = category;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public boolean isCommissionEligible() {
        return commissionEligible;
    }

    public void setCommissionEligible(boolean commissionEligible) {
        this.commissionEligible = commissionEligible;
    }

    public boolean isAllowInPlans() {
        return allowInPlans;
    }

    public void setAllowInPlans(boolean allowInPlans) {
        this.allowInPlans = allowInPlans;
    }

    public boolean isAllowStandaloneBooking() {
        return allowStandaloneBooking;
    }

    public void setAllowStandaloneBooking(boolean allowStandaloneBooking) {
        this.allowStandaloneBooking = allowStandaloneBooking;
    }
}
