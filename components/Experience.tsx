import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Sparkles, Float, Extrude } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useStore } from '../store';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import { ParticleCore } from './ParticleCore';
import { Confetti } from './Confetti';
import { COLORS } from '../constants';
import { InteractionHandler, WebcamFeed } from './GestureControl';
import { createStarShape } from '../utils/geometry';

// Internal Error Boundary for Environment
interface EnvErrorBoundaryProps {
  children?: React.ReactNode;
}

interface EnvErrorBoundaryState {
  hasError: boolean;
}

class EnvErrorBoundary extends React.Component<EnvErrorBoundaryProps, EnvErrorBoundaryState> {
  state: EnvErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any) { console.warn("Environment HDRI failed to load, falling back to lights.", err); }
  render() { 
    if (this.state.hasError) return null;
    return (this as any).props.children; 
  }
}

const SceneContent = () => {
  const { morphState, handRotation } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  
  const progressRef = useRef(0);
  const targetProgress = morphState === 'SCATTERED' ? 0 : 1; 
  
  // Create Star Shape once
  const starShape = useMemo(() => createStarShape(1.2, 0.6, 5), []);
  const starSettings = useMemo(() => ({ depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }), []);

  useFrame((state, delta) => {
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetProgress, delta * 2);

    if (groupRef.current) {
        // Base slow rotation - luxury showcase speed
        const baseRotation = state.clock.elapsedTime * 0.05;
        
        // Hand interaction (Yaw)
        // DRASTICALLY REDUCED SENSITIVITY: Multiplied by 0.1 for very subtle, smooth control
        const targetRotY = baseRotation + (handRotation[0] * Math.PI * 0.1); 
        
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 2);
        
        // Strict upright
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 2);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 2);
    }
  });

  return (
    <>
      <OrbitControls 
        makeDefault 
        target={[0, 1, 0]} // Focus on the visual center of the tree
        minDistance={10} 
        maxDistance={40} 
        maxPolarAngle={Math.PI / 2} 
        enablePan={false}
        enableZoom={true}
        dampingFactor={0.05}
      />

      <group ref={groupRef}>
        <Foliage progress={progressRef.current} />
        <Ornaments progress={progressRef.current} />
        <ParticleCore progress={progressRef.current} />
        <Polaroids progress={progressRef.current} />
        <Confetti />
        
        {/* 3D Star Topper - Moved up to 8.6 */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
          <group position={[0, 8.6, 0]} scale={progressRef.current}>
             <Extrude args={[starShape, starSettings]} rotation={[0, 0, 0]}>
                <meshStandardMaterial 
                  color={COLORS.gold} 
                  emissive={COLORS.neonGold}
                  emissiveIntensity={2.0} // Very bright neon
                  metalness={1}
                  roughness={0}
                  toneMapped={false}
                />
             </Extrude>
             {/* Central point light for the star */}
             <pointLight distance={15} intensity={5} color={COLORS.gold} decay={2} />
          </group>
        </Float>
      </group>

      <Sparkles 
        count={300} 
        scale={15} 
        size={5} 
        speed={0.2} 
        opacity={0.8} 
        color={COLORS.neonGold}
      />
    </>
  );
};

export const Experience = () => {
  return (
    <div className="w-full h-full relative">
        <Canvas
        // Camera positioned at Y=1 (Tree Center) and Z=20 (Closer for filling screen)
        camera={{ position: [0, 1, 20], fov: 45 }}
        dpr={[1, 2]}
        gl={{ 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 1.0 
        }}
        >
        <color attach="background" args={['#000500']} />
        
        <SceneContent />

        {/* Cinematic Luxury Lighting */}
        <ambientLight intensity={0.4} color={COLORS.emerald} />
        
        {/* Main Key Light (Warm) */}
        <spotLight 
            position={[15, 20, 15]} 
            angle={0.6} 
            penumbra={1} 
            intensity={4} 
            color="#FFD700" 
            castShadow 
        />
        
        {/* Rim Light (Cool/Blue contrast) */}
        <spotLight position={[-15, 10, -10]} intensity={2} color="#E0FFFF" />
        
        {/* Back Light for Translucency (Crucial for Crystal Emerald) */}
        <rectAreaLight 
          width={10} 
          height={20} 
          color={COLORS.gold} 
          intensity={5} 
          position={[0, 5, -10]} 
          lookAt={new THREE.Vector3(0, 0, 0)} 
        />

        {/* Safe Environment Loading */}
        <EnvErrorBoundary>
            <Environment preset="sunset" />
        </EnvErrorBoundary>

        <EffectComposer disableNormalPass>
            <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.0} 
            radius={0.6}
            />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
            <Noise opacity={0.03} />
        </EffectComposer>
        </Canvas>
        <WebcamFeed />
        <InteractionHandler />
    </div>
  );
};
