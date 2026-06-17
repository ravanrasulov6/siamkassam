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
    const { action, text, businessId, chatHistory, entryType, imagesBase64, imageBase64 } = body;

    const groqApiKey = await getSecret('GROQ_API_KEY');

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
       // Step 1: Determine if SQL is needed
       const systemPrompt1 = `Sən Siam AI layihəsinin ağıllı idarəetmə köməkçisisən.
İstifadəçinin sualına cavab vermək üçün məlumat bazasından (PostgreSQL) SELECT sorğusu ilə məlumat oxumağa ehtiyac olub-olmadığını müəyyən et.
Sənə istifadəçinin 'business_id' dəyəri veriləcək: "${businessId}".

Verilənlər bazası sxemi (Hər sorğuda mütləq business_id = '${businessId}' filteri istifadə edilməlidir!):
1. public.profiles: id UUID (business_id), biz_name TEXT, biz_currency TEXT
2. public.categories: id UUID, business_id UUID, name TEXT
3. public.products: id UUID, business_id UUID, category_id UUID, name TEXT, barcode TEXT, buy_price DECIMAL, sell_price DECIMAL, stock_quantity DECIMAL, unit TEXT, is_active BOOLEAN
4. public.sales: id UUID, business_id UUID, customer_id UUID, total_amount DECIMAL, discount_amount DECIMAL, final_amount DECIMAL, payment_method TEXT, created_at TIMESTAMP
5. public.sale_items: id UUID, sale_id UUID, product_id UUID, product_name TEXT, quantity DECIMAL, unit_price DECIMAL, subtotal DECIMAL
6. public.expenses: id UUID, business_id UUID, title TEXT, amount DECIMAL, expense_date DATE, category TEXT
7. public.customers: id UUID, business_id UUID, first_name TEXT, last_name TEXT, phone TEXT, total_debt DECIMAL
8. public.payables: id UUID, business_id UUID, creditor_name TEXT, amount DECIMAL, paid_amount DECIMAL, status TEXT ('active' və ya 'completed')

Məsələn:
- "Neçə məhsulum var?" -> SELECT count(*) as product_count FROM public.products WHERE business_id = '${businessId}' AND is_active = true
- "Bu gün nə qədər satış etmişəm?" -> SELECT sum(final_amount) as total_sales FROM public.sales WHERE business_id = '${businessId}' AND created_at::date = current_date
- "Ümumi nə qədər borc var?" -> SELECT sum(total_debt) as total_debt FROM public.customers WHERE business_id = '${businessId}'

Vacib Qaydalar:
- Əgər sual verilənlər bazasından hər hansı məlumat və ya statistika tələb edirsə və verilən mətndə (sualda) bu məlumatlar yoxdursa, cavab olaraq YALNIZ aşağıdakı JSON formatında SQL sorğusu qaytar (əlavə heç bir mətn yazma):
  { "sql_query": "SELECT ... WHERE business_id = '${businessId}' ..." }
- SQL sorğusunda mütləq WHERE süzgəcində business_id = '${businessId}' istifadə et.
- Əgər sualda verilənlər artıq mövcuddursa (məsələn, hesabat analizi zamanı bütün satış və xərc rəqəmləri sualın özündə verilibsə) və ya sual sadə söhbətdirsə, birbaşa geniş cavab yaz və bu JSON formatında qaytar:
  { "answer": "..." }
- Cavab verərkən Azərbaycan dilində, çox səmimi, professional və bəzən "${greetingName}" (və ya bəzən "Müəllim") deyə müraciət et. Amma hər cümlədə xitabı təkrarlama, çox təbii olsun (maksimum 1-2 dəfə xitab et, hər cümlədə təkrarlama).`;

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

       // EGER model birinci addımda birbaşa cavab veribsə (SQL-ə ehtiyac yoxdursa), dərhal qaytarırıq!
       if (parsed1.answer) {
           return new Response(JSON.stringify({ answer: parsed1.answer }), {
             headers: { ...corsHeaders, 'Content-Type': 'application/json' },
           });
       }

       let queryResult = null;
       let executedQuery = null;

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

       // Step 2: Final response generation (yalnız SQL icra olunanda işləyir)
       const systemPrompt2 = `Sən Siam AI layihəsinin ağıllı idarəetmə köməkçisisən.
İstifadəçinin sualına cavab verirsən. Sənə verilənlər bazasından çəkilmiş məlumatlar (əgər varsa) təqdim olunacaq.
Məlumatlara əsaslanaraq istifadəçinin sualını Azərbaycan dilində, çox səmimi, professional və bəzən "${greetingName}" (və ya bəzən "Müəllim") deyə müraciət edərək cavabla.

Vacib Qayda:
- Hər cümlədə xitab etmə (təkrarlama). Müraciət sözünü (məsələn, "${greetingName}") yalnız söhbətin əvvəlində və ya uyğun yerdə cəmi 1-2 dəfə istifadə et, hər cümlədə təkrarlama ki, söhbət təbii alınsın.

İstifadəçinin sualı: ${text}
İcra olunan SQL sorğusu: ${executedQuery || 'Yoxdur'}
Sorğu nəticəsi (Data): ${JSON.stringify(queryResult || 'Məlumat yoxdur')}

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
