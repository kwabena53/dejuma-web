-- Create tax_settings table
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Tax',
    rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    enabled BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tax_settings_company_id ON tax_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_settings_company_default ON tax_settings(company_id, is_default);

-- Add RLS policies
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their company's tax settings
CREATE POLICY "Users can view their company tax settings" ON tax_settings
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Policy for users to insert tax settings for their company
CREATE POLICY "Users can insert tax settings for their company" ON tax_settings
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Policy for users to update their company's tax settings
CREATE POLICY "Users can update their company tax settings" ON tax_settings
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Policy for users to delete their company's tax settings
CREATE POLICY "Users can delete their company tax settings" ON tax_settings
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM companies WHERE owner_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tax_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tax_settings_updated_at
    BEFORE UPDATE ON tax_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_settings_updated_at();

-- Function to ensure only one default tax setting per company
CREATE OR REPLACE FUNCTION ensure_single_default_tax()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this record as default, unset all other defaults for this company
    IF NEW.is_default = true THEN
        UPDATE tax_settings 
        SET is_default = false 
        WHERE company_id = NEW.company_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_default_tax_trigger
    BEFORE INSERT OR UPDATE ON tax_settings
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_tax();