-- Add status column to transfer table for lifecycle: approved -> in_transit -> received -> closed
-- approved = créé / en attente, in_transit = en route, received = reçu, closed = clôturé
ALTER TABLE transfer
ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'in_transit';

COMMENT ON COLUMN transfer.status IS 'approved (pending), in_transit (en route), received, closed';
