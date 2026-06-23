-- ==========================================
-- EHI MULTISYSTEMS - B2B CORPORATE BILLING MIGRATION
-- ==========================================

-- 1. Corporate Directory Table
CREATE TABLE IF NOT EXISTS corporate_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL UNIQUE,
    contact_phone VARCHAR(50),
    accumulated_monthly_debt NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Corporate Route Rates Table (Mapping Custom Contract Rates)
CREATE TABLE IF NOT EXISTS corporate_route_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
    route_name VARCHAR(100) NOT NULL,
    rate_per_kg NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_corporate_route UNIQUE (corporate_client_id, route_name)
);

-- 3. Update Existing Shipments/Transactions table to link Corporate Accounts
-- (Assuming a shipments/transactions table exists in your database)
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS is_corporate_account BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS cargo_weight_kg NUMERIC(10, 2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS custom_rate_per_kg NUMERIC(10, 2);

-- 4. Immutable PL/pgSQL Database Trigger Function
CREATE OR REPLACE FUNCTION process_corporate_shipment_billing()
RETURNS TRIGGER AS $$
DECLARE
    found_rate NUMERIC(10, 2);
    baseline_rate NUMERIC(10, 2) := 500.00; -- Fallback baseline rate if no rate is set
BEGIN
    -- Only run pricing if is_corporate_account is TRUE and client is specified
    IF NEW.is_corporate_account = TRUE AND NEW.corporate_client_id IS NOT NULL THEN
        -- Look up custom contracted rate per KG matching corporate client & destination route
        SELECT rate_per_kg INTO found_rate
        FROM corporate_route_rates
        WHERE corporate_client_id = NEW.corporate_client_id
          AND LOWER(route_name) = LOWER(NEW.destination_route)
        LIMIT 1;

        -- Fallback if no matching rate is found
        IF found_rate IS NULL THEN
            found_rate := baseline_rate;
        END IF;

        -- Compute custom rate and amount
        NEW.custom_rate_per_kg := found_rate;
        NEW.amount_to_pay := COALESCE(NEW.cargo_weight_kg, 1.00) * found_rate;
        
        -- Automatically log payment mode as 'Debt' for corporate clients
        NEW.payment_mode := 'Debt';

        -- Update the corporate client's accumulated monthly debt directly
        UPDATE corporate_clients
        SET accumulated_monthly_debt = accumulated_monthly_debt + NEW.amount_to_pay
        WHERE id = NEW.corporate_client_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach the trigger
DROP TRIGGER IF EXISTS trigger_process_corporate_shipment_billing ON shipments;
CREATE TRIGGER trigger_process_corporate_shipment_billing
BEFORE INSERT ON shipments
FOR EACH ROW
EXECUTE FUNCTION process_corporate_shipment_billing();

-- ==========================================
-- SEED SAMPLE CORPORATE DATA FOR THE CLIENTS
-- ==========================================

INSERT INTO corporate_clients (id, company_name, contact_phone, accumulated_monthly_debt) VALUES
('a37bfa51-ef78-43f1-bdca-b96ab3201402', 'Aramex', '08011223344', 154300.00),
('f021adff-89d2-4fe0-94f7-33a59df74fa2', 'SAHCO', '08022334455', 84000.00),
('3be177df-9831-419b-a01f-0e86a0ffccca', 'GlobaCom', '09033445566', 220000.00),
('da09de12-f0ef-4f11-bc66-3d719e782ea2', 'ZeemMax', '08044556677', 0.00)
ON CONFLICT (company_name) DO NOTHING;

-- Seed custom route-specific rates
INSERT INTO corporate_route_rates (corporate_client_id, route_name, rate_per_kg) VALUES
-- Aramex Rates
('a37bfa51-ef78-43f1-bdca-b96ab3201402', 'ABV/Abuja', 600.00),
('a37bfa51-ef78-43f1-bdca-b96ab3201402', 'BNI/Benin', 400.00),
('a37bfa51-ef78-43f1-bdca-b96ab3201402', 'Lagos', 350.00),
-- SAHCO Rates
('f021adff-89d2-4fe0-94f7-33a59df74fa2', 'ABV/Abuja', 500.00),
('f021adff-89d2-4fe0-94f7-33a59df74fa2', 'BNI/Benin', 420.00),
-- GlobaCom Rates
('3be177df-9831-419b-a01f-0e86a0ffccca', 'ABV/Abuja', 650.00),
('3be177df-9831-419b-a01f-0e86a0ffccca', 'PHC/Port Harcourt', 750.00)
ON CONFLICT ON CONSTRAINT unique_corporate_route DO NOTHING;
