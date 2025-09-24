import { NextRequest, NextResponse } from 'next/server';
import { imageAPI } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    console.log('Fetching image with ID:', id);
    
    // Try to fetch the image from your API
    const response = await imageAPI.getHistory(1, 100);
    console.log('API response:', response);
    
    if (response.images && Array.isArray(response.images)) {
      const image = response.images.find((img: any) => img.id === id);
      
      if (image) {
        console.log('Found image:', image);
        return NextResponse.json(image);
      }
    }
    
    // If not found, return a mock response for demo
    console.log('Image not found in API, returning mock data');
    return NextResponse.json({
      id: id,
      image_url: `https://eslabobvkchgpokxszwv.supabase.co/storage/v1/object/public/banana-images/${id}.png`,
      prompt: "AI-generated image created with ROZO Banana",
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch image:', error);
    // Return mock data even on error
    return NextResponse.json({
      id: id,
      image_url: `https://eslabobvkchgpokxszwv.supabase.co/storage/v1/object/public/banana-images/${id}.png`,
      prompt: "AI-generated image created with ROZO Banana",
      created_at: new Date().toISOString(),
    });
  }
}
