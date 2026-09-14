-- ==========================================================
-- Blockchain & Smart Contract Audit Schema for Supabase
-- Target Contract: ContainerAudit (0x9fE46736679d2D9a65F0992F2272dE9f3c7FA6e0)
-- Network: Anvil Local EVM (Chain ID: 31337)
-- ==========================================================

-- 1. Blockchain Transactions Table
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id BIGSERIAL PRIMARY KEY,
    tx_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    contract_name TEXT DEFAULT 'ContainerAudit',
    function_name TEXT,
    payload JSONB,
    status TEXT DEFAULT 'SUCCESS',
    chain_id INT DEFAULT 31337,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by transaction hash and contract
CREATE INDEX IF NOT EXISTS idx_tx_hash ON public.blockchain_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_contract_address ON public.blockchain_transactions(to_address);

-- 2. Container Audit Blockchain Events Table
CREATE TABLE IF NOT EXISTS public.blockchain_audit_events (
    id BIGSERIAL PRIMARY KEY,
    tx_hash TEXT NOT NULL REFERENCES public.blockchain_transactions(tx_hash) ON DELETE CASCADE,
    block_number BIGINT NOT NULL,
    container_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- e.g., 'ContainerLogged', 'TamperAlertLogged', 'LocationUpdated'
    telemetry_hash TEXT,
    payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for container queries
CREATE INDEX IF NOT EXISTS idx_audit_container_id ON public.blockchain_audit_events(container_id);

-- 3. Blockchain Sync State Tracking Table
CREATE TABLE IF NOT EXISTS public.blockchain_state (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_state ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow all operations on blockchain_transactions" ON public.blockchain_transactions;
DROP POLICY IF EXISTS "Allow all operations on blockchain_audit_events" ON public.blockchain_audit_events;
DROP POLICY IF EXISTS "Allow all operations on blockchain_state" ON public.blockchain_state;

-- Public Access Policies
CREATE POLICY "Allow all operations on blockchain_transactions" ON public.blockchain_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on blockchain_audit_events" ON public.blockchain_audit_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on blockchain_state" ON public.blockchain_state FOR ALL USING (true) WITH CHECK (true);

-- Initial State Record
INSERT INTO public.blockchain_state (key, value)
VALUES ('last_synced_block', '{"block_number": 0}')
ON CONFLICT (key) DO NOTHING;
