import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FOLIAGE_COUNT, TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';
import { getRandomSpherePoint, getConePoint } from '../utils/geometry';

const FoliageShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uProgress; // 0 = Scatter, 1 = Tree
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    varying vec3 vColor;

    // Cubic ease out for luxurious motion
    float easeOutCubic(float x) {
      return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      float t = easeOutCubic(uProgress);
      
      // Interpolate position
      vec3 pos = mix(aScatterPos, aTreePos, t);
      
      // Add subtle noise/wind movement when in tree form
      if (t > 0.8) {
        float noise = sin(uTime * 2.0 + pos.y) * 0.05;
        pos.x += noise;
        pos.z += noise;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Size attenuation
      gl_PointSize = (6.0 * aRandom + 2.0) * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;

      // Color mixing: Deep Emerald to Lighter Green
      vec3 c1 = vec3(${COLORS.emerald.r}, ${COLORS.emerald.g}, ${COLORS.emerald.b});
      vec3 c2 = vec3(${COLORS.darkGreen.r}, ${COLORS.darkGreen.g}, ${COLORS.darkGreen.b});
      vColor = mix(c1, c2, aRandom);
      
      // Add gold sparkles rarely
      if (aRandom > 0.95) {
        vColor = vec3(${COLORS.gold.r}, ${COLORS.gold.g}, ${COLORS.gold.b});
      }
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      // Circle shape
      vec2 coord = gl_PointCoord - vec2(0.5);
      if(length(coord) > 0.5) discard;
      
      gl_FragColor = vec4(vColor, 1.0);
    }
  `
};

interface FoliageProps {
  progress: number;
}

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate data once
  const { scatter, tree, randoms } = useMemo(() => {
    const sArr = new Float32Array(FOLIAGE_COUNT * 3);
    const tArr = new Float32Array(FOLIAGE_COUNT * 3);
    const rArr = new Float32Array(FOLIAGE_COUNT);

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      const s = getRandomSpherePoint(25);
      const t = getConePoint(TREE_HEIGHT, TREE_RADIUS, 1);

      sArr[i*3] = s[0]; sArr[i*3+1] = s[1]; sArr[i*3+2] = s[2];
      tArr[i*3] = t[0]; tArr[i*3+1] = t[1]; tArr[i*3+2] = t[2];
      rArr[i] = Math.random();
    }

    return { scatter: sArr, tree: tArr, randoms: rArr };
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uProgress.value = progress;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={FOLIAGE_COUNT} array={tree} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={FOLIAGE_COUNT} array={scatter} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={FOLIAGE_COUNT} array={tree} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={FOLIAGE_COUNT} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={FoliageShader.vertexShader}
        fragmentShader={FoliageShader.fragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 }
        }}
        transparent
        depthWrite={false}
      />
    </points>
  );
};