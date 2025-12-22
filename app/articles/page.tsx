"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Loader2 } from "lucide-react";
import PageTransition from "@/components/ui/PageTransition";
import ArticleCard from "@/components/articles/ArticleCard";
import AddArticleModal from "@/components/articles/AddArticleModal";
import { useUIStore } from "@/store/uiStore";
import { supabase } from "@/utils/supabase";

interface Article {
    id: string;
    title: string;
    rating?: number;
    date_display: string;
    content: string;
    image_url?: string;
    type?: 'standard' | 'review_collection';
}

export default function ArticlesPage() {
    const router = useRouter();
    const isOwner = useUIStore((state) => state.isOwner);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setArticles(data || []);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    return (
        <PageTransition icon={FileText} title="ARTICLES" quadrant="top-left">
            <div className="space-y-12 pb-24">
                
                {/* Intro Section */}
                <section className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <h2 className="text-3xl font-bold text-white mb-4">Welcome to the Archives</h2>
                    <p className="text-white/80 text-lg leading-relaxed">
                        Here is where I document my thoughts, reviews, and technical deep dives. 
                        From testing everyday objects to exploring complex code patterns, this is a collection of my experiences.
                    </p>
                </section>

                {/* Articles List */}
                <div className="space-y-6 min-h-[200px]">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-primary w-10 h-10" />
                        </div>
                    ) : articles.length > 0 ? (
                        articles.map((article) => (
                            <ArticleCard
                                key={article.id}
                                title={article.title}
                                rating={article.rating || 0}
                                date={article.date_display}
                                imageSrc={article.image_url}
                                onClick={() => router.push(`/articles/${article.id}`)}
                            >
                                <p className="whitespace-pre-wrap line-clamp-3">{article.content}</p>
                            </ArticleCard>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-white/40 italic">No articles yet...</p>
                        </div>
                    )}
                </div>

                {/* Admin / Owner Controls */}
                {isOwner && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <button 
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-full 
                                     shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 active:scale-95 transition-all"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={20} />
                            Add Article
                        </button>
                    </div>
                )}

                {/* Add Modal */}
                <AddArticleModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={fetchArticles}
                />
            </div>
        </PageTransition>
    );
}
