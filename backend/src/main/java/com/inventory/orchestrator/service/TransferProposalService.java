package com.inventory.orchestrator.service;

import com.inventory.orchestrator.dto.ai.TransferProposalView;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.entity.TransferProposal;
import com.inventory.orchestrator.entity.TransferProposalStatus;
import com.inventory.orchestrator.repository.TransferProposalRepository;
import com.inventory.orchestrator.repository.TransferRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Manages transfer proposals. AI proposes; human approves.
 * Business rules enforced here: quantity > 0, sender != receiver, sender has enough stock.
 * Only ACCEPTED proposals generate actual Transfer entities.
 */
@Service
public class TransferProposalService {

    private static final Logger log = LoggerFactory.getLogger(TransferProposalService.class);

    private final TransferProposalRepository transferProposalRepository;
    private final TransferRepository transferRepository;
    private final StockService stockService;

    public TransferProposalService(TransferProposalRepository transferProposalRepository,
                                   TransferRepository transferRepository,
                                   StockService stockService) {
        this.transferProposalRepository = transferProposalRepository;
        this.transferRepository = transferRepository;
        this.stockService = stockService;
    }

    @Transactional
    public TransferProposal create(Long fromStoreId, Long toStoreId, Long productId,
                                   Integer quantity, String reason, Double confidence) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (fromStoreId == null || toStoreId == null || fromStoreId.equals(toStoreId)) {
            throw new IllegalArgumentException("Sender and receiver stores must be different");
        }
        int available = stockService.getQuantity(fromStoreId, productId);
        if (available < quantity) {
            throw new IllegalArgumentException("Sender has insufficient stock: available=" + available + ", requested=" + quantity);
        }
        if (confidence == null || confidence < 0 || confidence > 1) {
            confidence = 0.5;
        }
        TransferProposal p = new TransferProposal(fromStoreId, toStoreId, productId, quantity, reason, confidence);
        p = transferProposalRepository.save(p);
        log.info("Transfer proposal created: id={}, from={}, to={}, product={}, qty={}", p.getId(), fromStoreId, toStoreId, productId, quantity);
        return p;
    }

    @Transactional(readOnly = true)
    public List<TransferProposal> findAll() {
        return transferProposalRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TransferProposal> findByStatus(TransferProposalStatus status) {
        return transferProposalRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Optional<TransferProposal> findById(Long id) {
        return transferProposalRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<TransferProposalView> findAllViews() {
        return transferProposalRepository.findAll().stream()
                .map(this::toView)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TransferProposalView> findViewById(Long id) {
        return findById(id).map(this::toView);
    }

    @Transactional
    public Transfer accept(Long proposalId) {
        TransferProposal p = transferProposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));
        if (p.getStatus() != TransferProposalStatus.PROPOSED) {
            throw new IllegalStateException("Proposal already " + p.getStatus() + ": " + proposalId);
        }
        int available = stockService.getQuantity(p.getFromStoreId(), p.getProductId());
        if (available < p.getQuantity()) {
            throw new IllegalStateException("Sender no longer has sufficient stock: available=" + available + ", required=" + p.getQuantity());
        }
        stockService.applyTransfer(p.getFromStoreId(), p.getToStoreId(), p.getProductId(), p.getQuantity());
        Transfer t = new Transfer(
                LocalDate.now(),
                p.getFromStoreId(),
                p.getToStoreId(),
                p.getProductId(),
                p.getReason() != null ? p.getReason() : "Accepted AI proposal " + proposalId,
                p.getQuantity()
        );
        t = transferRepository.save(t);
        p.setStatus(TransferProposalStatus.ACCEPTED);
        transferProposalRepository.save(p);
        log.info("Transfer proposal accepted: proposalId={}, transferId={}", proposalId, t.getId());
        return t;
    }

    @Transactional
    public void reject(Long proposalId) {
        TransferProposal p = transferProposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));
        if (p.getStatus() != TransferProposalStatus.PROPOSED) {
            throw new IllegalStateException("Proposal already " + p.getStatus() + ": " + proposalId);
        }
        p.setStatus(TransferProposalStatus.REJECTED);
        transferProposalRepository.save(p);
        log.info("Transfer proposal rejected: id={}", proposalId);
    }

    public TransferProposalView toView(TransferProposal p) {
        TransferProposalView v = new TransferProposalView(
                p.getId(),
                p.getFromStoreId(),
                p.getToStoreId(),
                p.getProductId(),
                p.getQuantity(),
                p.getReason(),
                p.getConfidence(),
                p.getStatus().name()
        );
        return v;
    }
}
