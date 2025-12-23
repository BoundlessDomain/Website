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
        const { title, content, date_display, image_url, type, rating } = body;

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

export async function PUT(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Supabase URL or Key' }, { status: 500 });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const { data: userData, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
        }

        const body = await req.json();
        const { id, title, content, date_display, image_url, type, rating } = body;

        const updateData: any = {
            title,
            content,
            date_display,
            image_url,
            type
        };

        if (rating !== undefined) {
            updateData.rating = rating;
        }

        const { data, error } = await supabaseAdmin
            .from('articles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, article: data });

    } catch (error: any) {
        console.error("Error updating article:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Supabase URL or Key' }, { status: 500 });
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const { data: userData, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.is_admin) {
            return NextResponse.json({ error: 'Unauthorized: Admin Access Required' }, { status: 403 });
        }

        // Try getting ID from URL search params first (safer for DELETE)
        const { searchParams } = new URL(req.url);
        let id = searchParams.get('id');

        // Fallback to body if not in params
        if (!id) {
            try {
                const body = await req.json();
                id = body.id;
            } catch (e) {
                // Body might be empty
            }
        }

        if (!id) {
            return NextResponse.json({ error: 'Missing Article ID' }, { status: 400 });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('articles')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
