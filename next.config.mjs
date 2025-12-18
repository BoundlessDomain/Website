/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;