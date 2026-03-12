import React, { useState, useEffect, useRef } from 'react';
import { Camera, FileText, Mic, MessageSquare, Plus, Trash2, Zap, CheckCircle, AlertCircle, X, Image as ImageIcon, Send, Clipboard, PlayCircle, Check, Edit3, UploadCloud, Package } from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { productsService } from '../../services/products.service';
import { expensesService } from '../../services/expenses.service';
import { customersService } from '../../services/customers.service';
import { debtsService } from '../../services/debts.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import './AIHubPage.css'; // Let's ensure basic CSS fits the premium design

export default function AIHubPage() {
    const { user, business } = useAuth();
    const { showSuccess, showError, showInfo } = useToast();

    // Core states
    // Core states
    const [pendingEntries, setPendingEntries] = useState([]);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

    // Smart Input States
    const [textInput, setTextInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [processingState, setProcessingState] = useState(''); // Text for the loading spinner
    const [selectedImages, setSelectedImages] = useState([]);

    // Review Modal State
    const [reviewModal, setReviewModal] = useState(null); // { type, text, images }
    const [reviewTextDraft, setReviewTextDraft] = useState('');
    const [isBulkParsing, setIsBulkParsing] = useState(false);

    // Assistant States
    const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Salam! Sistemdə nə etmək istəyirsiniz? Faktura şəkli yükləyə, xərc yaza və ya biznesinizlə bağlı sual verə bilərsiz. 😊' }]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [paymentModal, setPaymentModal] = useState(null); // { id, name, total, paid, type }
    const [paymentAmount, setPaymentAmount] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        loadPendingEntries();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatLoading]);

    const handleEntryDataChange = (entryId, key, newValue) => {
        setPendingEntries(prev => prev.map(entry => {
            if (entry.id === entryId) {
                return {
                    ...entry,
                    parsed_data: {
                        ...entry.parsed_data,
                        [key]: newValue
                    }
                };
            }
            return entry;
        }));
    };

    async function loadPendingEntries() {
        try {
            if (!business?.id) return;
            const entries = await aiService.getPendingEntries(business.id);
            setPendingEntries(entries);
        } catch (err) {
            console.error(err);
        }
    }

    // --- Helpers ---
    const extractValue = (obj, keys, defaultVal = null) => {
        if (!obj) return defaultVal;
        for (const k of keys) {
            const lowerK = k.toLowerCase();
            const foundKey = Object.keys(obj).find(key =>
                key.toLowerCase() === lowerK ||
                key.toLowerCase().replace('_', ' ') === lowerK.replace('_', ' ')
            );
            if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) return obj[foundKey];
        }
        return defaultVal;
    };

    const sanitizeCurrency = (val) => {
        const str = String(val).toUpperCase();
        if (str.includes('AZN') || str.includes('MANAT')) return '₼';
        if (str.includes('USD') || str.includes('$')) return '$';
        if (str.includes('EUR') || str.includes('€')) return '€';
        return '₼';
    };

    const typeTitleMap = {
        'inventory': '📦 Məhsullar (İnvoys/Qaimə)',
        'expense': '💸 Xərclər (Çek/Qəbz)',
        'debt': '📒 Borclar (Borc Dəftəri)'
    };

    // --- Media Processing ---
    const resizeImage = (file) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Şəkil emalı çox vaxt apardı")), 15000);

            if (file.size < 500 * 1024) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    clearTimeout(timeout);
                    resolve(e.target.result.split(',')[1]);
                };
                reader.onerror = (e) => {
                    clearTimeout(timeout);
                    reject(e);
                };
                reader.readAsDataURL(file);
                return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIMENSION = 1600;

                if (width > height && width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                } else if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                URL.revokeObjectURL(objectUrl);
                clearTimeout(timeout);
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error("Image load failure"));
            };
            img.src = objectUrl;
        });
    };

    // --- Handlers ---
    const handleFilesSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setProcessingState('Şəkillər oxunur və optimallaşdırılır...');

        // Setup visual previews and add to chat
        const previews = files.map(f => URL.createObjectURL(f));
        setSelectedImages(previews);
        setChatMessages(prev => [...prev, { role: 'user', text: `[${files.length} ədəd şəkil yükləndi]` }]);

        try {
            const base64s = await Promise.all(files.map(f => resizeImage(f)));

            setProcessingState('Ağıllı AI analiz edir (Kategoriya və Mətn)...');
            const res = await aiService.parseUniversalImages(base64s, business.id);

            if (res.needsReview) {
                setReviewTextDraft(res.parsedData.raw_text);
                setReviewModal({
                    type: res.parsedData.type,
                    text: res.parsedData.raw_text,
                    images: previews
                });
            } else {
                showSuccess('Məlumatlar birbaşa əlavə edildi');
                loadPendingEntries();
            }
        } catch (err) {
            console.error(err);
            showError('Xəta: ' + err.message);
        } finally {
            setProcessingState('');
            e.target.value = '';
        }
    };

    const handleTextSubmit = async (e) => {
        e?.preventDefault();
        if (!textInput.trim()) return;

        setProcessingState('Səs/Mətn analiz edilir...');
        try {
            const res = await aiService.parseVoiceForInventory(textInput, business.id);
            showSuccess('Məlumat təsdiqlərə əlavə olundu!');
            setTextInput('');
            loadPendingEntries();
            setIsPendingModalOpen(true);
        } catch (err) {
            showError('Xəta: ' + err.message);
        } finally {
            setProcessingState('');
        }
    };

    // Use native web speech api for voice typing if available
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showError("Brauzeriniz səsli daxiletməni dəstəkləmir (Chrome məsləhətdir).");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'az-AZ';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            showInfo("Sizi dinləyirəm...");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setTextInput(prev => prev ? prev + ' ' + transcript : transcript);
        };

        recognition.onerror = (event) => {
            showError("Səs oxunmadı: " + event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleConfirmReview = async () => {
        if (!reviewTextDraft.trim()) {
            showError('Mətn boş ola bilməz!');
            return;
        }

        setIsBulkParsing(true);
        try {
            const res = await aiService.parseBulkTextToItems(reviewTextDraft, reviewModal.type, business.id);

            showSuccess(`Uğurla ${res.count || 'bir neçə'} giriş formalaşdırıldı.`);
            setReviewModal(null);
            setSelectedImages([]);
            loadPendingEntries();
            setIsPendingModalOpen(true); // Auto open pending entries
        } catch (err) {
            showError('Xəta: ' + err.message);
        } finally {
            setIsBulkParsing(false);
        }
    };

    // Chat Logic
    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMessages = [...chatMessages, { role: 'user', text: chatInput }];
        setChatMessages(newMessages);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await aiService.askAssistant(chatInput, business.id, newMessages);
            const { answer, actionPerformed, intent, payment_target, data } = res;

            setChatMessages([...newMessages, { role: 'ai', text: answer }]);

            if (intent === 'payment' && payment_target) {
                // If AI provides an amount, we use it to pre-fill
                const prefilledAmount = data?.amount || '';
                const found = await findAndOpenPayment(payment_target, prefilledAmount);
                if (!found) {
                    setChatMessages(prev => [...prev, { role: 'ai', text: `Müəllim, '${payment_target}' adında aktiv borc və ya xərc şablonu tapmadım.` }]);
                }
            } else if (actionPerformed) {
                // Auto-open modal after action
                await loadPendingEntries();
                setTimeout(() => setIsPendingModalOpen(true), 500);
            }
        } catch (err) {
            setChatMessages([...newMessages, { role: 'ai', text: "Üzr istəyirəm, xəta baş verdi: " + err.message }]);
        } finally {
            setChatLoading(false);
        }
    };

    const findAndOpenPayment = async (targetName, prefilledAmount = '') => {
        try {
            setProcessingState('Məlumat axtarılır...');

            // Normalize: try both "Kirayə" və "Kiraye" variations
            const normalized = targetName.toLowerCase().replace(/ə/g, 'e');

            // 1. Search customers (for debt payments to us)
            const { data: customers } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', business.id)
                .or(`first_name.ilike.%${targetName}%,first_name.ilike.%${normalized}%,last_name.ilike.%${targetName}%,last_name.ilike.%${normalized}%`)
                .gt('total_debt', 0)
                .limit(1);

            if (customers && customers.length > 0) {
                const item = customers[0];
                setPaymentModal({
                    id: item.id,
                    name: `${item.first_name} ${item.last_name || ''}`,
                    total: item.total_debt,
                    paid: 0,
                    type: 'customer_debt'
                });
                setPaymentAmount(prefilledAmount);
                return true;
            }

            // 2. Search payables (our debts to others)
            const { data: payables } = await supabase
                .from('payables')
                .select('*')
                .eq('business_id', business.id)
                .or(`creditor_name.ilike.%${targetName}%,creditor_name.ilike.%${normalized}%`)
                .neq('status', 'completed')
                .limit(1);

            if (payables && payables.length > 0) {
                const item = payables[0];
                setPaymentModal({
                    id: item.id,
                    name: item.creditor_name,
                    total: item.amount,
                    paid: parseFloat(item.paid_amount || 0),
                    type: 'payable'
                });
                setPaymentAmount(prefilledAmount);
                return true;
            }

            // 3. Search expense templates
            const { data: templates } = await supabase
                .from('expense_templates')
                .select('*')
                .eq('business_id', business.id)
                .or(`category.ilike.%${targetName}%,category.ilike.%${normalized}%`)
                .limit(1);

            if (templates && templates.length > 0) {
                const item = templates[0];
                setPaymentModal({
                    id: item.id,
                    name: item.category,
                    total: item.amount,
                    paid: 0,
                    type: 'template'
                });
                setPaymentAmount(prefilledAmount);
                return true;
            }

            return false;
        } catch (err) {
            console.error('Search error:', err);
            return false;
        } finally {
            setProcessingState('');
        }
    };

    const handleExecutePayment = async () => {
        const amountToPay = parseFloat(paymentAmount);
        if (!amountToPay || amountToPay <= 0) {
            showError('Düzgün məbləğ daxil edin');
            return;
        }

        try {
            setChatLoading(true);
            if (paymentModal.type === 'payable') {
                const newPaidAmount = paymentModal.paid + amountToPay;
                const isCompleted = newPaidAmount >= paymentModal.total;

                const { error } = await supabase
                    .from('payables')
                    .update({
                        paid_amount: newPaidAmount,
                        status: isCompleted ? 'completed' : 'active'
                    })
                    .eq('id', paymentModal.id);

                if (error) throw error;

                // Record as expense
                await expensesService.create({
                    business_id: business.id,
                    notes: `${paymentModal.name} borc ödənişi`,
                    amount: amountToPay,
                    category: 'Digər',
                    expense_date: new Date().toISOString().split('T')[0],
                    status: 'paid'
                });

                showSuccess('Borc ödənişi qeydə alındı');
            } else if (paymentModal.type === 'customer_debt') {
                // Record the customer payment
                const newDebt = Number(paymentModal.total) - amountToPay;

                await supabase.from('debt_transactions').insert({
                    business_id: business.id,
                    customer_id: paymentModal.id,
                    transaction_type: 'debt_payment',
                    amount: amountToPay,
                    balance_after: newDebt,
                    created_by: user.id,
                    notes: 'AI tərəfindən qeyd edildi'
                });

                await customersService.update(paymentModal.id, {
                    total_debt: newDebt
                });

                showSuccess(`${paymentModal.name} üçün ödəniş qeyd edildi`);
            } else {
                // Template
                await expensesService.create({
                    business_id: business.id,
                    notes: `${paymentModal.name} (Şablondan ödəniş)`,
                    amount: amountToPay,
                    category: paymentModal.name.toLowerCase().includes('kiraye') ? 'Kirayə' : (paymentModal.name.toLowerCase().includes('komunal') ? 'Kommunal' : 'Digər'),
                    expense_date: new Date().toISOString().split('T')[0],
                    status: 'paid'
                });
                showSuccess('Şablon üzrə xərc qeydə alındı');
            }

            setPaymentModal(null);
            setChatMessages(prev => [...prev, { role: 'ai', text: `Uğurla ${amountToPay} AZN ödəniş edildi. Yeni qalıq: ${(Number(paymentModal.total) - amountToPay).toFixed(2)} AZN. Başqa nə edə bilərəm?` }]);
        } catch (err) {
            showError('Ödəniş xətası: ' + err.message);
        } finally {
            setChatLoading(false);
        }
    };

    // Approval Handlers
    async function handleApprove(entry) {
        try {
            const data = entry.parsed_data || {};
            if (!business?.id) {
                showError('Biznes məlumatı tapılmadı');
                return;
            }

            if (entry.entry_type === 'inventory') {
                const name = extractValue(data, ['productName', 'product_name', 'name', 'title', 'item'], '');
                const price = extractValue(data, ['price', 'amount', 'cost', 'purchase_price', 'buy_price'], 0);
                const qty = extractValue(data, ['quantity', 'qty', 'count', 'amount_qty'], 1);
                const categoryName = extractValue(data, ['category', 'categoryName', 'type', 'group'], 'Digər');

                // Intelligent Categorization
                let categoryId = null;
                try {
                    const categories = await categoriesService.getAll(business.id);
                    const existingCategory = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());

                    if (existingCategory) {
                        categoryId = existingCategory.id;
                    } else {
                        // Create new category if it doesn't exist
                        const newCat = await categoriesService.create({
                            business_id: business.id,
                            name: categoryName,
                            color: '#6366f1', // Default branding color
                            icon: 'Package'
                        });
                        categoryId = newCat.id;
                        showInfo(`"${categoryName}" adlı yeni kategoriya yaradıldı`);
                    }
                } catch (catErr) {
                    console.error('Category auto-link error:', catErr);
                }

                await productsService.create({
                    business_id: business.id,
                    name: name || entry.raw_input?.substring(0, 50) || 'Adsız Məhsul',
                    buy_price: parseFloat(price) || 0,
                    sell_price: (parseFloat(price) || 0) * 1.2,
                    stock_quantity: parseInt(qty) || 1,
                    category_id: categoryId,
                    min_stock_threshold: 1,
                    is_active: true
                });
                showSuccess('Məhsul anbara əlavə edildi');
            }
            else if (entry.entry_type === 'expense') {
                const notes = extractValue(data, ['title', 'description', 'notes', 'name', 'target'], 'AI Xərci');
                const amount = extractValue(data, ['amount', 'price', 'cost'], 0);
                const category = extractValue(data, ['category', 'type'], 'Digər');

                await expensesService.create({
                    business_id: business.id,
                    notes: notes,
                    amount: parseFloat(amount) || 0,
                    category: category,
                    expense_date: new Date().toISOString().split('T')[0],
                    status: 'paid'
                });
                showSuccess('Xərc qeydə alındı');
            }
            else if (entry.entry_type === 'debt') {
                const ad = extractValue(data, ['ad', 'first_name', 'name', 'customer_name'], '');
                const soyad = extractValue(data, ['soyad', 'last_name', 'surname'], '');
                const phone = extractValue(data, ['telefon_nömrəsi', 'phone', 'number', 'mobile'], '');
                const amount = extractValue(data, ['məbləğ', 'amount', 'price', 'cost', 'debt_amount'], 0);

                if (!ad && !phone) {
                    showError('Borc məlumatları tam deyil (Ad və ya Telefon lazımdır)');
                    return;
                }

                // 1. Try to find existing customer
                const customers = await customersService.getAll(business.id);
                let customer = customers.find(c => {
                    // Match by phone if available
                    if (phone && c.phone && String(c.phone).includes(String(phone).slice(-7))) return true;

                    // Match by name + surname
                    const fullName = (c.first_name + ' ' + (c.last_name || '')).toLowerCase();
                    const searchAd = String(ad).toLowerCase();
                    const searchSoyad = String(soyad).toLowerCase();

                    if (searchAd && searchSoyad) {
                        return fullName.includes(searchAd) && fullName.includes(searchSoyad);
                    }
                    return searchAd && fullName.includes(searchAd);
                });

                if (!customer) {
                    showInfo(`${ad} adlı yeni müştəri yaradılır...`);
                    customer = await customersService.create({
                        business_id: business.id,
                        first_name: ad || 'Adsız',
                        last_name: soyad || '',
                        phone: phone || '',
                        total_debt: 0
                    });
                }

                // 2. Record the debt
                const { error: debtErr } = await supabase
                    .from('debt_transactions')
                    .insert({
                        business_id: business.id,
                        customer_id: customer.id,
                        transaction_type: 'debt_increase',
                        amount: parseFloat(amount),
                        balance_after: Number(customer.total_debt) + Number(amount),
                        created_by: user.id,
                        notes: 'AI tərəfindən əlavə edilib: ' + (entry.raw_input || '')
                    });

                if (debtErr) throw debtErr;

                // 3. Update customer total debt
                await customersService.update(customer.id, {
                    total_debt: Number(customer.total_debt) + Number(amount)
                });

                showSuccess(`${customer.first_name} üçün ₼${amount} borc qeyd edildi`);
            } else {
                // If it's assistant generated, try guessing
                if (data.inventory || data.product_name) {
                    const entryClone = { ...entry, entry_type: 'inventory' };
                    return handleApprove(entryClone);
                } else if (data.expense || data.category) {
                    const entryClone = { ...entry, entry_type: 'expense' };
                    return handleApprove(entryClone);
                }
            }

            await aiService.approveEntry(entry.id);
            loadPendingEntries();
        } catch (err) {
            console.error('Approval logic error:', err);
            showError('Təsdiqləmə xətası: ' + err.message);
        }
    }

    async function handleReject(entryId) {
        try {
            await aiService.rejectEntry(entryId, 'Admin tərəfindən rədd edildi');
            showInfo('Giriş rədd edildi');
            loadPendingEntries();
        } catch (err) {
            showError(err.message);
        }
    }


    return (
        <div style={{ padding: 'var(--space-8) var(--space-6)', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <div className="animate-fade-in-up" style={{ marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="avatar" style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Zap size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: '800', letterSpacing: '-0.03em', color: '#1e293b' }}>
                                Siam AI Köməkçi
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></div>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ağıllı Sistem Aktivdir</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn-animate"
                        onClick={() => {
                            if (window.confirm('Çat tarixçəsini təmizləmək istəyirsiniz?')) {
                                setChatMessages([{ role: 'ai', text: 'Salam! Sualınızı verə bilərsiniz. 😊' }]);
                            }
                        }}
                        style={{
                            background: 'white',
                            border: '1px solid var(--color-border-light)',
                            color: 'var(--color-text-secondary)',
                            padding: '12px',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                        }}
                        title="Çatı Təmizlə"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <style>{`
                .unified-chat-container {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 32px;
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 220px);
                    min-height: 500px;
                    box-shadow: 0 30px 60px -12px rgba(0,0,0,0.08);
                    overflow: hidden;
                    position: relative;
                }
                
                .chat-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    scroll-behavior: smooth;
                }

                .chat-bubble {
                    max-width: 75%;
                    padding: 16px 24px;
                    border-radius: 20px;
                    font-size: 15px;
                    line-height: 1.6;
                    position: relative;
                    animation: messagePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                @keyframes messagePop {
                    from { transform: scale(0.9) translateY(10px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }

                .bubble-ai {
                    align-self: flex-start;
                    background: white;
                    color: #334155;
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.02);
                }

                .bubble-user {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #6366f1, #4f46e5);
                    color: white;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.3);
                }

                .unified-input-bar {
                    margin: 24px 40px 40px;
                    padding: 8px;
                    background: white;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                
                .unified-input-bar:focus-within {
                    transform: translateY(-2px);
                    box-shadow: 0 25px 50px -10px rgba(0,0,0,0.15);
                    border-color: rgba(99, 102, 241, 0.2);
                }

                .action-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: #f1f5f9;
                    color: #6366f1;
                    transform: scale(1.05);
                }
                
                .action-btn.primary {
                    background: #6366f1;
                    color: white;
                    box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
                }
                
                .action-btn.primary:hover {
                    background: #4f46e5;
                    color: white;
                }

                .typing-area {
                    flex: 1;
                    border: none;
                    background: transparent;
                    padding: 12px 16px;
                    font-size: 16px;
                    color: #1e293b;
                    outline: none;
                    resize: none;
                    font-family: inherit;
                }

                .thinking-indicator {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                    background: #f1f5f9;
                    border-radius: 16px;
                    border-bottom-left-radius: 4px;
                    align-self: flex-start;
                    width: fit-content;
                }
                
                .dot {
                    width: 6px;
                    height: 6px;
                    background: #94a3b8;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                .dot:nth-child(1) { animation-delay: -0.32s; }
                .dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>

            <div className="animate-fade-in-up stagger-2">

                <div className="unified-chat-container glass-card animate-fade-in-up stagger-2" style={{
                    height: 'calc(100vh - 240px)',
                    minHeight: '400px',
                    borderRadius: 'var(--radius-2xl)',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <div className="chat-scroll-area">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}
                                style={{ padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
                                {msg.text}
                            </div>
                        ))}
                        {(chatLoading || processingState) && (
                            <div className="thinking-indicator">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <span style={{ fontSize: '12px', marginLeft: '8px', color: '#94a3b8', fontWeight: '600' }}>
                                    {processingState || 'SIAM düşünür...'}
                                </span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleChatSubmit} className="unified-input-bar">
                        <label className="action-btn" title="Şəkil/Sənəd Yüklə">
                            <UploadCloud size={22} />
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={handleFilesSelect}
                                style={{ display: 'none' }}
                            />
                        </label>

                        <button
                            type="button"
                            className={`action-btn ${isListening ? 'pulse-primary' : ''}`}
                            onClick={startListening}
                            title="Səsli Əmr"
                        >
                            <Mic size={22} color={isListening ? 'var(--color-danger)' : 'currentColor'} />
                        </button>

                        <textarea
                            className="typing-area"
                            placeholder="Əmrinizi bura yazın və ya sənəd yükləyin..."
                            rows="1"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleChatSubmit(e);
                                }
                            }}
                        />

                        <button
                            type="submit"
                            className="action-btn primary"
                            disabled={chatLoading || !chatInput.trim()}
                            title="Göndər"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* ========================================================
                MODAL 1: TEXT REVIEW (PlainText Editor before parsing)
            ======================================================== */}
            {reviewModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ padding: '0', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>

                        {/* Header */}
                        <div style={{ padding: '24px 32px', background: 'var(--color-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '24px 24px 0 0' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Edit3 size={24} /> {typeTitleMap[reviewModal.type] || 'Məlumat İcmalı'}
                                </h2>
                                <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Aşağıdakı mətni yoxlayın və düzəlişlər edin</p>
                            </div>
                            <button className="btn-animate" onClick={() => setReviewModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '32px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', background: '#f8fafc' }}>

                            {/* Selected Image Previews inside the modal */}
                            {reviewModal.images && reviewModal.images.length > 0 && (
                                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                    {reviewModal.images.map((src, i) => (
                                        <img key={i} src={src} alt="Review" style={{ height: '80px', borderRadius: '12px', border: '1px solid var(--color-border)', objectFit: 'contain', background: 'white' }} />
                                    ))}
                                </div>
                            )}

                            <div style={{ position: 'relative', flex: 1, minHeight: '300px' }}>
                                <textarea
                                    className="input"
                                    value={reviewTextDraft}
                                    onChange={e => setReviewTextDraft(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '300px',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        border: '2px solid var(--color-border)',
                                        background: 'white',
                                        fontSize: '15px',
                                        lineHeight: 1.8,
                                        fontFamily: 'monospace', /* Monospace for easier reading of list items */
                                        color: '#334155',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                                    }}
                                />
                                {isBulkParsing && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                                        <div className="spinner spinner-lg"></div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Məlumatlar cədvələ salınır...</div>
                                    </div>
                                )}
                            </div>

                            <div className="alert alert-info" style={{ display: 'flex', gap: '12px', padding: '16px', borderRadius: '16px', fontSize: '13px' }}>
                                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                                <div>Aİ şəkillərdəki məlumatı oxudu. Əgər hər hansı hərf/rəqəm səhvi varsa, mətnin içində düzəliş edib "Təsdiqlə" düyməsini vurun. Hər sətir ayrı bir element olaraq emal ediləcək.</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '24px 32px', background: 'white', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'flex-end', gap: '16px', borderRadius: '0 0 24px 24px' }}>
                            <button className="btn btn-animate" onClick={() => setReviewModal(null)} disabled={isBulkParsing} style={{ background: 'var(--color-bg)', padding: '0 24px', borderRadius: '12px', height: '48px', fontWeight: '600' }}>
                                İmtina Et
                            </button>
                            <button className="btn btn-primary btn-animate" onClick={handleConfirmReview} disabled={isBulkParsing} style={{ padding: '0 32px', borderRadius: '12px', height: '48px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={20} /> Təsdiqlə və Cədvələ Sal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: PENDING APPROVALS LIST
            ======================================================== */}
            {isPendingModalOpen && !reviewModal && (
                <div className="modal-overlay" onClick={() => setIsPendingModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    📋 Təsdiq Gözləyən Siyahı
                                </h2>
                                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '15px', marginTop: '6px' }}>Aşağıdakı məlumatları nəzərdən keçirib əsas bazaya əlavə edə bilərsiniz.</p>
                            </div>
                            <button className="btn-animate" onClick={() => setIsPendingModalOpen(false)} style={{ background: 'var(--color-bg)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {!pendingEntries || pendingEntries.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '24px', border: '2px dashed var(--color-border)' }}>
                                <div style={{ background: 'var(--color-success-light)', width: '80px', height: '80px', borderRadius: '40px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                                    <CheckCircle size={40} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text)' }}>Siyahı Təmizdir</h3>
                                <p style={{ color: 'var(--color-text-tertiary)', marginTop: '8px', fontSize: '15px' }}>Təsdiq gözləyən heç bir sənəd və ya oxunmuş məlumat yoxdur.</p>
                                <button className="btn btn-primary btn-animate" onClick={() => setIsPendingModalOpen(false)} style={{ marginTop: '24px', borderRadius: '12px', padding: '12px 32px' }}>Ana Səhifəyə Qayıt</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                                {pendingEntries.map((entry, index) => (
                                    <div key={entry.id} className="card entry-card-pop" style={{
                                        padding: '0',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        borderRadius: '24px',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                                        background: 'white',
                                        animationDelay: `${index * 0.1}s`
                                    }}>
                                        <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span className={`badge ${entry.entry_type === 'inventory' ? 'badge-primary' : (entry.entry_type === 'expense' ? 'badge-danger' : 'badge-warning')}`} style={{ textTransform: 'capitalize', fontWeight: '600' }}>
                                                    {typeTitleMap[entry.entry_type] ? typeTitleMap[entry.entry_type].split(' ')[0] : entry.entry_type}
                                                </span>
                                            </div>
                                            <small style={{ color: 'var(--color-text-tertiary)', fontWeight: '500' }}>
                                                {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                    {Object.entries(entry.parsed_data)
                                                        .filter(([k]) => !['inventory', 'expense', 'type'].includes(k))
                                                        .map(([key, value]) => (
                                                            <div key={key}>
                                                                <label style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px', display: 'block' }}>
                                                                    {key.replace('_', ' ')}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="input"
                                                                    value={value}
                                                                    onChange={(e) => handleEntryDataChange(entry.id, key, e.target.value)}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px 12px',
                                                                        height: '38px',
                                                                        fontSize: '14px',
                                                                        borderRadius: '10px',
                                                                        background: 'white',
                                                                        border: '1px solid rgba(0,0,0,0.1)',
                                                                        fontWeight: '600',
                                                                        color: 'var(--color-text-primary)'
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button className="btn btn-approve btn-animate" style={{ flex: 2, height: '52px', borderRadius: '16px', fontWeight: 'bold', padding: 0 }} onClick={() => handleApprove(entry)}>
                                                    Təsdiqlə
                                                </button>
                                                <button className="btn btn-animate" style={{ flex: 1, height: '52px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: 'none', padding: 0 }} onClick={() => handleReject(entry.id)}>
                                                    Sil
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* ========================================================
                MODAL 3: SMART PAYMENT MODAL (PREMIUM)
            ======================================================== */}
            {paymentModal && (
                <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
                    <div className="payment-modal-content-premium" onClick={e => e.stopPropagation()}>
                        <div className="payment-header-premium">
                            <button className="payment-close-btn" onClick={() => setPaymentModal(null)}>
                                <X size={20} />
                            </button>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '14px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', width: 'fit-content' }}>
                                Ağıllı Ödəniş
                            </span>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-0.5px' }}>{paymentModal.name}</h2>
                            <p style={{ opacity: 0.8, fontSize: '15px', fontWeight: '500' }}>
                                {paymentModal.type === 'payable' ? 'Borc ödənişi tələb olunur' : 'Şablon üzrə ödəniş'}
                            </p>
                        </div>

                        <div className="payment-body-premium" style={{ gap: '24px' }}>
                            {/* Two Matched Plain-Text Style Boxes */}
                            <div className="amount-display-premium" style={{ border: 'none', background: 'rgba(0,0,0,0.03)', boxShadow: 'none' }}>
                                <label className="premium-label" style={{ color: '#64748b' }}>Cari Borc / Balans</label>
                                <div className="amount-value" style={{ color: '#1e293b', fontSize: '32px' }}>
                                    {paymentModal.total} <span style={{ fontSize: '18px', fontWeight: '600', opacity: 0.6 }}>AZN</span>
                                </div>
                                {paymentModal.paid > 0 && (
                                    <div className="amount-paid" style={{ marginTop: '4px' }}>
                                        <CheckCircle size={12} style={{ marginRight: '4px' }} />
                                        Artıq {paymentModal.paid} AZN ödənilib
                                    </div>
                                )}
                            </div>

                            <div className="amount-display-premium" style={{ border: '2px solid #6366f1', background: '#fff', transition: 'all 0.3s ease' }}>
                                <label className="premium-label" style={{ color: '#6366f1' }}>Ödəniləcək Məbləğ</label>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        className="plain-text-input"
                                        placeholder="0.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            fontSize: '42px',
                                            fontWeight: '900',
                                            color: '#6366f1',
                                            width: '200px',
                                            textAlign: 'right',
                                            outline: 'none',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#6366f1' }}>AZN</span>
                                </div>

                                <div className="premium-pct-grid" style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                    {[25, 50, 75, 100].map(pct => (
                                        <button
                                            key={pct}
                                            className="premium-pct-btn"
                                            onClick={() => {
                                                const remaining = paymentModal.total - paymentModal.paid;
                                                setPaymentAmount(Math.round((remaining * pct / 100) * 100) / 100);
                                            }}
                                            style={{ height: '32px', fontSize: '12px' }}
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="premium-execute-btn"
                                onClick={handleExecutePayment}
                                style={{ marginTop: '8px', height: '64px', fontSize: '18px' }}
                            >
                                <Zap size={22} fill="white" /> Ödənişi Tamamla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
