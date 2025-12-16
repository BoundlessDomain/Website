import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("Supabase Config:", {
    url: supabaseUrl,
    keyExists: !!supabaseKey,
    keyLength: supabaseKey?.length
});

export const supabase = createClient(supabaseUrl, supabaseKey);
