-- Mənim Borclarım (Verəcəklər) üçün cədvəlin yaradılması
CREATE TABLE public.payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    creditor_name TEXT NOT NULL, -- Kimə borcumuz var (Məsələn: Tədarükçü, Bank, Şəxs)
    amount DECIMAL(12,2) DEFAULT 0, -- Borcun ümumi məbləği
    paid_amount DECIMAL(12,2) DEFAULT 0, -- İndiyə qədər ödənilən məbləğ
    description TEXT, -- Açıqlama
    due_date DATE, -- Son ödəniş tarixi
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Təhlükəsizlik) aktivasiyası
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;

-- Siyasət (Policy): Hər kəs yalnız öz profilinə (biznesinə) aid borcları idarə edə bilər
CREATE POLICY "Users can view their own payables" ON public.payables
  FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Users can insert their own payables" ON public.payables
  FOR INSERT WITH CHECK (business_id = auth.uid());

CREATE POLICY "Users can update their own payables" ON public.payables
  FOR UPDATE USING (business_id = auth.uid());

CREATE POLICY "Users can delete their own payables" ON public.payables
  FOR DELETE USING (business_id = auth.uid());

-- İndekslər (Sürətli axtarış üçün)
CREATE INDEX idx_payables_business_status ON public.payables(business_id, status);
