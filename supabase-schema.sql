-- User profiles table to store additional user information
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table to store company information
CREATE TABLE companies (
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

-- Company employees table (for future use)
CREATE TABLE company_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'employee',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_employees ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for companies
CREATE POLICY "Users can view companies they own or work for" ON companies
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT user_id FROM company_employees 
      WHERE company_id = companies.id
    )
  );

CREATE POLICY "Users can update companies they own" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete companies they own" ON companies
  FOR DELETE USING (auth.uid() = owner_id);

-- Policies for company_employees
CREATE POLICY "Users can view employees of companies they own or work for" ON company_employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Company owners can manage employees" ON company_employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE id = company_id AND owner_id = auth.uid()
    )
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
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();