import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'bobby.yu@outlook.com';
// Optional: Check ID as well if you have it in env
// const OWNER_ID = process.env.OWNER_ID; 

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, email } = body;

        if (!id || !email) {
            return NextResponse.json({ isOwner: false }, { status: 400 });
        }

        // 1. Simple Email Check (Fastest)
        if (email === OWNER_EMAIL) {
            return NextResponse.json({ isOwner: true });
        }

        // 2. Database Check (Robust)
        // Check if user has 'admin' or 'owner' role in a 'profiles' or 'roles' table if you have one.
        // For now, we stick to the simple Email check or Env var check as per previous logic.

        return NextResponse.json({ isOwner: false });

    } catch (error) {
        console.error("Verify Owner Error:", error);
        return NextResponse.json({ isOwner: false }, { status: 500 });
    }
}
