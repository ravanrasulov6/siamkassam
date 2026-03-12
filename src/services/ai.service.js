import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${supabase.supabaseUrl}/functions/v1/ai-process`;

async function callAIFunction(body) {
    // Create a timeout promise (30 seconds)
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI cavab verməkdə gecikir (15 saniyə bitdi). İnternet bağlantınızı yoxlayın.')), 15000)
    );

    const callPromise = supabase.functions.invoke('ai-process', { body });

    const { data, error } = await Promise.race([callPromise, timeoutPromise]);

    if (error) {
        console.error('Supabase Function Error:', error);
        throw new Error(error.message || 'AI bağlantısında xəta');
    }

    if (data && data.success === false) {
        console.error('Edge Function Error Payload:', data.error);
        throw new Error(data.error || 'AI sistemində xəta baş verdi');
    }

    return data;
}

export const aiService = {
    /**
     * Voice/Text -> Inventory entry
     * @param {string} text - Transcribed or typed text like "iPhone 17 pro aldım 350 manata"
     * @param {string} businessId
     */
    async parseVoiceForInventory(text, businessId) {
        return callAIFunction({
            action: 'parse_text',
            text,
            businessId,
            entryType: 'inventory'
        });
    },

    /**
     * Universal Image Parser (Auto-categorize + Extract text)
     * @param {string[]} imagesBase64 - Array of base64 encoded images
     * @param {string} businessId
     */
    async parseUniversalImages(imagesBase64, businessId) {
        return callAIFunction({
            action: 'parse_images',
            imagesBase64,
            businessId,
            entryType: 'auto',
            text: '[image analysis]'
        });
    },

    /**
     * Parse User-Approved Bulk Text to Items
     * @param {string} text - Review text
     * @param {string} entryType
     * @param {string} businessId
     */
    async parseBulkTextToItems(text, entryType, businessId) {
        return callAIFunction({
            action: 'parse_bulk_text',
            text,
            businessId,
            entryType
        });
    },

    /**
     * Image -> Debt entries (OCR from photo of debt notebook)
     * @param {string} imageBase64 - Base64 encoded image
     * @param {string} businessId
     */
    async parseDebtImage(imageBase64, businessId) {
        return callAIFunction({
            action: 'parse_image',
            imageBase64,
            businessId,
            entryType: 'debt',
            text: '[debt notebook scan]'
        });
    },

    /**
     * Image -> Expense entry (receipt scanning)
     * @param {string} imageBase64
     * @param {string} businessId
     */
    async parseExpenseImage(imageBase64, businessId) {
        return callAIFunction({
            action: 'parse_image',
            imageBase64,
            businessId,
            entryType: 'expense',
            text: '[receipt scan]'
        });
    },

    /**
     * AI Business Assistant
     * @param {string} question
     * @param {string} businessId
     * @param {Array} chatHistory
     */
    async askAssistant(question, businessId, chatHistory = []) {
        return callAIFunction({
            action: 'ask_assistant',
            text: question,
            businessId,
            chatHistory,
            entryType: 'assistant'
        });
    },

    /**
     * Get all pending AI entries for review
     */
    async getPendingEntries(businessId) {
        const { data, error } = await supabase
            .from('pending_ai_entries')
            .select('*')
            .eq('business_id', businessId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Approve a pending entry
     */
    async approveEntry(entryId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('pending_ai_entries')
            .update({
                status: 'approved',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', entryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Reject a pending entry
     */
    async rejectEntry(entryId, notes = '') {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('pending_ai_entries')
            .update({
                status: 'rejected',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                review_notes: notes
            })
            .eq('id', entryId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
