"use client";

import { STYLE_PRESETS, StylePreset } from "@/constants/stylePresets";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { creditsAPI, imageAPI } from "@/lib/api";
import {
  ArrowLeft,
  Download,
  ImageIcon,
  Loader2,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { BottomNavigation } from "./BottomNavigation";
import { HeaderLogo } from "./HeaderLogo";
import { ShareButton } from "./ShareButton";
import { Toast } from "./Toast";
import { TwitterShareButton } from "./TwitterShareButton";

interface GeneratedResult {
  imageUrl?: string;
  response?: string;
  prompt: string;
  pointsDeducted: number;
  wasFreeTrial: boolean;
}

interface ImageGenerationResponse {
  success: boolean;
  image: {
    id: string;
    data: string;
    url: string;
    thumbnailUrl: string;
    prompt: string;
    model: string;
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
    };
    completion_tokens_details: {
      reasoning_tokens: number;
      image_tokens: number;
    };
  };
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  action?: {
    label: string;
    onClick: () => void;
  };
  withIcon?: boolean;
}

const CREDITS_PER_GENERATION = 5;
const MAX_IMAGES = 9;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function NanoBananaGenerator() {
  // Hooks
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();

  // State
  const [customPrompt, setCustomPrompt] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<GeneratedResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [showPresets, setShowPresets] = useState(true);
  const [hasSelectedPreset, setHasSelectedPreset] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<StylePreset | null>(
    null
  );
  const [toast, setToast] = useState<ToastState | null>(null);

  // Utility functions
  const showToast = useCallback(
    (
      message: string,
      type: ToastState["type"],
      action?: ToastState["action"],
      withIcon?: boolean
    ) => {
      setToast({ message, type, action, withIcon });
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasFetchedCredits = useRef(false);
  const [needToWaitForCredits, setNeedToWaitForCredits] = useState(false);

  // Fetch user credits
  const fetchUserCredits = useCallback(async () => {
    if (!address) {
      setUserCredits(0);
      return;
    }
    setNeedToWaitForCredits(true);

    try {
      const data = await creditsAPI.getBalance(address);
      const credits =
        typeof data === "object" && data !== null
          ? (data as any).available || (data as any).credits || 0
          : 0;
      setUserCredits(credits);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
      setUserCredits(0);
    } finally {
      hasFetchedCredits.current = true;
      setNeedToWaitForCredits(false);
    }
  }, [address]);

  // Load credits when wallet is connected
  useEffect(() => {
    if (address && !hasFetchedCredits.current) {
      hasFetchedCredits.current = true;
      fetchUserCredits();
    }
  }, [address]);

  // Authentication handler
  const handleAuthorize = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    clearError();

    try {
      const referralCode = localStorage.getItem("referralCode");

      await signIn(referralCode || undefined);
      await fetchUserCredits();
      showToast("Successfully authenticated!", "success");
    } catch (err) {
      console.error("Authentication failed:", err);
      setError("Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [address, signIn, fetchUserCredits, showToast, clearError]);

  // Image compression utility
  const compressImage = useCallback(
    (dataUrl: string, maxWidth: number = 1024): Promise<string> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = dataUrl;
      });
    },
    []
  );

  // Image upload handlers
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);

      if (uploadedImages.length + files.length > MAX_IMAGES) {
        setError(
          `Maximum ${MAX_IMAGES} images allowed. You have ${uploadedImages.length} and are trying to add ${files.length} more.`
        );
        return;
      }

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`Image "${file.name}" is too large. Max size is 5MB`);
          return;
        }
      }

      const newImages: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = async () => {
            const originalDataUrl = reader.result as string;
            const compressedDataUrl = await compressImage(originalDataUrl);
            resolve(compressedDataUrl);
          };
          reader.readAsDataURL(file);
        });
        newImages.push(dataUrl);
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
      clearError();
    },
    [uploadedImages.length, compressImage, clearError]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length === 0) return;

      if (uploadedImages.length + files.length > MAX_IMAGES) {
        setError(
          `Maximum ${MAX_IMAGES} images allowed. You have ${uploadedImages.length} and are trying to add ${files.length} more.`
        );
        return;
      }

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          setError(`Image "${file.name}" is too large. Max size is 5MB`);
          return;
        }
      }

      const newImages: string[] = [];
      for (const file of files) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = async () => {
            const originalDataUrl = reader.result as string;
            const compressedDataUrl = await compressImage(originalDataUrl);
            resolve(compressedDataUrl);
          };
          reader.readAsDataURL(file);
        });
        newImages.push(dataUrl);
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
      clearError();
    },
    [uploadedImages.length, compressImage, clearError]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Preset selection handler
  const handlePresetSelect = useCallback(
    (preset: StylePreset) => {
      if (
        userCredits < CREDITS_PER_GENERATION &&
        isConnected &&
        hasFetchedCredits.current
      ) {
        if (userCredits === 0) {
          showToast(
            "Credits are needed to generate images. Please join Rozo OG.",
            "warning",
            {
              label: "Join ROZO OG",
              onClick: () => router.push("/topup"),
            },
            false
          );
        } else {
          showToast(
            `Insufficient credits. You need ${CREDITS_PER_GENERATION} credits to use presets.`,
            "warning",
            {
              label: "Click to Topup",
              onClick: () => router.push("/topup"),
            },
            false
          );
        }
        return;
      }

      setCustomPrompt(preset.prompt);
      setSelectedPreset(preset);
      setShowPresets(false);
      setHasSelectedPreset(true);

      // Scroll to prompt input
      const promptElement = document.getElementById("prompt-input");
      if (promptElement) {
        promptElement.scrollIntoView({ behavior: "smooth", block: "center" });
        promptElement.focus();
      }
    },
    [isConnected, userCredits, showToast]
  );

  // Image generation handler
  const handleGenerate = useCallback(async () => {
    if (!customPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (uploadedImages.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!isAuthenticated) {
      setError("Please authorize first before generating images");
      return;
    }

    if (userCredits < CREDITS_PER_GENERATION) {
      if (userCredits === 0) {
        setError("You need credits to generate images. Please top up first!");
      } else {
        setError(
          `Insufficient credits. You need ${CREDITS_PER_GENERATION} credits.`
        );
      }
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const data = await imageAPI.generate({
        prompt: customPrompt,
        images: uploadedImages,
      });

      if (!data || !data.success) {
        throw new Error(
          data?.error || data?.message || "Failed to generate response"
        );
      }

      const responseData = data as ImageGenerationResponse;
      const imageUrl =
        responseData.success && responseData.image
          ? responseData.image.url
          : data.imageUrl || data.data?.imageUrl || data.image?.dataUrl || null;

      const response =
        responseData.success && responseData.image
          ? responseData.image.prompt
          : data.response || data.data?.response || data.image?.prompt || null;

      setGeneratedImage({
        imageUrl,
        response,
        prompt: customPrompt,
        pointsDeducted:
          data.metadata?.pointsDeducted || data.data?.pointsDeducted || 0,
        wasFreeTrial:
          data.metadata?.wasFreeTrial || data.data?.wasFreeTrial || false,
      });

      // Update credits
      if (data.metadata?.creditsRemaining !== undefined) {
        setUserCredits(data.metadata.creditsRemaining);
      } else if (data.data?.credits_remaining !== undefined) {
        setUserCredits(data.data.credits_remaining);
      }

      showToast("Image generated successfully!", "success");
    } catch (err: any) {
      console.error("Generation error:", err);

      let errorMessage = "An error occurred";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("credits") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        errorMessage = "Insufficient credits";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    customPrompt,
    uploadedImages,
    isConnected,
    isAuthenticated,
    userCredits,
    clearError,
    showToast,
  ]);

  const handleBackToStyles = useCallback(() => {
    setShowPresets(true);
    setHasSelectedPreset(false);
    setCustomPrompt("");
    setGeneratedImage(null);
    setUploadedImages([]);
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(17,17,17)]">
      {/* Header - matching Home page */}
      <header className="sticky top-0 w-full bg-[rgb(17,17,17)]/90 backdrop-blur-md border-b border-gray-600 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <HeaderLogo />

            {isConnected && showPresets && (
              <div className="text-sm">
                <span>Credits: </span>
                <span className="font-bold">{userCredits}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mb-[5rem]">
        {/* Generate Image Card - Mobile Optimized */}
        {hasSelectedPreset && (
          <>
            {!showPresets && (
              <button
                onClick={handleBackToStyles}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-2 my-4 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Presets
              </button>
            )}

            <div className="bg-[rgb(17,17,17)] rounded-xl shadow-sm p-4 border border-gray-600 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold ">
                  {generatedImage ? "Generated Image" : "Generate Image"}
                </h2>

                {!isAuthenticated && (
                  <button
                    onClick={handleAuthorize}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-medium rounded-md hover:from-orange-500 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authorizing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Authorize
                      </>
                    )}
                  </button>
                )}
              </div>

              {!generatedImage && (
                <>
                  {/* Custom Prompt Input - Mobile Optimized */}
                  <div className="mb-4">
                    {/* Selected Preset Display */}
                    {selectedPreset && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {selectedPreset.emoji}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-yellow-500">
                              {selectedPreset.title}
                            </p>
                            <p className="text-xs text-gray-200">
                              {selectedPreset.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show textarea only for Custom Prompt (when selectedPreset is null) */}
                    {!selectedPreset && (
                      <textarea
                        id="prompt-input"
                        value={customPrompt}
                        onChange={(e) => {
                          setCustomPrompt(e.target.value);
                        }}
                        placeholder={
                          userCredits === 0
                            ? "Top up credits to start creating"
                            : !isAuthenticated
                            ? "Authorize first to start creating"
                            : "Describe what you want to create..."
                        }
                        className="w-full px-3 py-2.5 border-2 border-yellow-400 rounded-lg focus:outline-none focus:border-yellow-500 resize-none text-gray-700 placeholder-gray-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-white"
                        rows={4}
                        disabled={
                          !isConnected || userCredits === 0 || !isAuthenticated
                        }
                      />
                    )}

                    {/* Show full preset text when preset is selected */}
                    {selectedPreset && (
                      <div className="w-full px-3 py-2.5 mb-4 rounded-lg bg-gray-800/50 text-white text-sm">
                        <div className="whitespace-pre-wrap">
                          {customPrompt}
                        </div>
                      </div>
                    )}
                    {customPrompt && (
                      <p className="text-xs mt-1">
                        💡 Upload an image to transform it
                      </p>
                    )}
                  </div>

                  {/* Image Upload Area - Mobile Optimized */}
                  <div className="mb-4">
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors cursor-pointer bg-black/30"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={
                          !isConnected ||
                          userCredits === 0 ||
                          !isAuthenticated ||
                          isLoading
                        }
                      />

                      {!isConnected || userCredits === 0 || !isAuthenticated ? (
                        <div className="opacity-50">
                          <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm mb-1">
                            {userCredits === 0
                              ? "Top up to upload images"
                              : !isAuthenticated
                              ? "Authorize to upload images"
                              : "Tap to upload images"}
                          </p>
                          <p className="text-gray-100 text-xs">
                            Select 0-9 images (PNG, JPG up to 5MB each)
                          </p>
                        </div>
                      ) : uploadedImages.length > 0 ? (
                        <div>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {uploadedImages.map((img, idx) => (
                              <div key={idx} className="relative aspect-square">
                                <Image
                                  src={img}
                                  alt={`Upload ${idx + 1}`}
                                  fill
                                  className="object-cover rounded"
                                />
                                <button
                                  onClick={() => {
                                    setUploadedImages((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    );
                                  }}
                                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {/* Add more images button */}
                            {uploadedImages.length < MAX_IMAGES && (
                              <label
                                htmlFor="image-upload"
                                className="relative aspect-square cursor-pointer"
                              >
                                <div className="w-full h-full border-2 border-dashed border-gray-600 rounded flex items-center justify-center hover:border-yellow-400 hover:bg-yellow-800/50 transition-colors group">
                                  <svg
                                    className="w-8 h-8 text-gray-600 group-hover:text-yellow-400 transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </div>
                              </label>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            {uploadedImages.length}/{MAX_IMAGES} images uploaded
                          </p>
                        </div>
                      ) : (
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer"
                        >
                          <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm mb-1">
                            Tap to upload images
                          </p>
                          <p className="text-gray-400 text-xs">
                            Select 0-{MAX_IMAGES} images (PNG, JPG up to 5MB
                            each)
                          </p>
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Cost and Generate Button - Mobile Optimized */}
              {!generatedImage && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">
                      Cost: {CREDITS_PER_GENERATION} credits
                    </p>
                    <p className="text-gray-300 text-xs">
                      Balance: {userCredits} credits
                    </p>
                  </div>

                  {userCredits === 0 ? (
                    <button
                      onClick={() => router.push("/topup")}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2 text-sm"
                    >
                      <Sparkles className="w-5 h-5" />
                      Top Up
                    </button>
                  ) : isAuthenticated ? (
                    <button
                      onClick={handleGenerate}
                      disabled={
                        isLoading ||
                        !customPrompt.trim() ||
                        uploadedImages.length === 0
                      }
                      className="px-5 py-2.5 bg-[rgb(245,210,60)] text-black font-medium rounded-lg hover:bg-[rgb(255,220,70)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span>{error}</span>
                    {userCredits === 0 && error.includes("top up") && (
                      <button
                        onClick={() => router.push("/topup")}
                        className="ml-3 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
                      >
                        Top Up
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Result Display */}
              {generatedImage && (
                <div className="rounded-xl">
                  {generatedImage.imageUrl ? (
                    // Display image if available
                    <>
                      <div className="relative w-full h-[400px] my-4">
                        <Image
                          src={generatedImage.imageUrl}
                          alt="Generated"
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        {!isMobile ? (
                          <ShareButton
                            imageUrl={generatedImage.imageUrl}
                            prompt={generatedImage.prompt}
                            shareId={
                              generatedImage.imageUrl
                                ?.split("/")
                                .pop()
                                ?.split(".")[0]
                            }
                            className="px-4 py-2 flex-1"
                          >
                            Share & Earn Points
                          </ShareButton>
                        ) : (
                          <TwitterShareButton
                            imageUrl={generatedImage.imageUrl}
                            prompt={generatedImage.prompt}
                            className="flex-1"
                          >
                            Share & Earn Points
                          </TwitterShareButton>
                        )}
                        <button
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = generatedImage.imageUrl!;
                            a.download = `banana-${Date.now()}.png`;
                            a.click();
                          }}
                          className="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          <Download className="size-5" />
                        </button>
                      </div>
                    </>
                  ) : generatedImage.response ? (
                    // Display text response
                    <div className="bg-[rgb(17,17,17)] p-4 rounded-lg border border-gray-600">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        AI Response:
                      </h3>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {generatedImage.response}
                      </div>
                    </div>
                  ) : null}
                  {/* 
              {generatedImage.pointsDeducted >= 0 && (
                <p className="text-gray-600 text-sm text-center mt-2">
                  {generatedImage.pointsDeducted} credits used
                </p>
              )} */}
                </div>
              )}
            </div>
          </>
        )}

        {/* Style Presets Section - Gallery Style - Moved to bottom */}
        {showPresets && (
          <div className="bg-[rgb(17,17,17)]/95 backdrop-blur-md rounded-2xl shadow-lg p-4 mt-4 border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                ✨ Choose a Style
              </h2>
              {/* <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-8 h-8 flex items-center justify-center text-gray-200 rounded-full transition-all hover:rotate-90"
              >
                <X className="w-4 h-4" />
              </button> */}
            </div>

            {/* Scrollable Gallery Grid - 2 columns with preview images */}
            <div className="pr-2">
              <div className="grid grid-cols-2 gap-3">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className="group relative bg-[rgb(17,17,17)] border-2 border-gray-700 hover:border-[rgb(245,210,60)] active:border-[rgb(245,210,60)] rounded-xl overflow-hidden transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    disabled={needToWaitForCredits}
                  >
                    {/* Preview Image Background */}
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {preset.previewImage ? (
                        <Image
                          src={preset.previewImage}
                          alt={preset.title}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover transition-all group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl drop-shadow-lg transform group-hover:scale-110 transition-transform">
                            {preset.emoji}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="p-2.5 bg-[rgb(17,17,17)]">
                      <div className="font-semibold text-sm text-white group-hover:text-[rgb(245,210,60)] transition-colors">
                        {preset.emoji} {preset.title}
                      </div>
                      <div className="text-xs text-gray-200 mt-0.5">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Custom Prompt Option with matching style */}
                <button
                  onClick={() => {
                    if (!isConnected) {
                      showToast(
                        "Please connect your wallet to use custom prompts",
                        "warning",
                        undefined,
                        false
                      );
                      return;
                    }

                    if (userCredits < CREDITS_PER_GENERATION) {
                      if (userCredits === 0) {
                        showToast(
                          "You need credits to generate images. Please top up first!",
                          "warning",
                          {
                            label: "Join ROZO OG",
                            onClick: () => router.push("/topup"),
                          },
                          false
                        );
                      } else {
                        showToast(
                          `Insufficient credits. You need ${CREDITS_PER_GENERATION} credits to use custom prompts.`,
                          "warning",
                          {
                            label: "Click to Topup",
                            onClick: () => router.push("/topup"),
                          },
                          false
                        );
                      }
                      return;
                    }

                    setCustomPrompt("");
                    setShowPresets(false);
                    setHasSelectedPreset(true);
                    setSelectedPreset(null);
                    const promptElement =
                      document.getElementById("prompt-input");
                    if (promptElement) {
                      promptElement.focus();
                    }
                  }}
                  className="group relative bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-transparent hover:border-purple-400 active:border-purple-500 rounded-xl overflow-hidden transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  // disabled={!isConnected}
                >
                  <div className="relative aspect-square flex items-center justify-center">
                    <Wand2 className="w-12 h-12 text-white drop-shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all" />
                  </div>
                  <div className="p-2.5 bg-[rgb(17,17,17)]">
                    <div className="font-semibold text-sm text-purple-300 group-hover:text-purple-500 transition-colors">
                      Custom Prompt
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Create your own
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          action={toast.action}
        />
      )}
    </div>
  );
}
