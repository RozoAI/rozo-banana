'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

interface GeneratedResult {
  imageUrl?: string;
  response?: string;
  prompt: string;
  pointsDeducted: number;
  wasFreeTrial: boolean;
}

const POINTS_PER_GENERATION = 5;  // 5 points per generation (first one free)

export default function NanoBananaGenerator() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address.toLowerCase(),
          signature: 'simulated-signature',
          message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userAddress', address.toLowerCase());
        await fetchUserPoints(data.token);
      }
    } catch (err) {
      console.error('Authentication failed:', err);
    }
  };

  const fetchUserPoints = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/points/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.available_points || 0);
        
        // Check generation history
        const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/points/history`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const hasGeneratedBefore = historyData.history?.some((item: any) => 
            item.reason === 'Image generation' || item.reason === 'Free trial generation'
          );
          setIsFirstGeneration(!hasGeneratedBefore);
        }
      }
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
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalDataUrl = reader.result as string;
        // Compress image if it's too large
        const compressedDataUrl = await compressImage(originalDataUrl);
        setUploadedImage(compressedDataUrl);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalDataUrl = reader.result as string;
        // Compress image if it's too large
        const compressedDataUrl = await compressImage(originalDataUrl);
        setUploadedImage(compressedDataUrl);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

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

    if (!uploadedImage) {
      setError('Please upload an image');
      return;
    }

    // Check points (skip for first generation)
    if (!isFirstGeneration && userPoints < POINTS_PER_GENERATION) {
      setError(`Insufficient points. You need ${POINTS_PER_GENERATION} points.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = authToken || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Please authenticate first');
      }

      // Use the generate endpoint with Gemini model
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/generate/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: customPrompt,
          model: 'google/gemini-2.5-flash-image-preview',  // Only use this model
          baseImage: uploadedImage  // Include the uploaded image for analysis
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response');
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

      // Update points
      if (data.metadata?.pointsRemaining !== undefined) {
        setUserPoints(data.metadata.pointsRemaining);
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
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍌</span>
            <h1 className="text-xl font-semibold text-gray-800">Banana</h1>
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
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Generate Image Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate Image</h2>
          
          {/* Custom Prompt Input */}
          <div className="mb-6">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Generate a image with a pig with bikini"
              className="w-full px-4 py-3 border-2 border-yellow-400 rounded-xl focus:outline-none focus:border-yellow-500 resize-none text-gray-700 placeholder-gray-400"
              rows={3}
              disabled={!isConnected}
            />
          </div>

          {/* Image Upload Area */}
          <div className="mb-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-yellow-400 transition-colors cursor-pointer bg-gray-50"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={!isConnected}
              />
              
              {uploadedImage ? (
                <div className="relative w-full h-64">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded"
                    fill
                    className="object-contain"
                  />
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadedFile(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
                </label>
              )}
            </div>
          </div>

          {/* Cost and Generate Button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                Cost: {POINTS_PER_GENERATION} points
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Balance: {userPoints} pts
              </p>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !customPrompt.trim() || !uploadedImage || !isConnected}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-xl hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
                  {generatedImage.pointsDeducted} points used
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}