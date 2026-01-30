package com.inventory.orchestrator.entity;

/**
 * Status of an AI-generated transfer proposal.
 * Only ACCEPTED proposals may later generate actual Transfer entities.
 */
public enum TransferProposalStatus {
    PROPOSED,
    ACCEPTED,
    REJECTED
}
