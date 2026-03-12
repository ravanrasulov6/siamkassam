-- AI Məktublar/Auditlər cədvəli
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'audit', -- audit, recommendation, info
    status TEXT DEFAULT 'unread', -- unread, read
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktivasiyası
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Siyasətlər
CREATE POLICY "Users can view their own ai_messages" ON public.ai_messages
    FOR SELECT USING (business_id = auth.uid());

CREATE POLICY "Users can insert their own ai_messages" ON public.ai_messages
    FOR INSERT WITH CHECK (business_id = auth.uid());

CREATE POLICY "Users can update their own ai_messages" ON public.ai_messages
    FOR UPDATE USING (business_id = auth.uid());

CREATE POLICY "Users can delete their own ai_messages" ON public.ai_messages
    FOR DELETE USING (business_id = auth.uid());

-- İndeks
CREATE INDEX IF NOT EXISTS idx_ai_messages_business_id ON public.ai_messages(business_id);
