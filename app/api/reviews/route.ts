import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { article_id, name, rating, content, date_display, image_url, email } = body;

        if (!email || email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
