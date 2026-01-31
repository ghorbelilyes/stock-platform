package com.inventory.orchestrator.repository;

import com.inventory.orchestrator.entity.TransferProposal;
import com.inventory.orchestrator.entity.TransferProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransferProposalRepository extends JpaRepository<TransferProposal, Long> {

    List<TransferProposal> findByStatus(TransferProposalStatus status);

    List<TransferProposal> findByFromStoreId(Long fromStoreId);

    List<TransferProposal> findByToStoreId(Long toStoreId);

    List<TransferProposal> findByProductId(Long productId);
}
