package com.phaiffertech.platform.modules.crm.pipeline.repository;

import com.phaiffertech.platform.modules.crm.pipeline.domain.CrmPipelineStage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrmPipelineStageRepository extends JpaRepository<CrmPipelineStage, UUID> {

    List<CrmPipelineStage> findAllByTenantIdAndPipelineIdOrderBySortOrderAsc(UUID tenantId, UUID pipelineId);
}
