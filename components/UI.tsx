import React, { useState, useRef } from 'react';
import { useStore } from '../store';

export const UI = () => {
  const { addUserPhoto } = useStore();
  const [wish, setWish] = useState('');
  const [wishSent, setWishSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file as Blob);
        addUserPhoto(url);
      });
    }
  };

  const handleWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish.trim()) return;
    
    // Logic to "send" the wish (visual feedback only for now)
    setWishSent(true);
    setWish('');
    
    setTimeout(() => {
      setWishSent(false);
    }, 3000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
      
      {/* HEADER */}
      <div className="text-center pt-10">
        <h1 className="font-serif text-4xl md:text-6xl text-yellow-500 drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)] tracking-widest uppercase">
          Arix Signature
        </h1>
        <p className="font-serif text-gray-300 tracking-[0.3em] text-xs md:text-sm mt-2 opacity-80">
          The Luxury Holiday Collection
        </p>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="pointer-events-auto w-full pb-8 flex flex-col items-center justify-end gap-6 bg-gradient-to-t from-black/90 to-transparent">
        
        {/* CONTROL PANEL */}
        <div className="flex flex-col md:flex-row gap-6 items-center">
          
          {/* UPLOAD BUTTON */}
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
              multiple
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-black/60 border border-yellow-600/60 backdrop-blur-md text-yellow-100 font-serif tracking-widest hover:bg-yellow-900/30 transition-all duration-300 shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:shadow-[0_0_25px_rgba(255,215,0,0.3)]"
            >
              UPLOAD MEMORIES
            </button>
          </div>

          {/* WISH INPUT */}
          <form onSubmit={handleWishSubmit} className="flex relative">
            <input
              type="text"
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              placeholder="Make a wish..."
              className="w-64 bg-black/40 border-b border-yellow-600/50 text-yellow-100 font-serif px-4 py-3 outline-none placeholder-yellow-700/50 focus:border-yellow-400 transition-colors backdrop-blur-sm"
            />
            <button 
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-4 text-yellow-500 hover:text-yellow-200 transition-colors font-serif text-sm tracking-widest uppercase"
            >
              Send
            </button>
          </form>
        </div>

        {/* FEEDBACK MESSAGE */}
        <div className={`h-6 text-yellow-300 font-serif italic text-sm transition-opacity duration-1000 ${wishSent ? 'opacity-100' : 'opacity-0'}`}>
           ✨ Your wish has been sent to the stars ✨
        </div>

      </div>
    </div>
  );
};