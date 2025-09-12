-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view companies they own or work for" ON companies;
DROP POLICY IF EXISTS "Users can update companies they own" ON companies;
DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can delete companies they own" ON companies;
DROP POLICY IF EXISTS "Company owners can manage employees" ON company_employees;
DROP POLICY IF EXISTS "Users can view employees of companies they own or work for" ON company_employees;
DROP POLICY IF EXISTS "Users can view clients from their company" ON clients;
DROP POLICY IF EXISTS "Users can insert clients for their company" ON clients;
DROP POLICY IF EXISTS "Users can update clients from their company" ON clients;
DROP POLICY IF EXISTS "Users can delete clients from their company" ON clients;

-- Create tables (if they don't exist)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  website TEXT,
  industry TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'employee',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  property_address TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for user_profiles (no recursion risk)
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Simple RLS policies for companies (owner-only access to avoid recursion)
CREATE POLICY "Users can view companies they own" ON companies
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert companies they own" ON companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update companies they own" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete companies they own" ON companies
  FOR DELETE USING (auth.uid() = owner_id);

-- Simple RLS policies for company_employees
CREATE POLICY "Users can view company employees" ON company_employees
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "Company owners can manage employees" ON company_employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

-- Simple RLS policies for clients (owner-only to avoid recursion)
CREATE POLICY "Users can view their company clients" ON clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can insert clients for their company" ON clients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their company clients" ON clients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can delete their company clients" ON clients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND owner_id = auth.uid())
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at timestamps
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();