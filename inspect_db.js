import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Assuming standard Vite .env format
const getEnv = (key) => {
    const envPath = path.resolve('.env');
    if (!fs.existsSync(envPath)) return null;
    const envFile = fs.readFileSync(envPath, 'utf8');
    const match = envFile.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY'); // Note: anon key might not have access to information_schema

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Fetching public tables...');
    // We can't query information_schema easily with anon key due to RLS, but we can try to fetch a row from known tables to see their structure.
    
    const tables = ['profiles', 'customers', 'sales', 'sale_items', 'expenses', 'products', 'debts', 'debt_transactions'];
    const schema = {};

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                schema[table] = { error: error.message };
            } else if (data && data.length > 0) {
                schema[table] = { columns: Object.keys(data[0]) };
            } else {
                schema[table] = { columns: 'Empty table, unknown structure via REST' };
            }
        } catch (e) {
            schema[table] = { error: e.message };
        }
    }

    console.log(JSON.stringify(schema, null, 2));
}

inspect();
