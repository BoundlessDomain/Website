export const getApiUrl = () => {
    // 1. Explicit Env Var (Best for Custom Setups)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Production / Relative Path
    // Since we are not running localhost backend anymore, we rely on Vercel Rewrites or same-domain API.
    return "";

    // 3. Production (Same Domain / Vercel Rewrites)
    // If running on Vercel without env var, valid requests are relative: /api/...
    return "";
};
