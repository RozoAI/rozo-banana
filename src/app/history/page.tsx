'use client';

import { useState, useEffect } from 'react';
import { imageAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Clock, 
  Download, 
  Copy, 
  Share2,
  Loader2,
  ArrowLeft,
  Grid3X3,
  List,
  Calendar,
  Sparkles
} from 'lucide-react';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  credits_used: number;
  created_at: string;
  style?: string;
  aspect_ratio?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export default function ImageHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, pagination.page]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await imageAPI.getHistory(pagination.page, pagination.limit);
      setImages(data.images || []);
      setPagination(data.pagination || {
        page: pagination.page,
        limit: pagination.limit,
        total: 0
      });
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to load image history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `banana-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    // You could add a toast notification here
  };

  const handleShare = (image: GeneratedImage) => {
    const shareUrl = `${window.location.origin}/image/${image.id}`;
    const shareText = `Check out this image I generated with Banana!\\n\\nPrompt: ${image.prompt}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Banana Generated Image',
        text: shareText,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">Please connect your wallet to view your image history</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Generation History</h1>
                <p className="text-gray-600">
                  {pagination.total} images generated
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchHistory}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Images Yet</h2>
              <p className="text-gray-600 mb-6">Start generating amazing images with Banana!</p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Generate First Image
              </Link>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt={image.prompt}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(image)}
                          className="flex-1 bg-white/90 text-gray-900 py-2 rounded-lg hover:bg-white transition-colors flex items-center justify-center"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyPrompt(image.prompt)}
                          className="flex-1 bg-white/90 text-gray-900 py-2 rounded-lg hover:bg-white transition-colors flex items-center justify-center"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(image)}
                          className="flex-1 bg-white/90 text-gray-900 py-2 rounded-lg hover:bg-white transition-colors flex items-center justify-center"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{image.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(image.created_at)}
                    </span>
                    <span>{image.credits_used} credits</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex gap-4">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={image.url}
                      alt={image.prompt}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 mb-2">{image.prompt}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(image.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(image.created_at).toLocaleTimeString()}
                      </span>
                      {image.style && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                          {image.style}
                        </span>
                      )}
                      <span className="text-yellow-600 font-medium">
                        {image.credits_used} credits
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(image)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopyPrompt(image.prompt)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Prompt
                      </button>
                      <button
                        onClick={() => handleShare(image)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="bg-white rounded-xl shadow-md p-4 mt-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}