// Style presets for NanoBanana Generator
export interface StylePreset {
  id: string;
  title: string;
  prompt: string;
  emoji: string;
  description: string;
  category: 'popular' | 'artistic' | 'fun' | 'product';
}

export const STYLE_PRESETS: StylePreset[] = [
  // Top 8 most popular and useful presets
  {
    id: '3d-figurine',
    title: '3D Figurine',
    prompt: 'Turn this photo into a character figure. Behind it, place a box with the character\'s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Set the scene indoors if possible',
    emoji: '🧍',
    description: '3D collectible figure',
    category: 'popular'
  },
  {
    id: 'cyberpunk',
    title: 'Cyberpunk',
    prompt: 'Transform the scene into a futuristic cyberpunk city with neon lights, holograms, and dystopian atmosphere',
    emoji: '🤖',
    description: 'Futuristic neon city',
    category: 'popular'
  },
  {
    id: 'anime-style',
    title: 'Anime',
    prompt: 'Transform this into anime/manga art style with characteristic large eyes, vibrant colors, and dynamic composition',
    emoji: '✨',
    description: 'Anime art style',
    category: 'popular'
  },
  {
    id: 'van-gogh',
    title: 'Van Gogh',
    prompt: 'Reimagine the photo in the style of Van Gogh\'s Starry Night with swirling brushstrokes and vibrant colors',
    emoji: '🌌',
    description: 'Starry Night style',
    category: 'artistic'
  },
  {
    id: 'pixar',
    title: 'Pixar 3D',
    prompt: 'Transform into a Pixar-style 3D animated character with exaggerated features and warm, friendly appearance',
    emoji: '🎬',
    description: 'Pixar animation',
    category: 'fun'
  },
  {
    id: 'plushie',
    title: 'Plushie',
    prompt: 'Turn into a cute, soft plushie doll with button eyes, soft fabric texture, and adorable proportions',
    emoji: '🧸',
    description: 'Cute toy doll',
    category: 'fun'
  },
  {
    id: 'soda-can',
    title: 'Soda Can',
    prompt: 'Design a soda can using this image as the main graphic, and show it in a professional product shot with reflections and condensation',
    emoji: '🥤',
    description: 'Product design',
    category: 'product'
  },
  {
    id: 'poster',
    title: 'Poster',
    prompt: 'Transform into an epic movie poster with dramatic lighting, cinematic composition, and film title treatment',
    emoji: '🎥',
    description: 'Movie poster',
    category: 'product'
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