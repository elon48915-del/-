import { create } from 'zustand';
import { TreeMorphState } from './types';
import { PICSUM_URLS } from './constants';

interface AppState {
  morphState: TreeMorphState;
  focusedIndex: number | null;
  handRotation: [number, number]; // x, y normalized -1 to 1
  photos: string[];
  
  setTreeState: (state: TreeMorphState) => void;
  setFocusedIndex: (index: number | null) => void;
  setHandRotation: (x: number, y: number) => void;
  toggleState: () => void;
  
  // New actions
  addUserPhoto: (url: string) => void;
}

export const useStore = create<AppState>((set) => ({
  morphState: 'TREE_SHAPE',
  focusedIndex: null,
  handRotation: [0, 0],
  photos: [...PICSUM_URLS], // Initialize with default seeds

  setTreeState: (morphState) => set({ morphState }),
  setFocusedIndex: (focusedIndex) => set({ focusedIndex }),
  setHandRotation: (x, y) => set({ handRotation: [x, y] }),
  toggleState: () => set((state) => ({ 
    morphState: state.morphState === 'TREE_SHAPE' ? 'SCATTERED' : 'TREE_SHAPE' 
  })),

  addUserPhoto: (url) => set((state) => {
    // Replace a random photo or the first one with the new user upload
    // We create a new array to trigger re-renders
    const newPhotos = [...state.photos];
    // Shift the array: remove first, push new to end (or unshift to front)
    newPhotos.shift();
    newPhotos.push(url);
    return { photos: newPhotos };
  }),
}));