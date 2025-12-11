import React, { useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { useStore } from '../store';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { POLAROID_COUNT } from '../constants';

export const WebcamFeed: React.FC = () => {
  return (
    <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-[-1]">
      <Webcam 
        id="webcam"
        audio={false}
        className="w-full h-full object-cover"
        width={320}
        height={240}
        videoConstraints={{
          facingMode: "user",
          width: 320,
          height: 240
        }}
      />
    </div>
  );
};

export const InteractionHandler: React.FC = () => {
  const { setTreeState, setHandRotation, setFocusedIndex } = useStore();
  const lastVideoTimeRef = useRef(-1);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  // Helper to calculate distance between two 3D points
  const distance = (p1: { x: number, y: number, z: number }, p2: { x: number, y: number, z: number }) => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow(p1.z - p2.z, 2)
    );
  };

  useEffect(() => {
    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    setupMediaPipe();
  }, []);

  const processVideo = () => {
    const video = document.getElementById('webcam') as HTMLVideoElement;
    if (video && video.readyState >= 2 && handLandmarkerRef.current) {
       if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
          
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // 1. Calculate Hand Center for Rotation (using Middle Finger MCP - Index 9)
            // Normalized x, y are 0-1.
            const xRaw = landmarks[9].x;
            const yRaw = landmarks[9].y;
            
            // Map 0..1 to -1..1
            // Invert X because webcam is mirrored (scale-x-100 usually), 
            // moving hand right in world moves it left on screen if mirrored.
            // But here we want standard interaction: Hand Right -> xPos > 0
            const xPos = (xRaw - 0.5) * 2; 
            const yPos = -(yRaw - 0.5) * 2; // Invert Y so moving up is positive
            
            setHandRotation(xPos * -1, yPos); 

            // 2. Gesture Recognition
            const wrist = landmarks[0];
            const middleMCP = landmarks[9];
            
            // Calculate Hand Size (Wrist to Middle MCP) for scale invariance
            const handSize = distance(wrist, middleMCP);

            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            
            // Pinch Detection (Thumb + Index)
            const pinchDist = distance(thumbTip, indexTip);
            
            // Open Hand vs Fist logic
            // Calculate average extension of fingertips relative to wrist
            const tipIndices = [8, 12, 16, 20];
            let avgTipDist = 0;
            tipIndices.forEach(i => {
                avgTipDist += distance(landmarks[i], wrist);
            });
            avgTipDist /= 4;

            // Ratios relative to hand size
            // Pinch: Tips are very close compared to hand size
            const PINCH_RATIO = 0.3; 
            // Open: Tips are extended far (usually > 1.5x the palm length)
            const OPEN_RATIO = 1.6;

            const isPinch = pinchDist < (handSize * PINCH_RATIO);
            const isOpen = (avgTipDist / handSize) > OPEN_RATIO;

            if (isPinch) {
              setTreeState('FOCUS');
              // Only pick a new index if we don't have one, to avoid flickering
              if (useStore.getState().focusedIndex === null) {
                 const rndIndex = Math.floor(Math.random() * POLAROID_COUNT);
                 setFocusedIndex(rndIndex);
              }
            } else if (isOpen) {
              setTreeState('SCATTERED'); // Open Hand -> Scatter
              setFocusedIndex(null);
            } else {
              setTreeState('TREE_SHAPE'); // Fist / Default -> Tree
              setFocusedIndex(null);
            }
          }
       }
    }
    requestRef.current = requestAnimationFrame(processVideo);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(processVideo);
    return () => cancelAnimationFrame(requestRef.current);
  }, [setTreeState, setHandRotation, setFocusedIndex]);

  return null;
};
