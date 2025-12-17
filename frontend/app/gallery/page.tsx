import GalleryClient from "@/components/photos/GalleryClient";

// Force dynamic rendering so we always get fresh data on the server
export const dynamic = 'force-dynamic';

async function getGalleryData() {
    // Use 127.0.0.1 for server-side fetch in this environment
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
        const res = await fetch(`${apiUrl}/api/photos`, { cache: 'no-store' });
        if (!res.ok) {
            console.error("Failed to fetch gallery data:", res.status, res.statusText);
            return null;
        }
        return res.json();
    } catch (e) {
        console.error("Failed to fetch gallery data:", e);
        return null;
    }
}

export default async function GalleryPage() {
    const data = await getGalleryData();

    if (!data) {
        return (
             <div className="flex items-center justify-center h-screen text-white/50">
                Failed to load gallery data. Please check the backend connection.
            </div>
        );
    }

    return <GalleryClient initialData={data} />;
}
