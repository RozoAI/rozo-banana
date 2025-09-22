'use client';

import { AlertCircle, Copy, Download, Loader2, Sparkles, Upload, Wallet } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { imageAPI, pointsAPI } from '../lib/api';

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: string;
  pointsDeducted: number;
  wasFreeTrial: boolean;
}

interface UserPoints {
  balance: number;
  history: any[];
}

const POINTS_PER_GENERATION = 10;

export default function BananaImageGenerator() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Image generation options
  const [selectedModel, setSelectedModel] = useState('openai/dall-e-3');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageQuality, setImageQuality] = useState('standard');
  const [imageStyle, setImageStyle] = useState('vivid');

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      await connect({ connector: injected() });
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet');
    }
  };

  // Authenticate and get user info
  useEffect(() => {
    if (isConnected && address) {
      authenticateUser();
    }
  }, [isConnected, address]);

  const authenticateUser = async () => {
    if (!address) return;

    try {
      // Sign message for authentication
      const message = `Sign this message to authenticate with Banana Image Generator\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      
      // In a real implementation, you would sign the message with the wallet
      // For now, we'll simulate authentication
      const response = await fetch(`${process.env.NEXT_PUBLIC_BANANA_API_URL || 'http://localhost:3000'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address.toLowerCase(),
          signature: 'simulated-signature', // In production, use actual signature
          message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        localStorage.setItem('authToken', data.token);
        
        // Get user points
        await fetchUserPoints(data.token);
      }
    } catch (err) {
      console.error('Authentication failed:', err);
    }
  };

  const fetchUserPoints = async (token: string) => {
    try {
      const data = await pointsAPI.getBalance();
      setUserPoints(data.available_points || 0);
      
      // Check if user has generated images before
      const historyData = await pointsAPI.getHistory();
      const hasGeneratedBefore = historyData.history?.some((item: any) => 
        item.reason === 'Image generation' || item.reason === 'Free trial generation'
      );
      setIsFirstGeneration(!hasGeneratedBefore);
    } catch (err) {
      console.error('Failed to fetch user points:', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt describing what you want to generate');
      return;
    }

    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    // Check if user has enough points (skip for first generation)
    if (!isFirstGeneration && userPoints < POINTS_PER_GENERATION) {
      setError(`Insufficient points. You need ${POINTS_PER_GENERATION} points to generate an image. You have ${userPoints} points.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = authToken || localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Please authenticate first');
      }

      const data = await imageAPI.generate({
        prompt: prompt,
        images: [uploadedImage],
        style: imageStyle,
        aspect_ratio: imageSize,
      });
      
      if (!data || data.error) {
        throw new Error(data?.error || 'Failed to generate image');
      }

      setGeneratedImage({
        url: data.imageUrl,
        prompt: data.prompt,
        timestamp: data.metadata?.timestamp || new Date().toISOString(),
        pointsDeducted: data.metadata?.pointsDeducted || 0,
        wasFreeTrial: data.metadata?.wasFreeTrial || false
      });

      // Update user points
      if (data.metadata?.pointsRemaining !== undefined) {
        setUserPoints(data.metadata.pointsRemaining);
      }

      // Update first generation flag
      if (data.metadata?.wasFreeTrial) {
        setIsFirstGeneration(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `banana-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleCopyPrompt = () => {
    if (generatedImage) {
      navigator.clipboard.writeText(generatedImage.prompt);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Wallet Connection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="w-8 h-8 text-yellow-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Nano Banana Generator</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {isConnected && (
                <div className="bg-yellow-100 px-4 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">Points: </span>
                  <span className="font-bold text-gray-800">{userPoints}</span>
                  {isFirstGeneration && (
                    <span className="ml-2 text-xs text-green-600 font-semibold">First Free!</span>
                  )}
                </div>
              )}
              
              {isConnected ? (
                <button
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </button>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={!isConnected}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploadedImage ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded"
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {isConnected ? 'Click to upload image' : 'Connect wallet to upload'}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe any transformation you can imagine. Your creativity is the only limit!"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                  rows={4}
                  disabled={!isConnected}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    disabled={!isConnected}
                  >
                    <option value="openai/dall-e-3">DALL-E 3</option>
                    <option value="openai/dall-e-2">DALL-E 2</option>
                    <option value="stabilityai/stable-diffusion-xl-1024-v1-0">Stable Diffusion XL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    disabled={!isConnected}
                  >
                    <option value="1024x1024">1024x1024</option>
                    <option value="1792x1024">1792x1024</option>
                    <option value="1024x1792">1024x1792</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim() || !uploadedImage || !isConnected}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isFirstGeneration ? 'Generate (Free Trial)' : `Generate (${POINTS_PER_GENERATION} Points)`}
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!isConnected && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  <p className="text-sm">Connect your wallet to start generating images. First generation is free!</p>
                </div>
              )}
            </div>

            {/* Output Section */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                {generatedImage ? (
                  <div className="w-full">
                    <div className="relative w-full h-96 mb-4">
                      <Image
                        src={generatedImage.url}
                        alt="Generated"
                        fill
                        className="object-contain rounded"
                      />
                    </div>
                    
                    {generatedImage.wasFreeTrial && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mb-3 text-sm">
                        This was your free trial generation! 
                      </div>
                    )}
                    
                    {generatedImage.pointsDeducted > 0 && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg mb-3 text-sm">
                        {generatedImage.pointsDeducted} points used
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                      <button
                        onClick={handleCopyPrompt}
                        className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Prompt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your generated image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}