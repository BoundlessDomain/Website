export const getApiUrl = () => {
    // 1. Explicit Env Var (Best for Custom Setups)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Client-Side Detection
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            // Local Development: Python backend usually on 8000
            return "http://127.0.0.1:8000";
        }
    }

    // 3. Production (Same Domain / Vercel Rewrites)
    // If running on Vercel without env var, valid requests are relative: /api/...
    return "";
};
