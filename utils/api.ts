export const getApiUrl = () => {
    // 1. In Production, always use relative paths (Vercel Serverless)
    if (process.env.NODE_ENV === 'production') {
        return "";
    }

    // 2. In Development, use the explicit environment variable if set
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 3. Fallback
    return "";
};
