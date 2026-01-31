-- Transfer proposals: AI-suggested transfers. Do not affect stock.
-- Only ACCEPTED proposals may later generate Transfer entities.

CREATE TABLE IF NOT EXISTS transfer_proposal (
    id BIGSERIAL PRIMARY KEY,
    from_store_id BIGINT NOT NULL,
    to_store_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT,
    confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transfer_proposal_from_store FOREIGN KEY (from_store_id) REFERENCES store(id),
    CONSTRAINT fk_transfer_proposal_to_store FOREIGN KEY (to_store_id) REFERENCES store(id),
    CONSTRAINT fk_transfer_proposal_product FOREIGN KEY (product_id) REFERENCES product(id),
    CONSTRAINT chk_transfer_proposal_stores_different CHECK (from_store_id != to_store_id)
);

CREATE INDEX IF NOT EXISTS idx_transfer_proposal_status ON transfer_proposal(status);
CREATE INDEX IF NOT EXISTS idx_transfer_proposal_created_at ON transfer_proposal(created_at);
