import * as THREE from 'three';

export const TREE_HEIGHT = 14;
export const TREE_RADIUS = 5.5;
export const FOLIAGE_COUNT = 15000;
export const ORNAMENT_COUNT = 800;
export const GIFT_COUNT = 100;
export const PARTICLE_COUNT = 12000; // Increased density for inner tree soul
export const POLAROID_COUNT = 26;

// Generate 26 unique seed URLs
export const PICSUM_URLS = Array.from({ length: POLAROID_COUNT }, (_, i) => 
  `https://picsum.photos/seed/arix_holiday_${i + 1}/400/500`
);

export const COLORS = {
  emerald: new THREE.Color('#004225'), // Deep Christmas Green
  morandi: new THREE.Color('#738F7A'), // Kept for reference, but we are using Crystal Emerald now
  darkGreen: new THREE.Color('#012015'),
  gold: new THREE.Color('#FFD700'),
  neonGold: new THREE.Color('#FFFACD'), // LemonChiffon/Neon Gold for Star/Emissive
  champagne: new THREE.Color('#F7E7CE'),
  ruby: new THREE.Color('#D70040'), // Richer Carmine Red
  black: new THREE.Color('#0a0a0a'),
  brightYellow: new THREE.Color('#FFFFE0'),
};

export const TRANSITION_DURATION = 2.5; // seconds