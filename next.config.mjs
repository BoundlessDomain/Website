/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
    modularizeImports: {
        'lucide-react': {
            transform: 'lucide-react/dist/esm/icons/{{lowerCase member}}',
        },
    },
};

export default nextConfig;