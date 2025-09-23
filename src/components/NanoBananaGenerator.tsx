"use client";

import { STYLE_PRESETS, StylePreset } from "@/constants/stylePresets";
import { ImageIcon, Loader2, Sparkles, Wand2 } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { injected } from "wagmi/connectors";
import { imageAPI, pointsAPI } from "../lib/api";

interface GeneratedResult {
  imageUrl?: string;
  response?: string;
  prompt: string;
  pointsDeducted: number;
  wasFreeTrial: boolean;
}

const CREDITS_PER_GENERATION = 5; // 5 credits per generation

export default function NanoBananaGenerator() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [customPrompt, setCustomPrompt] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [generatedImage, setGeneratedImage] = useState<GeneratedResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    "popular" | "artistic" | "fun" | "product"
  >("popular");
  const [showPresets, setShowPresets] = useState(true);
  const hasFetched = useRef(false);

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      await connect({ connector: injected() });
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect wallet");
    }
  };

  // Load auth token and user data on mount
  useEffect(() => {
    // Try to get token from multiple sources
    const token =
      localStorage.getItem("rozo_token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("authToken");
    const savedAddress = localStorage.getItem("userAddress");
    if (token) {
      console.log("🔑 [NanoBanana] Found existing token");
      setAuthToken(token);
      if (!hasFetched.current) {
        fetchUserPoints(token);
        hasFetched.current = true;
      }
      // If we have a saved address but wallet isn't connected, still show as authenticated
      if (!isConnected && savedAddress) {
        // User is authenticated but wallet not connected - this is ok
        console.log("User authenticated with saved token");
      }
    }
  }, []);

  // Authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !authToken) {
      authenticateUser();
    }
  }, [isConnected, address, authToken]);

  const authenticateUser = async () => {
    if (!address) return;

    try {
      const message = `Sign to authenticate with Nano Banana\nAddress: ${address}\nTimestamp: ${Date.now()}`;

      console.log("🔏 [NanoBanana] Requesting wallet signature...");

      // Use real wallet signing
      const signature = await signMessageAsync({
        message,
      });

      console.log(
        "✅ [NanoBanana] Signature obtained:",
        signature.substring(0, 20) + "..."
      );

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_POINTS_API_URL ||
          "http://localhost:3001/points/api"
        }/auth-wallet-verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: address.toLowerCase(),
            signature, // Now using real signature
            message,
            app_id: "banana",
          }),
        }
      );

      console.log("📡 [NanoBanana] Auth response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🎫 [NanoBanana] Auth successful, token received");
        setAuthToken(data.token);
        // Save token in all formats for compatibility
        localStorage.setItem("rozo_token", data.token);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userAddress", address.toLowerCase());
        await fetchUserPoints(data.token);
      } else {
        const errorData = await response.json();
        console.error("❌ [NanoBanana] Auth failed:", errorData);
      }
    } catch (err) {
      console.error("❌ [NanoBanana] Authentication failed:", err);
    }
  };

  const fetchUserPoints = async (token: string) => {
    try {
      // Ensure token is in localStorage for API interceptors
      if (!localStorage.getItem("rozo_token")) {
        localStorage.setItem("rozo_token", token);
      }

      // Get credits balance from the Banana Backend
      const { creditsAPI } = await import("../lib/api");
      const data = await creditsAPI.getBalance();
      console.log("💳 [NanoBanana] Credits response:", data);

      // Extract credits value from various possible response formats
      let creditsValue = 0;
      if (typeof data === "object" && data !== null) {
        // 1) Plain number fields
        if (typeof (data as any).available === "number") {
          creditsValue = (data as any).available;
        } else if (typeof (data as any).credits === "number") {
          creditsValue = (data as any).credits;
        // 2) Top-level object with nested available: { credits: { available: N } }
        } else if (
          (data as any).credits &&
          typeof (data as any).credits.available === "number"
        ) {
          creditsValue = (data as any).credits.available;
        // 3) Nested under data: { data: { credits: number | { available: number } } }
        } else if ((data as any).data?.credits) {
          if (typeof (data as any).data.credits === "number") {
            creditsValue = (data as any).data.credits;
          } else if (
            typeof (data as any).data.credits.available === "number"
          ) {
            creditsValue = (data as any).data.credits.available;
          }
        } else if (typeof (data as any).balance === "number") {
          creditsValue = (data as any).balance;
        }
      }

      setUserCredits(creditsValue);
      console.log("💰 [NanoBanana] Set credits to:", creditsValue);

      // Check generation history
      try {
        const historyData = await pointsAPI.getHistory();
        const hasGeneratedBefore = historyData.history?.some(
          (item: any) =>
            item.reason === "Image generation" ||
            item.reason === "Free trial generation"
        );
        setIsFirstGeneration(!hasGeneratedBefore);
      } catch (histErr) {
        console.log("⚠️ [NanoBanana] Could not fetch history:", histErr);
      }
    } catch (err) {
      console.error("Failed to fetch user points:", err);
    }
  };

  const compressImage = (
    dataUrl: string,
    maxWidth: number = 1024
  ): Promise<string> => {
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

        // Compress to JPEG with 0.8 quality
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Check total count (existing + new)
    if (uploadedImages.length + files.length > 9) {
      setError(
        `Maximum 9 images allowed. You have ${uploadedImages.length} and are trying to add ${files.length} more.`
      );
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" is too large. Max size is 5MB`);
        return;
      }
    }

    const newImages: string[] = [];
    const newFiles: File[] = [];

    for (const file of files) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = async () => {
          const originalDataUrl = reader.result as string;
          // Compress image if it's too large
          const compressedDataUrl = await compressImage(originalDataUrl);
          resolve(compressedDataUrl);
        };
        reader.readAsDataURL(file);
      });
      newImages.push(dataUrl);
      newFiles.push(file);
    }

    setUploadedImages([...uploadedImages, ...newImages]);
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setError(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length === 0) return;

    // Check total count (existing + new)
    if (uploadedImages.length + files.length > 9) {
      setError(
        `Maximum 9 images allowed. You have ${uploadedImages.length} and are trying to add ${files.length} more.`
      );
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image "${file.name}" is too large. Max size is 5MB`);
        return;
      }
    }

    const newImages: string[] = [];
    const newFiles: File[] = [];

    for (const file of files) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = async () => {
          const originalDataUrl = reader.result as string;
          // Compress image if it's too large
          const compressedDataUrl = await compressImage(originalDataUrl);
          resolve(compressedDataUrl);
        };
        reader.readAsDataURL(file);
      });
      newImages.push(dataUrl);
      newFiles.push(file);
    }

    setUploadedImages([...uploadedImages, ...newImages]);
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle preset selection
  const handlePresetSelect = (preset: StylePreset) => {
    setCustomPrompt(preset.prompt);
    setShowPresets(false);
    // Scroll to prompt input
    const promptElement = document.getElementById("prompt-input");
    if (promptElement) {
      promptElement.scrollIntoView({ behavior: "smooth", block: "center" });
      promptElement.focus();
    }
  };

  // Get presets for current category
  const currentPresets = STYLE_PRESETS.filter(
    (p) => p.category === selectedCategory
  );

  const handleGenerate = async () => {
    // Check if user is authenticated (either via wallet or saved token)
    if (!authToken && !isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    if (!customPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    if (uploadedImages.length === 0) {
      setError("Please upload at least one image (0-9 images)");
      return;
    }

    // Check credits (skip for first generation)
    if (!isFirstGeneration && userCredits < CREDITS_PER_GENERATION) {
      setError(
        `Insufficient credits. You need ${CREDITS_PER_GENERATION} credits.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try multiple token sources
      const token =
        authToken ||
        localStorage.getItem("rozo_token") ||
        localStorage.getItem("auth_token") ||
        localStorage.getItem("authToken");

      if (!token) {
        throw new Error("Please authenticate first");
      }

      // Use the imageAPI to generate image - pass prompt and images
      console.log("🎨 [Generate] Sending request with:", {
        prompt: customPrompt,
        imageCount: uploadedImages.length,
      });

      const data = await imageAPI.generate({
        prompt: customPrompt,
        images: uploadedImages, // Base64 encoded images
      });

      console.log("📦 [Generate] Response received:", data);

      if (!data || data.error) {
        throw new Error(
          data?.error || data?.message || "Failed to generate response"
        );
      }

      // The generate endpoint returns either text response or image URL
      if (!data.success && !data.response && !data.imageUrl && !data.data) {
        throw new Error(data.error || data.message || "Generation failed");
      }

      // Check for response content - handle different response formats
      if (
        !data.response &&
        !data.imageUrl &&
        !data.data?.response &&
        !data.data?.imageUrl &&
        !data.image?.dataUrl
      ) {
        console.error("❌ [Generate] No content in response:", data);
        throw new Error(
          "No response generated from AI. The backend may be experiencing issues."
        );
      }

      // Handle different response formats from backend
      const imageUrl = data.imageUrl || data.data?.imageUrl || data.image?.dataUrl || null;
      const response = data.response || data.data?.response || data.image?.prompt || null;

      setGeneratedImage({
        imageUrl: imageUrl,
        response: response,
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

      if (data.metadata?.wasFreeTrial) {
        setIsFirstGeneration(false);
      }
    } catch (err: any) {
      console.error("❌ [Generate] Error:", err);

      // Better error handling with more details
      let errorMessage = "An error occurred";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Add status code if available
      if (err.response?.status) {
        errorMessage = `Request failed with status code ${err.response.status}: ${errorMessage}`;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Header - matching Home page */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a
              href="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl text-black">Banana</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Style Presets Section - Mobile Optimized */}
        {showPresets && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">
                ✨ Choose a Style
              </h2>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
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

            {/* Preset Grid - 2 columns on mobile, no categories for simplicity */}
            <div className="grid grid-cols-2 gap-2">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="group p-3 bg-gray-50 active:bg-yellow-100 hover:bg-yellow-50 border-2 border-transparent hover:border-yellow-400 rounded-lg transition-all text-left"
                  disabled={!isConnected}
                >
                  <div className="text-2xl mb-1">{preset.emoji}</div>
                  <div className="font-medium text-sm text-gray-800 group-hover:text-yellow-600">
                    {preset.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Option */}
            <button
              onClick={() => {
                setCustomPrompt("");
                setShowPresets(false);
                const promptElement = document.getElementById("prompt-input");
                if (promptElement) {
                  promptElement.focus();
                }
              }}
              className="mt-3 w-full p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 active:from-purple-100 active:to-blue-100 border border-purple-200 rounded-lg transition-all flex items-center justify-center gap-2"
              disabled={!isConnected}
            >
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                Custom Prompt
              </span>
            </button>
          </div>
        )}

        {/* Generate Image Card - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">
              Generate Image
            </h2>
            {!showPresets && (
              <button
                onClick={() => setShowPresets(true)}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Styles →
              </button>
            )}
          </div>

          {/* Custom Prompt Input - Mobile Optimized */}
          <div className="mb-4">
            <textarea
              id="prompt-input"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full px-3 py-2.5 border-2 border-yellow-400 rounded-lg focus:outline-none focus:border-yellow-500 resize-none text-gray-700 placeholder-gray-400 text-sm"
              rows={2}
              disabled={!isConnected}
            />
            {customPrompt && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Upload an image to transform it
              </p>
            )}
          </div>

          {/* Image Upload Area - Mobile Optimized */}
          <div className="mb-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors cursor-pointer bg-gray-50"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={!isConnected}
              />

              {uploadedImages.length > 0 ? (
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
                            const newImages = uploadedImages.filter(
                              (_, i) => i !== idx
                            );
                            const newFiles = uploadedFiles.filter(
                              (_, i) => i !== idx
                            );
                            setUploadedImages(newImages);
                            setUploadedFiles(newFiles);
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
                    {uploadedImages.length < 9 && (
                      <label
                        htmlFor="image-upload"
                        className="relative aspect-square cursor-pointer"
                      >
                        <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                    {uploadedImages.length}/9 images uploaded
                  </p>
                </div>
              ) : (
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-1">
                    Tap to upload images
                  </p>
                  <p className="text-gray-400 text-xs">
                    Select 0-9 images (PNG, JPG up to 5MB each)
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Cost and Generate Button - Mobile Optimized */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                Cost: {CREDITS_PER_GENERATION} credits
              </p>
              <p className="text-gray-500 text-xs">
                Balance: {userCredits} credits
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={
                isLoading ||
                !customPrompt.trim() ||
                uploadedImages.length === 0 ||
                !isConnected
              }
              className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
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
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Generated Result Display */}
          {generatedImage && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              {generatedImage.imageUrl ? (
                // Display image if available
                <>
                  <div className="relative w-full h-96 mb-4">
                    <Image
                      src={generatedImage.imageUrl}
                      alt="Generated"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = generatedImage.imageUrl!;
                      a.download = `banana-${Date.now()}.png`;
                      a.click();
                    }}
                    className="w-full mt-3 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Download Image
                  </button>
                </>
              ) : generatedImage.response ? (
                // Display text response
                <div className="bg-white p-4 rounded-lg">
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
      </div>

    </div>
  );
}
