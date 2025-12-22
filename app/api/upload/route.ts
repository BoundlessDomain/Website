import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        // const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL; // Accessed later

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Supabase URL or Key' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const email = formData.get('email') as string;

        // Safe access to env var
        const serverOwnerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL || "";

        if (!serverOwnerEmail) {
            return NextResponse.json({ error: "Server Misconfiguration: NEXT_PUBLIC_OWNER_EMAIL is not set on server." }, { status: 500 });
        }

        if (!email || email.toLowerCase() !== serverOwnerEmail.toLowerCase()) {
            return NextResponse.json({
                error: `Unauthorized. Client sent: '${email || "EMPTY"}'. Server expected: '${serverOwnerEmail}'`
            }, { status: 401 });
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `upload-${Date.now()}.${fileExt}`;

        // Convert file to ArrayBuffer for Supabase upload
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        const { error: uploadError, data } = await supabaseAdmin.storage
            .from('article-images')
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('article-images')
            .getPublicUrl(fileName);

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error: any) {
        console.error("Error upload API:", error);

        // Check for missing keys
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
            return NextResponse.json({ error: "Server Configuration Error: Missing Service Role Key" }, { status: 500 });
        }

        return NextResponse.json({ error: `Upload Failed: ${error.message}` }, { status: 500 });
    }
}
