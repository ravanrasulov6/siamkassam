-- SQL Migration to support WhatsApp Integration
-- Run this in your Supabase SQL Editor

-- Add WhatsApp fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_verify_code TEXT;

-- Create ai_messages table if it doesn't exist (referenced in messages.service.js)
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

-- Index for phone lookups from Evolution API webhooks
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_phone ON public.profiles(whatsapp_phone);
