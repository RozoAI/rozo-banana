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
  // Popular & Trending
  {
    id: '3d-figurine',
    title: '3D Figurine',
    prompt: 'Turn this photo into a character figure. Behind it, place a box with the character\'s image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Set the scene indoors if possible',
    emoji: '🧍',
    description: 'Collectible 3D figure with packaging',
    category: 'popular'
  },
  {
    id: 'cyberpunk',
    title: 'Cyberpunk',
    prompt: 'Transform the scene into a futuristic cyberpunk city with neon lights, holograms, and dystopian atmosphere',
    emoji: '🤖',
    description: 'Neon-drenched futuristic city',
    category: 'popular'
  },
  {
    id: 'anime-style',
    title: 'Anime Style',
    prompt: 'Transform this into anime/manga art style with characteristic large eyes, vibrant colors, and dynamic composition',
    emoji: '✨',
    description: 'Japanese anime art style',
    category: 'popular'
  },
  
  // Artistic Styles
  {
    id: 'van-gogh',
    title: 'Van Gogh Style',
    prompt: 'Reimagine the photo in the style of Van Gogh\'s Starry Night with swirling brushstrokes and vibrant colors',
    emoji: '🌌',
    description: 'Iconic swirling brushstrokes',
    category: 'artistic'
  },
  {
    id: 'oil-painting',
    title: 'Oil Painting',
    prompt: 'Transform into a classical oil painting with rich textures, dramatic lighting, and Renaissance-style composition',
    emoji: '🎨',
    description: 'Classical oil painting',
    category: 'artistic'
  },
  {
    id: 'watercolor',
    title: 'Watercolor',
    prompt: 'Convert to a delicate watercolor painting with soft edges, flowing colors, and paper texture',
    emoji: '🖌️',
    description: 'Soft watercolor painting',
    category: 'artistic'
  },
  
  // Fun & Creative
  {
    id: 'lego',
    title: 'LEGO Style',
    prompt: 'Transform into a LEGO minifigure or LEGO brick construction, showing the blocky, toy-like aesthetic',
    emoji: '🧱',
    description: 'LEGO brick construction',
    category: 'fun'
  },
  {
    id: 'pixar',
    title: 'Pixar Character',
    prompt: 'Transform into a Pixar-style 3D animated character with exaggerated features and warm, friendly appearance',
    emoji: '🎬',
    description: 'Pixar animation style',
    category: 'fun'
  },
  {
    id: 'cartoon',
    title: 'Cartoon',
    prompt: 'Turn into a fun cartoon character with bold outlines, bright colors, and exaggerated features',
    emoji: '🎭',
    description: 'Fun cartoon character',
    category: 'fun'
  },
  {
    id: 'plushie',
    title: 'Cute Plushie',
    prompt: 'Turn into a cute, soft plushie doll with button eyes, soft fabric texture, and adorable proportions',
    emoji: '🧸',
    description: 'Soft cuddly plushie toy',
    category: 'fun'
  },
  
  // Product & Design
  {
    id: 'soda-can',
    title: 'Soda Can Design',
    prompt: 'Design a soda can using this image as the main graphic, and show it in a professional product shot with reflections and condensation',
    emoji: '🥤',
    description: 'Product packaging design',
    category: 'product'
  },
  {
    id: 'poster',
    title: 'Movie Poster',
    prompt: 'Transform into an epic movie poster with dramatic lighting, cinematic composition, and film title treatment',
    emoji: '🎬',
    description: 'Cinematic movie poster',
    category: 'product'
  },
  {
    id: 'logo',
    title: 'Logo Design',
    prompt: 'Convert into a minimalist logo design with clean lines, professional look, and scalable vector style',
    emoji: '💎',
    description: 'Professional logo design',
    category: 'product'
  },
  {
    id: 'sticker',
    title: 'Sticker Design',
    prompt: 'Turn into a cute die-cut sticker design with white border, vibrant colors, and kawaii style',
    emoji: '🌟',
    description: 'Cute sticker design',
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