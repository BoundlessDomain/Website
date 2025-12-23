"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, Plus, Loader2, ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import PageTransition from "@/components/ui/PageTransition";
import ArticleCard from "@/components/articles/ArticleCard";
import AddReviewItemModal from "@/components/articles/AddReviewItemModal";
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
    const [loading, setLoading] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Edit State
    const [editArticle, setEditArticle] = useState<Article | null>(null);
    const [editReviewItem, setEditReviewItem] = useState<ReviewItem | null>(null);
    const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);

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
                    .order('rating', { ascending: false });

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
                        <div className="w-full rounded-2xl overflow-hidden bg-black/20 shadow-2xl border border-white/10">
                            <img src={article.image_url} alt={article.title} className="w-full h-auto max-h-[60vh] object-contain mx-auto" />
                        </div>
                    )}

                    {/* Title & Meta */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                        {/* Title & Meta */}
                        <div>
                            <span className="text-primary font-mono text-sm tracking-wider uppercase mb-2 block">
                                {article.type === 'review_collection' ? 'Review Collection' : 'Article'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{article.title}</h1>
                            <span className="text-white/40">{article.date_display}</span>
                        </div>
                        {/* Edit Button for Main Article */}
                        {isOwner && (
                            <div className="absolute top-0 right-0">
                                <button

                                    className="p-3 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                                    title="Edit Article"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditArticle(article);
                                        setIsAddArticleOpen(true);
                                    }}
                                >
                                    <Pencil size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl">
                        <div className="prose prose-invert prose-lg max-w-none text-white/90 leading-relaxed whitespace-pre-wrap">
                            {article.content}
                        </div>
                    </div>
                </div>

                {/* Review Items */}
                {article.type === 'review_collection' && (
                    <div className="space-y-8 mt-16 pt-8 border-t border-white/10">
                        {/* ... Header ... */}
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
                                        onEdit={isOwner ? (e) => {
                                            setEditReviewItem(item);
                                            setIsAddOpen(true);
                                        } : undefined}
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
                                    onClick={() => {
                                        setEditReviewItem(null); // Clear edit state for adding new
                                        setIsAddOpen(true);
                                    }}
                                >
                                    <Plus size={20} />
                                    Add Review Item
                                </button>
                            </div>
                        )}
                    </div>
                )}



                {/* Modals */}

                {/* 1. Review Item Modal (Add/Edit) */}
                <AddReviewItemModal
                    isOpen={isAddOpen}
                    onClose={() => {
                        setIsAddOpen(false);
                        setEditReviewItem(null);
                    }}
                    onSuccess={fetchData}
                    articleId={article.id}
                    initialData={editReviewItem}
                />

                {/* 2. Article Modal (Edit Main Article) */}
                {isAddArticleOpen && (
                    <AddArticleModal
                        isOpen={isAddArticleOpen}
                        onClose={() => {
                            setIsAddArticleOpen(false);
                            setEditArticle(null);
                        }}
                        onSuccess={fetchData}
                        initialData={editArticle}
                    />
                )}
            </div>
        </PageTransition >
    );
}
