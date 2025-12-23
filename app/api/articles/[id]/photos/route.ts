
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Admin client for bypassing RLS during uploads if needed, or just standard authenticated client
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const articleId = params.id;
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log(`[PhotoUpload] POST request for article ${articleId}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error("[PhotoUpload] Missing Config");
            return NextResponse.json({ error: 'Config Error' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Auth Check
        // Auth Check
        const authHeader = req.headers.get('Authorization');
        console.log(`[PhotoUpload] Auth Header Present: ${!!authHeader}`); // Debug log

        if (!authHeader) {
            console.warn("[PhotoUpload] Missing Auth Header");
            return NextResponse.json({ error: 'Unauthorized: Missing Header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error("[PhotoUpload] Auth Failed - getUser error:", authError);
            return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });
        }

        console.log(`[PhotoUpload] Authenticated User: ${user.email} (${user.id})`);

        // Check Admin (DB Check)
        const { data: userData, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        console.log(`[PhotoUpload] Admin DB Result for ${user.id}:`, userData, "Error:", userError);

        if (userError || !userData?.is_admin) {
            console.error(`[PhotoUpload] Forbidden. userData: ${JSON.stringify(userData)}, error: ${JSON.stringify(userError)}`);
            // Explicitly returning JSON to avoid "Unexpected token F" client error
            return NextResponse.json({
                error: 'Forbidden',
                message: 'User is not an admin in profiles table.',
                debug_user_id: user.id
            }, { status: 403 });
        }

        const formData = await req.formData();
        const files = formData.getAll('file') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
        }

        const results = [];
        const errors = [];

        for (const file of files) {
            try {
                // Upload to Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${articleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`; // Add random string to avoid timestamp collision
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
                results.push(insertData);

            } catch (err: any) {
                console.error(`Failed to upload ${file.name}:`, err);
                errors.push({ file: file.name, error: err.message });
            }
        }

        return NextResponse.json({ uploaded: results, errors });

    } catch (error: any) {
        console.error("Upload error (Catch):", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
