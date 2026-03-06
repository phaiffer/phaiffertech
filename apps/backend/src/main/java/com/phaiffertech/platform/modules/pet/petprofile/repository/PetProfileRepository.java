package com.phaiffertech.platform.modules.pet.petprofile.repository;

import com.phaiffertech.platform.modules.pet.petprofile.domain.PetProfile;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetProfileRepository extends JpaRepository<PetProfile, UUID> {
}
