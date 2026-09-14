-- ==========================================================
-- Military Box Supabase Database Schema (Production Security)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fpxpyvfeionyxfptigmy/sql/new
-- ==========================================================

-- 1. Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    device_id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Military Box ESP32',
    status TEXT DEFAULT 'active',
    location_label TEXT DEFAULT 'Depot 1',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Telemetry / Sensor Data Table
CREATE TABLE IF NOT EXISTS public.sensor_telemetry (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    temperature REAL,
    humidity REAL,
    vibration_detected BOOLEAN DEFAULT FALSE,
    door_open BOOLEAN DEFAULT FALSE,
    battery_voltage REAL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    raw_payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON public.sensor_telemetry(device_id, timestamp DESC);

-- 3. Security / Tamper Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT DEFAULT 'WARNING',
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Security Audit Logs Table (For Forensic Auditing)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'UNAUTHORIZED_ACCESS', 'TAMPER_ALERT', 'REPLAY_ATTACK', 'INVALID_SIGNATURE'
    ip_address TEXT,
    device_id TEXT,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow all operations on devices" ON public.devices;
DROP POLICY IF EXISTS "Allow all operations on sensor_telemetry" ON public.sensor_telemetry;
DROP POLICY IF EXISTS "Allow all operations on alerts" ON public.alerts;
DROP POLICY IF EXISTS "Allow all operations on security_audit_logs" ON public.security_audit_logs;

-- Public Access Policies
CREATE POLICY "Allow all operations on devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sensor_telemetry" ON public.sensor_telemetry FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on alerts" ON public.alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on security_audit_logs" ON public.security_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Default Device Insert
INSERT INTO public.devices (device_id, name, location_label)
VALUES ('ESP32_MILITARY_BOX_01', 'Military Tactical Box #1', 'Alpha Base')
ON CONFLICT (device_id) DO NOTHING;
