import { User } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-32 px-8 flex flex-col items-center">
            <div className="max-w-4xl w-full">
                <div className="flex items-center gap-4 mb-8">
                    <User size={48} className="text-primary" />
                    <h1 className="text-5xl font-bold text-white drop-shadow-[0_0_10px_var(--primary-glow)]">About</h1>
                </div>
                <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <p className="text-xl text-white/80">
                        More information about me and this website.
                    </p>
                </div>
            </div>
        </div>
    );
}
