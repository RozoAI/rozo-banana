"use client";

import { HeaderLogo } from "@/components/HeaderLogo";
import { ShareButton } from "@/components/ShareButton";
import { TwitterShareButton } from "@/components/TwitterShareButton";
import { useIsMobile } from "@/hooks/useIsMobile";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ShareImage {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
  user_address?: string;
}

const getFilenameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split("/").pop();
    return filename || url;
  } catch (error) {
    console.warn("Invalid URL:", url);
    return url;
  }
};

export default function SharePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [image, setImage] = useState<ShareImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Handle referral code from URL
  useEffect(() => {
    const referralCode = searchParams.get("ref");
    if (referralCode) {
      // Save referral code to localStorage and cookie
      localStorage.setItem("referralCode", referralCode);
      document.cookie = `referralCode=${referralCode}; path=/; max-age=${
        60 * 60 * 24 * 30
      }`; // 30 days
      console.log("Referral code saved:", referralCode);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Try to fetch from your API first
        const response = await fetch(`/api/share/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setImage({
            created_at: data.created_at || new Date().toISOString(),
            id: data.id || (params.id as string),
            image_url: `https://eslabobvkchgpokxszwv.supabase.co/storage/v1/object/public/generated-images/rozobanana/${data.id}`,
            prompt:
              data.prompt || "AI-generated image created with ROZO Banana",
          });
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn("API fetch failed, using fallback:", apiError);
      }

      // Fallback: create a mock image object for demo
      try {
        let imageUrl = "";
        if (params.id && params.id.includes("https")) {
          const filename = getFilenameFromUrl(params.id as string);
          imageUrl = decodeURIComponent(filename);
        } else {
          imageUrl = `https://eslabobvkchgpokxszwv.supabase.co/storage/v1/object/public/generated-images/rozobanana/${params.id}`;
        }

        setImage({
          id: params.id as string,
          image_url: imageUrl,
          prompt: "AI-generated image created with ROZO Banana",
          created_at: new Date().toISOString(),
        });
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchImage();
    } else {
      setError("Invalid image ID");
      setLoading(false);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(17,17,17)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(245,210,60)] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="min-h-screen bg-[rgb(17,17,17)] flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🍌</span>
          <h1 className="text-2xl font-bold text-white mb-2">
            Image Not Found
          </h1>
          <p className="text-gray-400 mb-4">
            This image may have been removed or doesn't exist.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-[rgb(245,210,60)] text-black rounded-lg font-semibold hover:bg-[rgb(255,220,70)] transition-colors"
          >
            Go to Banana
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(17,17,17)]">
      {/* Header */}
      <header className="sticky top-0 w-full bg-[rgb(17,17,17)]/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <HeaderLogo />
            <Link
              href="/generate"
              className="px-4 py-2 bg-[rgb(245,210,60)] text-black rounded-lg font-semibold hover:bg-[rgb(255,220,70)] transition-colors"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[rgb(17,17,17)] rounded-2xl shadow-lg border border-gray-800 overflow-hidden">
          {/* Image Display */}
          <div className="relative w-full h-96 md:h-[500px]">
            <Image
              src={image.image_url}
              alt={image.prompt}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  AI-Generated Image
                </h1>
                {image.prompt && (
                  <p className="text-gray-400 mb-4">"{image.prompt}"</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Created with ROZO Banana</span>
                  <span>•</span>
                  <span>{new Date(image.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isMobile ? (
                <ShareButton
                  imageUrl={image.image_url}
                  prompt={image.prompt}
                  className="flex-1"
                >
                  Share
                </ShareButton>
              ) : (
                <TwitterShareButton
                  imageUrl={image.image_url}
                  prompt={image.prompt}
                  className="flex-1"
                >
                  Share on X
                </TwitterShareButton>
              )}

              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = image.image_url;
                  a.download = `banana-${image.id}.png`;
                  a.click();
                }}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Download
              </button>
            </div>

            {/* Call to Action */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-2">
                Create Your Own AI Images
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                Transform your ideas into stunning visuals with ROZO Banana's AI
                image generator.
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[rgb(245,210,60)] text-black rounded-lg hover:bg-[rgb(255,220,70)] transition-colors text-sm font-medium"
              >
                <span>🎨</span>
                Start Creating
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
