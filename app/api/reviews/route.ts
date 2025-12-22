import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Supabase URL or Key' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        const { article_id, name, rating, content, date_display, image_url, email } = body;


        const safeOwnerEmail = OWNER_EMAIL || 'Home.BobbyYu@gmail.com';
        if (!email || email.toLowerCase() !== safeOwnerEmail.toLowerCase()) {
            return NextResponse.json({ error: 'Unauthorized: Owner verification failed' }, { status: 401 });
        }

        const { data, error } = await supabaseAdmin
            .from('review_items')
            .insert({
                article_id,
                name,
                rating,
                content,
                date_display,
                image_url
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, item: data });

    } catch (error: any) {
        console.error("Error creating review item:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
