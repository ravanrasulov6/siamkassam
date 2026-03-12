import { supabase } from '../lib/supabase';

export const messagesService = {
    /**
     * Get all messages for a business
     */
    async getMessages(businessId, includeArchived = false) {
        let query = supabase
            .from('ai_messages')
            .select('*')
            .eq('business_id', businessId);

        if (!includeArchived) {
            query = query.eq('is_archived', false);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching messages:', error);
            if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                return [];
            }
            throw error;
        }
        return data;
    },

    /**
     * Create a new AI message (Letter)
     */
    async createMessage(businessId, title, content, type = 'audit') {
        const { data, error } = await supabase
            .from('ai_messages')
            .insert({
                business_id: businessId,
                title,
                content,
                type,
                status: 'unread',
                is_archived: false,
                feedback: 0
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        const { error } = await supabase
            .from('ai_messages')
            .update({ status: 'read' })
            .eq('id', messageId);

        if (error) throw error;
    },

    /**
     * Archive/Unarchive message
     */
    async setArchived(messageId, is_archived) {
        const { error } = await supabase
            .from('ai_messages')
            .update({ is_archived })
            .eq('id', messageId);

        if (error) throw error;
    },

    /**
     * Delete message
     */
    async deleteMessage(messageId) {
        const { error } = await supabase
            .from('ai_messages')
            .delete()
            .eq('id', messageId);

        if (error) throw error;
    },

    /**
     * Submit feedback (Like/Dislike)
     */
    async submitFeedback(messageId, feedback) {
        const { error } = await supabase
            .from('ai_messages')
            .update({ feedback })
            .eq('id', messageId);

        if (error) throw error;
    }
};
