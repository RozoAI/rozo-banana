// Style presets for NanoBanana Generator
export interface StylePreset {
  id: string;
  title: string;
  prompt: string;
  emoji: string;
  description: string;
  category: 'popular' | 'artistic' | 'fun' | 'product';
  previewImage?: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  // 8 categories matching ROZO Bananary
  {
    id: '3d-figurine',
    title: '3D Figurine',
    prompt: 'Turn this photo into a character figure. Behind it, place a box with the character\'s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Set the scene indoors if possible',
    emoji: '🧍',
    description: '3D collectible figure',
    category: 'popular',
    previewImage: '/styles/3d-figurine.png'
  },
  {
    id: 'cyberpunk',
    title: 'Cyberpunk',
    prompt: 'Transform the scene into a futuristic cyberpunk city with neon lights, holograms, and dystopian atmosphere',
    emoji: '🤖',
    description: 'Futuristic neon city',
    category: 'popular',
    previewImage: '/styles/cyberpunk.png'
  },
  {
    id: 'id-photo',
    title: 'ID Photo',
    prompt: 'Convert to a professional ID or passport photo with clean background and formal presentation',
    emoji: '📷',
    description: 'Professional ID photo',
    category: 'product',
    previewImage: '/styles/id-photo.png'
  },
  {
    id: 'van-gogh',
    title: 'Van Gogh Style',
    prompt: 'Reimagine the photo in the style of Van Gogh\'s Starry Night with swirling brushstrokes and vibrant colors',
    emoji: '🌌',
    description: 'Starry Night style',
    category: 'artistic',
    previewImage: '/styles/van-gogh.png'
  },
  {
    id: 'pose',
    title: 'Pose Reference',
    prompt: 'Apply the pose from the second image to the character in the first image. Render as a professional studio photograph.',
    emoji: '✨',
    description: 'Pose reference',
    category: 'artistic',
    previewImage: '/styles/anime.png'
  },
  {
    id: 'picture-together',
    title: 'Picture Together',
    prompt: 'Create a scene showing two people together in a friendly pose, ideal for couple photos or friendship moments',
    emoji: '👥',
    description: 'Two people scene',
    category: 'fun',
    previewImage: '/styles/picture-together.png'
  },
  {
    id: 'change-clothes',
    title: 'Change Clothes',
    prompt: 'Have the person from the first image wear the shirt/clothing from the second image. Make it look natural and well-fitted.',
    emoji: '👔',
    description: 'Outfit transformation',
    category: 'fun',
    previewImage: '/styles/change-clothes.png'
  }
];

// Get presets by category
export const getPresetsByCategory = (category: StylePreset['category']) => {
  return STYLE_PRESETS.filter(preset => preset.category === category);
};

// Get random presets
export const getRandomPresets = (count: number = 6) => {
  const shuffled = [...STYLE_PRESETS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};