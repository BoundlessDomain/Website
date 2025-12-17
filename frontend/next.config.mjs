import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Transpile 3D libraries to ensure they work with Next.js build system
    transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
    webpack: (config) => {
        // Force webpack to resolve React and React DOM to the versions in ./node_modules
        // This eliminates the "Dual React" issue causing the ReactCurrentOwner error
        config.resolve.alias['react'] = path.resolve(__dirname, '.', 'node_modules', 'react');
        config.resolve.alias['react-dom'] = path.resolve(__dirname, '.', 'node_modules', 'react-dom');

        return config;
    },
};

export default nextConfig;