-- Siam Kassam — Bütöv Verilənlər Bazası Sxemi (Full Database Schema)
-- Bu skripti yeni Supabase layihənizin SQL Editor bölməsində icra edin.

-- UUID generatorunun aktivləşdirilməsi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    first_name TEXT,
    last_name TEXT,
    biz_name TEXT,
    biz_category TEXT,
    biz_size TEXT,
    biz_employee_count INTEGER,
    biz_currency TEXT DEFAULT '₼',
    biz_logo_url TEXT,
    biz_phone TEXT,
    biz_address TEXT,
    whatsapp_phone TEXT UNIQUE,
    whatsapp_verified BOOLEAN DEFAULT FALSE,
    whatsapp_verify_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. KATEQORİYALAR CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. MƏHSULLAR CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    barcode TEXT,
    sell_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_stock_threshold DECIMAL(12,2) DEFAULT 0,
    unit TEXT DEFAULT 'ədəd',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. ANBAR LOG CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_stock_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quantity_change DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. MÜŞTƏRİLƏR CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    total_debt DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. SATIŞLAR (SALES) CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. SATIŞ DETALLARI (SALE_ITEMS) CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. XƏRCLƏR (EXPENSES) CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 9. XƏRC ŞABLONLARI (EXPENSE TEMPLATES) CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.expense_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 10. VERƏCƏKLƏR (PAYABLES - MƏNİM BORCLARIM)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    creditor_name TEXT NOT NULL,
    amount DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 11. BORC TRANZAKSİYALARI (DEBT TRANSACTIONS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.debt_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    supplier_id UUID,
    reference_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debt_payment', 'debt_increase')),
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    payment_method TEXT,
    created_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 12. AI ISMARICLARI (AI MESSAGES / AUDITS)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'audit',
    status TEXT DEFAULT 'unread',
    is_archived BOOLEAN DEFAULT FALSE,
    feedback INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 13. PENDING AI ENTRIES CƏDVƏLİ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.pending_ai_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) AKTİVASİYASI
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_ai_entries ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS SİYASƏTLƏRİ (POLICIES)
-- ==========================================

-- Profiles Siyasətləri
CREATE POLICY "İstifadəçilər öz profillərinə baxa bilər" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "İstifadəçilər öz profillərini yeniləyə bilər" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories Siyasətləri
CREATE POLICY "Categories select policy" ON public.categories FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Categories insert policy" ON public.categories FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Categories update policy" ON public.categories FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "Categories delete policy" ON public.categories FOR DELETE USING (business_id = auth.uid());

-- Products Siyasətləri
CREATE POLICY "Products select policy" ON public.products FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Products insert policy" ON public.products FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Products update policy" ON public.products FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "Products delete policy" ON public.products FOR DELETE USING (business_id = auth.uid());

-- Product Stock Log Siyasətləri
CREATE POLICY "Stock log select policy" ON public.product_stock_log FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Stock log insert policy" ON public.product_stock_log FOR INSERT WITH CHECK (business_id = auth.uid());

-- Customers Siyasətləri
CREATE POLICY "Customers select policy" ON public.customers FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Customers insert policy" ON public.customers FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Customers update policy" ON public.customers FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "Customers delete policy" ON public.customers FOR DELETE USING (business_id = auth.uid());

-- Sales Siyasətləri
CREATE POLICY "Sales select policy" ON public.sales FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Sales insert policy" ON public.sales FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Sales update policy" ON public.sales FOR UPDATE USING (business_id = auth.uid());

-- Sale Items Siyasətləri
CREATE POLICY "Sale items select policy" ON public.sale_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.business_id = auth.uid())
);
CREATE POLICY "Sale items insert policy" ON public.sale_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.business_id = auth.uid())
);

-- Expenses Siyasətləri
CREATE POLICY "Expenses select policy" ON public.expenses FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Expenses insert policy" ON public.expenses FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Expenses update policy" ON public.expenses FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "Expenses delete policy" ON public.expenses FOR DELETE USING (business_id = auth.uid());

-- Expense Templates Siyasətləri
CREATE POLICY "Expense templates select policy" ON public.expense_templates FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Expense templates insert policy" ON public.expense_templates FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Expense templates update policy" ON public.expense_templates FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "Expense templates delete policy" ON public.expense_templates FOR DELETE USING (business_id = auth.uid());

-- Payables Siyasətləri
CREATE POLICY "Payables select policy" ON public.payables FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Payables insert policy" ON public.payables FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "Payables update policy" ON public.payables FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "Payables delete policy" ON public.payables FOR DELETE USING (business_id = auth.uid());

-- Debt Transactions Siyasətləri
CREATE POLICY "Debt transactions select policy" ON public.debt_transactions FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Debt transactions insert policy" ON public.debt_transactions FOR INSERT WITH CHECK (business_id = auth.uid());

-- AI Messages Siyasətləri
CREATE POLICY "AI Messages select policy" ON public.ai_messages FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "AI Messages insert policy" ON public.ai_messages FOR INSERT WITH CHECK (business_id = auth.uid());
CREATE POLICY "AI Messages update policy" ON public.ai_messages FOR UPDATE USING (business_id = auth.uid());
CREATE POLICY "AI Messages delete policy" ON public.ai_messages FOR DELETE USING (business_id = auth.uid());

-- Pending AI Entries Siyasətləri
CREATE POLICY "Pending AI entries select policy" ON public.pending_ai_entries FOR SELECT USING (business_id = auth.uid());
CREATE POLICY "Pending AI entries update policy" ON public.pending_ai_entries FOR UPDATE USING (business_id = auth.uid());

-- ==========================================
-- TRIGGER: Qeydiyyat zamanı avtomatik profile yaradılması
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, biz_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- İNDEKSLƏR (Sürətli axtarış və performans üçün)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_phone ON public.profiles(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_categories_business_id ON public.categories(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_id ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON public.expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_payables_business_status ON public.payables(business_id, status);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_business_id ON public.debt_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_business_id ON public.ai_messages(business_id);
