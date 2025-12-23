
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin client for bypassing RLS during uploads if needed, or just standard authenticated client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const articleId = params.id;

    try {
        const { data, error } = await supabaseAdmin
            .from('article_photos')
            .select('*')
            .eq('article_id', articleId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const articleId = params.id;

    try {
        // Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Admin
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (userError || !userData?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${articleId}/${Date.now()}.${fileExt}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('article-photos')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('article-photos')
            .getPublicUrl(fileName);

        // Insert into DB
        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('article_photos')
            .insert({
                article_id: articleId,
                image_url: publicUrl
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json(insertData);

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
