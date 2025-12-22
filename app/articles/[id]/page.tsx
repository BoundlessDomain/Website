"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Plus, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageTransition from "@/components/ui/PageTransition";
import ArticleCard from "@/components/articles/ArticleCard";
import AddReviewItemModal from "@/components/articles/AddReviewItemModal";
import { useUIStore } from "@/store/uiStore";
import { supabase } from "@/utils/supabase";

interface Article {
    id: string;
    title: string;
    rating?: number;
    date_display: string;
    content: string;
    image_url?: string;
    type: 'standard' | 'review_collection';
}

interface ReviewItem {
    id: string;
    name: string;
    rating: number;
    content: string;
    date_display: string;
    image_url?: string;
}

export default function ArticleDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const isOwner = useUIStore((state) => state.isOwner);
    const [article, setArticle] = useState<Article | null>(null);
    const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Article
            const { data: articleData, error: articleError } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();

            if (articleError) throw articleError;
            setArticle(articleData);

            // 2. Fetch Items if type is collection
            if (articleData.type === 'review_collection') {
                const { data: itemsData, error: itemsError } = await supabase
                    .from('review_items')
                    .select('*')
                    .eq('article_id', id)
                    .order('created_at', { ascending: false });

                if (itemsError) throw itemsError;
                setReviewItems(itemsData || []);
            }

        } catch (error) {
            console.error("Error fetching article details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <PageTransition icon={FileText} title="LOADING..." quadrant="top-left">
                <div className="flex justify-center items-center h-[50vh]">
                    <Loader2 className="animate-spin text-primary w-12 h-12" />
                </div>
            </PageTransition>
        );
    }

    if (!article) {
        return (
            <PageTransition icon={FileText} title="NOT FOUND" quadrant="top-left">
                <div className="text-center text-white/50 py-20">
                    <p>Article not found.</p>
                    <Link href="/articles" className="text-primary hover:underline mt-4 inline-block">Return to Articles</Link>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition icon={FileText} title="ARTICLE" quadrant="top-left">
            <div className="space-y-12 pb-24 relative">

                {/* Back Button */}
                <Link href="/articles" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4">
                    <ArrowLeft size={20} />
                    Back to Articles
                </Link>

                {/* Article Header */}
                <div className="space-y-6">
                    {/* Cover Image */}
                    {article.image_url && (
                        <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden bg-black/20 shadow-2xl border border-white/10">
                            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Title & Meta */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                        <div>
                            <span className="text-primary font-mono text-sm tracking-wider uppercase mb-2 block">
                                {article.type === 'review_collection' ? 'Review Collection' : 'Article'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{article.title}</h1>
                            <span className="text-white/40">{article.date_display}</span>
                        </div>
                        {article.rating && (
                            <div className="text-right">
                                <span className="text-sm text-white/40 block">Rating</span>
                                <span className="text-3xl font-bold text-primary">{article.rating}/10</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-lg max-w-none text-white/80 leading-relaxed whitespace-pre-wrap">
                        {article.content}
                    </div>
                </div>

                {/* Review Items */}
                {article.type === 'review_collection' && (
                    <div className="space-y-8 mt-16 pt-8 border-t border-white/10">
                        <h2 className="text-2xl font-bold text-white">Reviewed Items</h2>

                        <div className="space-y-6">
                            {reviewItems.length > 0 ? (
                                reviewItems.map((item) => (
                                    <ArticleCard
                                        key={item.id}
                                        title={item.name}
                                        rating={item.rating}
                                        date={item.date_display}
                                        imageSrc={item.image_url}
                                    >
                                        <p className="whitespace-pre-wrap">{item.content}</p>
                                    </ArticleCard>
                                ))
                            ) : (
                                <p className="text-white/40 italic">No items reviewed yet.</p>
                            )}
                        </div>

                        {/* Add Item Button */}
                        {isOwner && (
                            <div className="fixed bottom-8 right-8 z-50">
                                <button
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-full 
                                             shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 active:scale-95 transition-all"
                                    onClick={() => setIsAddOpen(true)}
                                >
                                    <Plus size={20} />
                                    Add Review Item
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Add Modal */}
                <AddReviewItemModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    onSuccess={fetchData}
                    articleId={article.id}
                />
            </div>
        </PageTransition>
    );
}
