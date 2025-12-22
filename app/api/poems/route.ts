import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Admin Client for API routes (serves as backend)
// Initialize Supabase Admin Client for API routes (serves as backend)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
// NOTE: Service Role Key is required for admin actions, but we fallback to empty to avoid build crash
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic'; // No caching

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const authHeader = req.headers.get('Authorization');
        let isOwner = false;

        // Verify Owner if Authorization header is present
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) {
                // In a stricter app, check specific email or role
                isOwner = true;
            }
        }

        let query = supabase
            .from('poems')
            .select('*')
            .order('date_written', { ascending: true }) // Oldest first
            .order('created_at', { ascending: true });

        if (!isOwner) {
            query = query.eq('is_hidden', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.title || !body.body || !body.date_written) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('poems')
            .insert([{
                title: body.title,
                body: body.body,
                date_written: body.date_written,
                image_url: body.image_url || null,
                is_hidden: body.is_hidden || false
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error creating poem:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        const updateData: any = {};
        if (body.title) updateData.title = body.title;
        if (body.body) updateData.body = body.body;
        if (body.date_written) updateData.date_written = body.date_written;
        if (body.is_hidden !== undefined) updateData.is_hidden = body.is_hidden;

        // Only update image_url if it's strictly provided (not undefined)
        if (body.image_url !== undefined) {
            updateData.image_url = body.image_url;
        }

        const { data, error } = await supabase
            .from('poems')
            .update(updateData)
            .eq('id', body.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error updating poem:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        const { error } = await supabase
            .from('poems')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting poem:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
