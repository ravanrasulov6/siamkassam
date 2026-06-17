import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getSecret(key: string, defaultValue = ""): Promise<string> {
  const envVal = Deno.env.get(key);
  if (envVal) return envVal;
  
  try {
    const { data } = await supabase
      .from('secrets')
      .select('value')
      .eq('key', key)
      .single();
    return data?.value || defaultValue;
  } catch {
    return defaultValue;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, text, businessId, chatHistory, entryType, imagesBase64, imageBase64, audioBase64 } = body;

    const groqApiKey = await getSecret('GROQ_API_KEY');

    // --- Action: transcribe_audio (Whisper Speech-to-Text) ---
    if (action === 'transcribe_audio') {
       if (!audioBase64) {
           throw new Error('Audio məlumatı tapılmadı');
       }

       // Convert base64 back to Uint8Array
       const binaryString = atob(audioBase64);
       const len = binaryString.length;
       const bytes = new Uint8Array(len);
       for (let i = 0; i < len; i++) {
           bytes[i] = binaryString.charCodeAt(i);
       }
       
       const fileBlob = new Blob([bytes], { type: 'audio/webm' });
       
       const formData = new FormData();
       formData.append('file', fileBlob, 'audio.webm');
       formData.append('model', 'whisper-large-v3');
       formData.append('language', 'az');

       const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
           method: 'POST',
           headers: {
               'Authorization': 'Bearer ' + groqApiKey
           },
           body: formData
       });

       if (!whisperRes.ok) {
           const errText = await whisperRes.text();
           throw new Error(`Whisper API Error: ${errText}`);
       }

       const whisperData = await whisperRes.json();
       return new Response(JSON.stringify({ text: whisperData.text }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
       });
    }

    // Fetch user profile to get their name
    let userName = "";
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', businessId)
        .single();
      if (profile && profile.first_name) {
        userName = profile.first_name.trim();
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
    const greetingName = userName ? `${userName} bəy` : 'Müəllim';

    // --- Action: ask_assistant / chat ---
    if (action === 'ask_assistant' || action === 'chat') {
       // Step 1: Determine if SQL or Write Action is needed
       const systemPrompt1 = `Sən Siam AI layihəsinin ağıllı idarəetmə köməkçisisən.
İstifadəçinin sualına və ya əmrinə cavab vermək üçün bazadan məlumat oxumağa (SELECT) və ya məlumat yazmağa (INSERT/UPDATE) ehtiyac olub-olmadığını müəyyən et.
İstifadəçinin 'business_id' dəyəri: "${businessId}".

Qaydalar və Mümkün Cavab Formatları:

1. Əgər istifadəçi məlumat oxumaq (statistika, siyahı, suallar) istəyirsə, SQL SELECT sorğusu qaytar:
   { "sql_query": "SELECT ... WHERE business_id = '${businessId}' ..." }
   (Verilənlər bazası sxemi: public.profiles, public.categories, public.products, public.sales, public.sale_items, public.expenses, public.customers, public.payables)

2. Əgər istifadəçi verilənlər yazmaq/dəyişmək (borc əlavə etmək, borc silmək, ödəniş etmək və s.) istəyirsə, uyğun 'write_action' obyektini qaytar:
    - Müştəriyə borc yazmaq ("Rəvana 500 AZN borc yaz", "Orxan adlı dostuma 200 manat borc yaz", "Əlinin alacağına 100 yaz", "X-dən alacağım var", "X-ə borc verdim"):
      DİQQƏT: Bu əməliyyat alacaqlar/müştəri borcları (Customer Debt) üçündür. İstifadəçi başqasına pul veribsə, dostuna/müştəriyə borc yazırsa, yaxud kiminsə ona borcu yaranıbsa ("borc yaz", "borc verdim", "alacağım var" ifadələri) bu action-dan istifadə olunur:
      { "write_action": { "action": "add_customer_debt", "customer_name": "Müştəri adı", "amount": 500, "due_date": "YYYY-MM-DD", "notes": "Qeyd" } }
    - Müştərinin borcunu ödəmək/silmək ("Əlinin borcunu sil/öndəndi"):
      { "write_action": { "action": "pay_customer_debt", "customer_name": "Müştəri adı", "amount": null, "notes": "AI tərəfindən silindi" } }
      (Qeyd: 'amount' verilərsə o qədər, null verilərsə müştərinin bütün borcu ödənilir/silinir)
    - Mənim başqasına olan borcumu əlavə etmək ("Orxana 200 AZN verəcək borcum var", "Orxana borcum var", "Orxandan borc aldım", "verəcəyim var"):
      DİQQƏT: Bu əməliyyat verəcəklər (Payables) üçündür. İstifadəçi özü kiməsə borcludursa ("borcum var", "verəcəyim var", "borc aldım" ifadələri) bu action-dan istifadə olunur:
      { "write_action": { "action": "add_payable", "creditor_name": "Şəxsin adı", "amount": 200, "due_date": "YYYY-MM-DD", "description": "Təsvir" } }
    - Mənim başqasına olan borcumun ödənilməsi ("Orxana olan borcumu verdim/sildim"):
      { "write_action": { "action": "pay_payable", "creditor_name": "Şəxsin adı", "amount": null } }
      (Qeyd: 'amount' null olarsa, həmin şəxsə olan bütün borcumuz ödənilir)

3. Əgər sualda rəqəmlər artıq hazır verilibsə və ya sual sadə söhbətdirsə, birbaşa cavab yaz:
   { "answer": "..." }

Həmişə YALNIZ tələb olunan JSON formatında cavab ver, əlavə heç bir mətn yazma.`;

       const groqRes1 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Authorization': 'Bearer ' + groqApiKey, 'Content-Type': 'application/json' },
           body: JSON.stringify({
               model: 'llama-3.3-70b-versatile',
               messages: [
                   { role: 'system', content: systemPrompt1 },
                   ...(chatHistory || []).map((h: any) => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
                   { role: 'user', content: text }
               ],
               response_format: { type: 'json_object' },
               temperature: 0.1
           })
       });

       const data1 = await groqRes1.json();
       const parsed1 = JSON.parse(data1.choices[0].message.content);

       // Eger model birbaşa cavab veribsə, dərhal qaytar
       if (parsed1.answer) {
           return new Response(JSON.stringify({ answer: parsed1.answer }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           });
       }

       let queryResult = null;
       let executedQuery = null;

       // 1. SELECT SQL sorğusu varsa
       if (parsed1.sql_query) {
           executedQuery = parsed1.sql_query;
           const { data: rpcData, error: rpcError } = await supabase.rpc('execute_business_query', {
               p_business_id: businessId,
               p_query: parsed1.sql_query
           });
           
           if (rpcError) {
               queryResult = { error: rpcError.message };
           } else {
               queryResult = rpcData;
           }
       }

       // 2. Yazmaq (Mutation) action-ı varsa
       if (parsed1.write_action) {
           const { action: subAction, customer_name, creditor_name, amount, due_date, notes, description } = parsed1.write_action;
           let rpcName = "";
           let params = {};
           executedQuery = `Mutation: ${subAction}`;
           
           if (subAction === 'add_customer_debt') {
               rpcName = 'ai_add_customer_debt';
               params = { p_business_id: businessId, p_customer_name: customer_name, p_amount: amount, p_due_date: due_date ? due_date : null, p_notes: notes };
           } else if (subAction === 'pay_customer_debt') {
               rpcName = 'ai_pay_customer_debt';
               params = { p_business_id: businessId, p_customer_name: customer_name, p_amount: amount ? amount : null, p_notes: notes };
           } else if (subAction === 'add_payable') {
               rpcName = 'ai_add_payable';
               params = { p_business_id: businessId, p_creditor_name: creditor_name, p_amount: amount, p_due_date: due_date ? due_date : null, p_description: description };
           } else if (subAction === 'pay_payable') {
               rpcName = 'ai_pay_payable';
               params = { p_business_id: businessId, p_creditor_name: creditor_name, p_amount: amount ? amount : null };
           }
           
           if (rpcName) {
               const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName, params);
               if (rpcError) {
                   queryResult = { error: rpcError.message };
               } else {
                   queryResult = rpcData;
               }
           }
       }

       // Step 2: Final response generation
       const systemPrompt2 = `Sən Siam AI layihəsinin ağıllı idarəetmə köməkçisisən.
Məlumatlara əsaslanaraq istifadəçinin sualını və ya əmrinin yerinə yetirilmə nəticəsini Azərbaycan dilində, çox səmimi, professional və bəzən "${greetingName}" (və ya bəzən "Müəllim") deyə müraciət edərək cavabla.

Vacib Qaydalar:
- Hər cümlədə xitab etmə (təkrarlama). Müraciət sözünü yalnız 1-2 dəfə istifadə et.
- Əgər bir borc əlavə edilibsə və ya silinibbə, uğurlu şəkildə edildiyini təsdiqlə və yeni qalıq balansını qeyd et.

İstifadəçinin sualı/əmri: ${text}
İcra olunan əməliyyat: ${executedQuery || 'Yoxdur'}
Nəticə (Data): ${JSON.stringify(queryResult || 'Məlumat yoxdur')}

Cavabı JSON formatında qaytar:
{ "answer": "..." }`;

       const groqRes2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Authorization': 'Bearer ' + groqApiKey, 'Content-Type': 'application/json' },
           body: JSON.stringify({
               model: 'llama-3.3-70b-versatile',
               messages: [
                   { role: 'system', content: systemPrompt2 }
               ],
               response_format: { type: 'json_object' },
               temperature: 0.2
           })
       });

       const data2 = await groqRes2.json();
       const finalAnswer = JSON.parse(data2.choices[0].message.content);

       return new Response(JSON.stringify(finalAnswer), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    // --- Action: parse_text (Voice/Text parsing for stock) ---
    if (action === 'parse_text') {
       const systemPrompt = `Sən Siam AI-san. İstifadəçinin səsli və ya yazılı anbar məlumatını analiz et.
Mətndən məhsulun adı (name), alış qiyməti (buy_price), satış qiyməti (sell_price), miqdarı (quantity) və kateqoriyasını (category) çıxar.
YALNIZ aşağıdakı formatda JSON qaytar:
{
  "name": "Məhsul adı",
  "buy_price": 10.50,
  "sell_price": 15.00,
  "quantity": 5,
  "category": "Kateqoriya adı"
}
Diqqət et: Əgər hansısa sahə mətndə yoxdursa, təxmini məntiqli qiymət yaz (məsələn, satış qiyməti tapılmasa, alış qiymətini 1.2-yə vuraraq hesabla).`;

       const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Authorization': 'Bearer ' + groqApiKey, 'Content-Type': 'application/json' },
           body: JSON.stringify({
               model: 'llama-3.3-70b-versatile',
               messages: [
                   { role: 'system', content: systemPrompt },
                   { role: 'user', content: text }
               ],
               response_format: { type: 'json_object' },
               temperature: 0.1
           })
       });

       const data = await groqRes.json();
       const parsedData = JSON.parse(data.choices[0].message.content);

       // Save to pending_ai_entries
       const { data: inserted, error } = await supabase
           .from('pending_ai_entries')
           .insert({
               business_id: businessId,
               entry_type: entryType || 'inventory',
               raw_input: text,
               parsed_data: parsedData,
               status: 'pending'
           })
           .select()
           .single();

       if (error) throw error;

       return new Response(JSON.stringify({ success: true, entry: inserted }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    // --- Action: parse_bulk_text ---
    if (action === 'parse_bulk_text') {
       const systemPrompt = `Sən Siam AI-san. Aşağıdakı mətndən məhsulların, xərclərin və ya borcların siyahısını analiz et.
YALNIZ aşağıdakı formatda JSON qaytar:
{
  "items": [
    {
      "name": "Ad",
      "buy_price": 0,
      "sell_price": 0,
      "quantity": 1,
      "category": "Kategoriya"
    }
  ]
}`;

       const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Authorization': 'Bearer ' + groqApiKey, 'Content-Type': 'application/json' },
           body: JSON.stringify({
               model: 'llama-3.3-70b-versatile',
               messages: [
                   { role: 'system', content: systemPrompt },
                   { role: 'user', content: text }
               ],
               response_format: { type: 'json_object' },
               temperature: 0.1
           })
       });

       const data = await groqRes.json();
       const parsed = JSON.parse(data.choices[0].message.content);

       // Save all parsed items to pending_ai_entries
       const entriesToInsert = (parsed.items || []).map((item: any) => ({
           business_id: businessId,
           entry_type: entryType || 'inventory',
           raw_input: text.substring(0, 100),
           parsed_data: item,
           status: 'pending'
       }));

       const { data: inserted, error } = await supabase
           .from('pending_ai_entries')
           .insert(entriesToInsert)
           .select();

       if (error) throw error;

       return new Response(JSON.stringify({ success: true, entries: inserted }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    // --- Action: parse_image / parse_images (Computer Vision) ---
    if (action === 'parse_image' || action === 'parse_images') {
       const imageToProcess = imageBase64 || (imagesBase64 && imagesBase64[0]);
       if (!imageToProcess) {
           throw new Error('Şəkil tapılmadı (Base64 yoxdur)');
       }

       // We use Groq's Vision Model (llama-3.2-11b-vision-preview)
       const systemPrompt = `Sən Siam AI-san. Təqdim olunan şəkildəki sənədi/çeki/borc dəftərini analiz et.
Əgər bu çek/qəbzdirsə, xərc məlumatlarını çıxar.
Əgər borc dəftəridirsə, müştəri adlarını və borc məbləğlərini çıxar.
Əgər məhsul siyahısı/invoysdursa, məhsul adlarını, qiymətlərini çıxar.
Məlumatları YALNIZ aşağıdakı JSON formatında qaytar:
{
  "entry_type": "inventory" | "expense" | "debt",
  "parsed_data": {
    "name": "Məhsul adı/Xərc adı/Müştəri adı",
    "amount": 10.50,
    "quantity": 1,
    "category": "Kateqoriya",
    "buy_price": 10.50,
    "sell_price": 12.50
  }
}`;

       const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Authorization': 'Bearer ' + groqApiKey, 'Content-Type': 'application/json' },
           body: JSON.stringify({
               model: 'llama-3.2-11b-vision-preview',
               messages: [
                   { role: 'system', content: systemPrompt },
                   {
                       role: 'user',
                       content: [
                           { type: 'text', text: 'Bu şəkildəki sənədi/məlumatı çıxar.' },
                           { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageToProcess}` } }
                       ]
                   }
               ],
               response_format: { type: 'json_object' },
               temperature: 0.1
           })
       });

       const data = await groqRes.json();
       const parsed = JSON.parse(data.choices[0].message.content);

       // Save to pending_ai_entries
       const { data: inserted, error } = await supabase
           .from('pending_ai_entries')
           .insert({
               business_id: businessId,
               entry_type: parsed.entry_type || entryType || 'inventory',
               raw_input: '[Şəkil Analizi]',
               parsed_data: parsed.parsed_data || parsed,
               status: 'pending'
           })
           .select()
           .single();

       if (error) throw error;

       return new Response(JSON.stringify({ success: true, entry: inserted }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 200, headers: corsHeaders });
  }
});
