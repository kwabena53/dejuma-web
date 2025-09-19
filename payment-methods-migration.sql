-- Create payment_methods table for storing company payment options
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'cash', 'digital', 'bank', 'custom'
    account_details TEXT, -- JSON string for account information
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_active ON payment_methods(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_company_default ON payment_methods(company_id, is_default);

-- Add RLS policies
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their company's payment methods
CREATE POLICY "Users can view their company payment methods" ON payment_methods
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Policy for users to insert payment methods for their company
CREATE POLICY "Users can insert payment methods for their company" ON payment_methods
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Policy for users to update their company's payment methods
CREATE POLICY "Users can update their company payment methods" ON payment_methods
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Policy for users to delete their company's payment methods
CREATE POLICY "Users can delete their company payment methods" ON payment_methods
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Function to ensure only one default payment method per company
CREATE OR REPLACE FUNCTION ensure_single_default_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this record as default, unset all other defaults for this company
    IF NEW.is_default = true THEN
        UPDATE payment_methods 
        SET is_default = false 
        WHERE company_id = NEW.company_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_payment_trigger
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment();

-- Add payment_method_id to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

-- Insert default payment methods for existing companies
INSERT INTO payment_methods (company_id, name, type, account_details, is_active, is_default)
SELECT 
    c.id,
    'Cash',
    'cash',
    '{"description": "Cash payment on delivery or pickup"}',
    true,
    true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods pm WHERE pm.company_id = c.id
);

-- Insert other common payment methods for existing companies
INSERT INTO payment_methods (company_id, name, type, account_details, is_active, is_default)
SELECT 
    c.id,
    method_name,
    method_type,
    method_details,
    true,
    false
FROM companies c
CROSS JOIN (
    VALUES 
        ('Venmo', 'digital', '{"username": "", "description": "Pay via Venmo"}'),
        ('PayPal', 'digital', '{"email": "", "description": "Pay via PayPal"}'),
        ('CashApp', 'digital', '{"cashtag": "", "description": "Pay via Cash App"}'),
        ('Zelle', 'digital', '{"email": "", "phone": "", "description": "Pay via Zelle"}')
) AS default_methods(method_name, method_type, method_details)
WHERE NOT EXISTS (
    SELECT 1 FROM payment_methods pm 
    WHERE pm.company_id = c.id 
    AND pm.name = method_name
);