import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, content, date_display, image_url, type, rating, email } = body;

        // 1. Verify Owner (Simple Email Check since we don't have Auth session)
        // In a real app with Auth, we'd check the session.
        // Here we rely on the client sending the email, which is weak security but matches the current "verify-owner" pattern.
        // Ideally we should use a stronger check or a fast-track auth. 
        // For now, checks against env var.

        // NOTE: The client 'verify-owner' sends { id, email }. We should arguably check that too.
        // But for this "Add Article" action, let's just use the server-side key to insert.
        // We really should check if the requester is authorized. 
        // Since we don't have a session, we'll verify the email passed in body matches owner email.

        if (!email || email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const insertData: any = {
            title,
            content,
            date_display,
            image_url,
            type
        };

        if (type === 'standard') {
            insertData.rating = rating;
        }

        const { data, error } = await supabaseAdmin
            .from('articles')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, article: data });

    } catch (error: any) {
        console.error("Error creating article:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
