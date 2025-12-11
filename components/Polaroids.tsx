import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_HEIGHT, TREE_RADIUS } from '../constants';
import { getRandomSpherePoint } from '../utils/geometry';
import { useStore } from '../store';

interface SinglePolaroidProps {
  url: string;
  index: number;
  progress: number; // 0 (chaos) to 1 (formed)
}

const SinglePolaroid: React.FC<SinglePolaroidProps> = ({ url, index, progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { focusedIndex, morphState } = useStore();
  const isFocused = morphState === 'FOCUS' && focusedIndex === index;
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  // Robust texture loading
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
        url,
        (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            setTexture(tex);
        },
        undefined,
        (err) => {
            console.warn(`Failed to load polaroid image ${url}`, err);
        }
    );
  }, [url]);
  
  // Calculate stable positions once
  const positions = useMemo(() => {
    const chaos = getRandomSpherePoint(20);
    
    // Custom target calculation to avoid the top of the tree (Star Zone)
    // We restrict the height (y) to the bottom 80% of the tree
    const h = TREE_HEIGHT;
    const yMax = h * 0.80; 
    const y = Math.random() * yMax; 
    
    // Calculate radius at this height based on full tree slope to ensure they follow cone shape
    // (TREE_RADIUS + 2) to maintain the "floating" aesthetic outside the main branches
    const rMax = ((TREE_RADIUS + 2) * (h - y)) / h;
    
    // Random placement within that radius slice
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * rMax;
    
    const target: [number, number, number] = [
        Math.cos(angle) * r,
        y - (h / 2) + 2, // Keep the original yOffset logic
        Math.sin(angle) * r
    ];
    
    return { chaos, target };
  }, []);

  useFrame((stateThree, delta) => {
    if (!groupRef.current) return;
    
    const floatY = Math.sin(stateThree.clock.elapsedTime + index) * 0.1;
    const easedT = 1 - Math.pow(1 - progress, 3); // Cubic ease

    // Base Position (Chaos <-> Formed)
    let targetX = THREE.MathUtils.lerp(positions.chaos[0], positions.target[0], easedT);
    let targetY = THREE.MathUtils.lerp(positions.chaos[1], positions.target[1] + floatY, easedT);
    let targetZ = THREE.MathUtils.lerp(positions.chaos[2], positions.target[2], easedT);
    
    let targetScale = 1.2;

    // Focus Overrides
    if (morphState === 'FOCUS') {
      if (isFocused) {
        // Move to center camera view
        targetX = 0;
        targetY = 2; // Match camera height approx
        targetZ = 12; // Very close to camera (camera is at 18/22)
        targetScale = 4.0;
      } else {
        targetScale = 0; // Shrink others
      }
    }

    // Apply Lerps for smooth transition
    const lerpSpeed = delta * 4;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, lerpSpeed);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, lerpSpeed);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, lerpSpeed);
    
    const currentScale = groupRef.current.scale.x;
    const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, lerpSpeed);
    groupRef.current.scale.setScalar(nextScale);

    // Rotation logic
    if (isFocused) {
       // Face camera perfectly
       groupRef.current.lookAt(stateThree.camera.position);
    } else if (progress > 0.5) {
        // Face outwards from center
        groupRef.current.lookAt(0, groupRef.current.position.y, 0);
        groupRef.current.rotateY(Math.PI); // Correct orientation
    } else {
        // Spin slowly in chaos
        groupRef.current.rotation.x = stateThree.clock.elapsedTime * 0.5;
        groupRef.current.rotation.z = stateThree.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={1.2}>
      {/* White Border */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.2, 1.5]} />
        <meshBasicMaterial color="#fffff0" side={THREE.DoubleSide} />
      </mesh>
      {/* Photo Surface */}
      <mesh position={[0, 0.1, 0.01]}>
        <planeGeometry args={[1, 1]} />
        {texture ? (
            <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        ) : (
            <meshBasicMaterial color="#222" />
        )}
      </mesh>
    </group>
  );
};

export const Polaroids: React.FC<{ progress: number }> = ({ progress }) => {
  const { photos } = useStore();
  
  return (
    <group>
      {photos.map((url, i) => (
        <SinglePolaroid key={url} index={i} url={url} progress={progress} />
      ))}
    </group>
  );
};