"use client";

import { ShareButton } from "@/components/ShareButton";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAuth } from "@/hooks/useAuth";
import { imageAPI } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface GeneratedImage {
  id: string;
  image_url?: string;
  url?: string;
  thumbnail?: string;
  prompt: string;
  created_at: string;
}

export default function GalleryPage() {
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const { address, isConnected } = useAccount();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch gallery when wallet is connected (no auth required)
  useEffect(() => {
    if (isConnected && address) {
      console.log("🖼️ [Gallery] Fetching gallery for address:", address);
      fetchGallery();
    }
  }, [isConnected, address]);

  // Removed auto sign-in - authentication will happen when needed
  // useEffect(() => {
  //   if (address && !isAuthenticated && !isLoading) {
  //     signIn();
  //   }
  // }, [address, isAuthenticated, isLoading, signIn]);

  const fetchGallery = async () => {
    setLoading(true);
    setError(null);

    try {
      // API will automatically use the current address from localStorage
      const response = await imageAPI.getHistory(1, 100); // Fetch up to 100 images
      console.log("🌌 [Gallery] API response:", response);

      // Handle the response structure
      if (response.images) {
        setImages(response.images);
      } else if (Array.isArray(response)) {
        setImages(response);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
      setError("Failed to load image gallery");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
        <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-3xl">🍌</span>
                <span className="font-bold text-xl text-black">Banana</span>
              </div>
              <WalletConnectButton />
            </div>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] py-8">
          <div className="text-center space-y-8 w-full max-w-lg mx-auto px-4">
            <span className="text-6xl block">🖼️</span>
            <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
            <p className="text-gray-600">
              Connect your wallet to view your generated images
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Remove authentication requirement - gallery can be viewed with just wallet connection
  // Authentication will only be required when generating images

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl text-black">Banana</span>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-20">
        <div className="py-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Gallery</h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                <p className="text-gray-500 mt-4">Loading images...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchGallery}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.id || index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                  >
                    <img
                      src={image.thumbnail || image.image_url || image.url}
                      alt={image.prompt || `Generated image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        {image.prompt && (
                          <p className="text-white text-xs line-clamp-2 mb-2">
                            {image.prompt}
                          </p>
                        )}
                        <ShareButton
                          imageUrl={
                            image.thumbnail || image.image_url || image.url
                          }
                          prompt={image.prompt}
                          shareId={image.id}
                          className="text-xs px-2 py-1"
                        >
                          Share
                        </ShareButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="text-4xl mb-3">🖼️</span>
                <p className="text-gray-500">No images yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Your generated images will appear here
                </p>
                <a
                  href="/generate"
                  className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                >
                  Generate Images
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="py-3 text-center transition-colors text-gray-400 hover:text-yellow-600"
            >
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-xs font-medium">Home</p>
            </button>
            <button
              onClick={() => (window.location.href = "/generate")}
              className="py-3 text-center transition-colors text-gray-400 hover:text-yellow-600"
            >
              <div className="text-2xl mb-1">🎨</div>
              <p className="text-xs font-medium">Generate</p>
            </button>
            <button
              onClick={() => (window.location.href = "/recharge")}
              className="py-3 text-center transition-colors text-gray-400 hover:text-yellow-600 relative"
            >
              <div className="absolute -top-1 right-1/4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                HOT
              </div>
              <div className="text-2xl mb-1">💎</div>
              <p className="text-xs font-medium">Top Up</p>
            </button>
            <button className="py-3 text-center transition-colors text-yellow-600">
              <div className="text-2xl mb-1">🖼️</div>
              <p className="text-xs font-medium">Gallery</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
