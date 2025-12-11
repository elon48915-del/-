import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../constants';
import { useStore } from '../store';

const CONFETTI_COUNT = 300;

export const Confetti: React.FC = () => {
  const { morphState } = useStore();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [isActive, setIsActive] = useState(false);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Initialize particle data
  const particles = useMemo(() => {
    return new Array(CONFETTI_COUNT).fill(0).map(() => {
        const colorKeys = ['gold', 'emerald', 'ruby', 'neonGold'] as const;
        // Select random luxury color
        const cKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
        
        return {
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 16, // Spread X
                20 + Math.random() * 10,    // Start Y (above view)
                (Math.random() - 0.5) * 16  // Spread Z
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05, 
                -(Math.random() * 0.1 + 0.08), // Falling speed
                (Math.random() - 0.5) * 0.05
            ),
            rotation: new THREE.Euler(Math.random(), Math.random(), Math.random()),
            rotSpeed: new THREE.Vector3(
                Math.random() * 0.1,
                Math.random() * 0.1,
                Math.random() * 0.1
            ),
            color: COLORS[cKey],
            scale: Math.random() * 0.4 + 0.6
        };
    });
  }, []);

  useEffect(() => {
    if (morphState === 'TREE_SHAPE') {
        // Reset particles to top positions whenever tree forms
        particles.forEach(p => {
            p.position.set(
                (Math.random() - 0.5) * 12, 
                22 + Math.random() * 15, // Staggered heights above tree
                (Math.random() - 0.5) * 12
            );
            p.velocity.y = -(Math.random() * 0.1 + 0.08);
            // Randomize rotation again
            p.rotation.set(Math.random(), Math.random(), Math.random());
        });
        
        // Wait for tree to form (approx 2s) before raining confetti
        const timer = setTimeout(() => setIsActive(true), 2000);
        return () => clearTimeout(timer);
    } else {
        // Stop immediately if scattered
        setIsActive(false);
    }
  }, [morphState, particles]);

  useFrame(() => {
    if (!isActive || !meshRef.current) return;

    particles.forEach((p, i) => {
        // Apply physics
        p.position.add(p.velocity);
        p.rotation.x += p.rotSpeed.x;
        p.rotation.y += p.rotSpeed.y;
        p.rotation.z += p.rotSpeed.z;
        
        // Gentle sway
        p.position.x += Math.sin(p.position.y * 0.5) * 0.02;

        // Update instance
        dummy.position.copy(p.position);
        dummy.rotation.copy(p.rotation);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        meshRef.current!.setColorAt(i, p.color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });
  
  if (!isActive) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]}>
        <planeGeometry args={[0.12, 0.25]} />
        <meshStandardMaterial 
            side={THREE.DoubleSide} 
            metalness={0.9} 
            roughness={0.1} 
            emissive={new THREE.Color('#222222')}
        />
    </instancedMesh>
  );
};
