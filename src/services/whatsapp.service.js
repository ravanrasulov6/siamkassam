import { supabase } from '../lib/supabase';

// Green API Credentials from .env
const GREEN_API_ID = import.meta.env.VITE_GREEN_API_ID || '';
const GREEN_API_TOKEN = import.meta.env.VITE_GREEN_API_TOKEN || '';
const GREEN_API_URL = import.meta.env.VITE_GREEN_API_URL || 'https://api.green-api.com';

export const whatsappService = {
    /**
     * Start the verification process
     */
    async initiateVerification(phone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
            .from('profiles')
            .update({ 
                whatsapp_phone: phone,
                whatsapp_verify_code: code,
                whatsapp_verified: false 
            })
            .eq('id', user.id);

        if (error) throw error;

        try {
            // Clean phone number (only digits)
            const cleanPhone = phone.replace(/\D/g, '');
            await this.sendMessage(cleanPhone, `Siam Kassam WhatsApp təsdiqləmə kodunuz: ${code}`);
        } catch (err) {
            console.error('WhatsApp message failed to send:', err);
            throw new Error('Təsdiqləmə mesajı göndərilə bilmədi. Green API bağlantısını yoxlayın.');
        }

        return { success: true };
    },

    /**
     * Finalize verification
     */
    async verifyCode(code) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('whatsapp_verify_code')
            .eq('id', user.id)
            .single();

        if (fetchError) throw fetchError;

        if (profile.whatsapp_verify_code === code) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    whatsapp_verified: true,
                    whatsapp_verify_code: null 
                })
                .eq('id', user.id);

            if (updateError) throw updateError;
            return { success: true };
        } else {
            throw new Error('Yanlış təsdiqləmə kodu.');
        }
    },

    /**
     * Generic message sending via Green API
     * @param {string} to - Phone number with country code (e.g. 994501234567)
     * @param {string} text - Message content
     */
    async sendMessage(to, text) {
        if (!GREEN_API_ID || !GREEN_API_TOKEN) {
            throw new Error('Green API məlumatları (.env) daxil edilməyib.');
        }

        const chatId = `${to}@c.us`;
        const url = `${GREEN_API_URL}/waInstance${GREEN_API_ID}/sendMessage/${GREEN_API_TOKEN}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: chatId,
                message: text
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Green API xətası');
        }
        return data;
    },

    async getStatus() {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('profiles')
            .select('whatsapp_phone, whatsapp_verified')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data;
    }
};
