'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, ImageIcon, Sparkles, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { STYLE_PRESETS, StylePreset } from '@/constants/stylePresets';
import { pointsAPI, imageAPI } from '../lib/api';

interface GeneratedResult {
  imageUrl?: string;
  response?: string;
  prompt: string;
  pointsDeducted: number;
  wasFreeTrial: boolean;
}

const CREDITS_PER_GENERATION = 5;  // 5 credits per generation

export default function NanoBananaGenerator() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [generatedImage, setGeneratedImage] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'popular' | 'artistic' | 'fun' | 'product'>('popular');
  const [showPresets, setShowPresets] = useState(true);

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      await connect({ connector: injected() });
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet');
    }
  };

  // Load auth token and user data on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedAddress = localStorage.getItem('userAddress');
    if (token && savedAddress) {
      setAuthToken(token);
      fetchUserPoints(token);
      // If we have a saved address but wallet isn't connected, still show as authenticated
      if (!isConnected) {
        // User is authenticated but wallet not connected - this is ok
        console.log('User authenticated with saved token');
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
      
      console.log('🔏 [NanoBanana] Requesting wallet signature...');
      
      // Use real wallet signing
      const signature = await signMessageAsync({
        message,
      });
      
      console.log('✅ [NanoBanana] Signature obtained:', signature.substring(0, 20) + '...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_POINTS_API_URL || 'http://localhost:3001/points/api'}/auth/wallet/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.toLowerCase(),
          signature, // Now using real signature
          message,
          app_id: 'banana'
        }),
      });

      console.log('📡 [NanoBanana] Auth response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🎫 [NanoBanana] Auth successful, token received');
        setAuthToken(data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('rozo_token', data.token); // Also save as rozo_token for compatibility
        localStorage.setItem('userAddress', address.toLowerCase());
        await fetchUserPoints(data.token);
      } else {
        const errorData = await response.json();
        console.error('❌ [NanoBanana] Auth failed:', errorData);
      }
    } catch (err) {
      console.error('❌ [NanoBanana] Authentication failed:', err);
    }
  };

  const fetchUserPoints = async (token: string) => {
    try {
      // Get credits balance from the Banana Backend
      const { creditsAPI } = await import('../lib/api');
      const data = await creditsAPI.getBalance();
      setUserCredits(data.credits || 0);
      
      // Check generation history
      const historyData = await pointsAPI.getHistory();
      const hasGeneratedBefore = historyData.history?.some((item: any) => 
        item.reason === 'Image generation' || item.reason === 'Free trial generation'
      );
      setIsFirstGeneration(!hasGeneratedBefore);
    } catch (err) {
      console.error('Failed to fetch user points:', err);
    }
  };

  const compressImage = (dataUrl: string, maxWidth: number = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.8 quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check total count (existing + new)
    if (uploadedImages.length + files.length > 9) {
      setError(`Maximum 9 images allowed. You have ${uploadedImages.length} and are trying to add ${files.length} more.`);
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
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length === 0) return;
    
    // Check total count (existing + new)
    if (uploadedImages.length + files.length > 9) {
      setError(`Maximum 9 images allowed. You have ${uploadedImages.length} and are trying to add ${files.length} more.`);
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
    const promptElement = document.getElementById('prompt-input');
    if (promptElement) {
      promptElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      promptElement.focus();
    }
  };

  // Get presets for current category
  const currentPresets = STYLE_PRESETS.filter(p => p.category === selectedCategory);

  const handleGenerate = async () => {
    // Check if user is authenticated (either via wallet or saved token)
    if (!authToken && !isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!customPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (uploadedImages.length === 0) {
      setError('Please upload at least one image (0-9 images)');
      return;
    }

    // Check credits (skip for first generation)
    if (!isFirstGeneration && userCredits < CREDITS_PER_GENERATION) {
      setError(`Insufficient credits. You need ${CREDITS_PER_GENERATION} credits.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = authToken || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Please authenticate first');
      }

      // Use the imageAPI to generate image
      const data = await imageAPI.generate(customPrompt);
      
      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to generate response');
      }

      // The generate endpoint returns either text response or image URL
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }
      
      // Check for response content
      if (!data.response && !data.imageUrl) {
        throw new Error('No response generated from AI');
      }

      setGeneratedImage({
        imageUrl: data.imageUrl || null,
        response: data.response || null,
        prompt: customPrompt,
        pointsDeducted: data.metadata?.pointsDeducted || 0,
        wasFreeTrial: data.metadata?.wasFreeTrial || false
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl">Banana</span>
            </div>
            {isConnected ? (
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition-colors text-sm font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Style Presets Section - Mobile Optimized */}
        {showPresets && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">✨ Choose a Style</h2>
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                setCustomPrompt('');
                setShowPresets(false);
                const promptElement = document.getElementById('prompt-input');
                if (promptElement) {
                  promptElement.focus();
                }
              }}
              className="mt-3 w-full p-2.5 bg-gradient-to-r from-purple-50 to-blue-50 active:from-purple-100 active:to-blue-100 border border-purple-200 rounded-lg transition-all flex items-center justify-center gap-2"
              disabled={!isConnected}
            >
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Custom Prompt</span>
            </button>
          </div>
        )}

        {/* Generate Image Card - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Generate Image</h2>
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
                            const newImages = uploadedImages.filter((_, i) => i !== idx);
                            const newFiles = uploadedFiles.filter((_, i) => i !== idx);
                            setUploadedImages(newImages);
                            setUploadedFiles(newFiles);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {uploadedImages.length}/9 images uploaded
                  </p>
                </div>
              ) : (
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm mb-1">Tap to upload images</p>
                  <p className="text-gray-400 text-xs">Select 0-9 images (PNG, JPG up to 5MB each)</p>
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
              disabled={isLoading || !customPrompt.trim() || uploadedImages.length === 0 || !isConnected}
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
                      const a = document.createElement('a');
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
                  <h3 className="font-semibold text-gray-800 mb-2">AI Response:</h3>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {generatedImage.response}
                  </div>
                </div>
              ) : null}
              
              {generatedImage.pointsDeducted >= 0 && (
                <p className="text-gray-600 text-sm text-center mt-2">
                  {generatedImage.pointsDeducted} credits used
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}