import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Supabase URL or Key' }, { status: 500 });
        }

        // 1. Verify User Token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Check Admin Status in DB (Profiles table)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
        }

        const body = await req.json();
        const { article_id, name, rating, content, date_display, image_url } = body;

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
