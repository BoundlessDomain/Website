import { createClient } from '@supabase/supabase-js';

// Fallback to empty string to prevent build crash, checking validity later if needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";



export const supabase = createClient(supabaseUrl, supabaseKey);
