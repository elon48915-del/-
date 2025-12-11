import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';
import { getRandomSpherePoint, getConePoint } from '../utils/geometry';

// A dense, glowing core of particles that looks like a hologram tree inside
export const ParticleCore: React.FC<{ progress: number }> = ({ progress }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const { chaos, target, colors, sizes } = useMemo(() => {
    const chaosArr = new Float32Array(PARTICLE_COUNT * 3);
    const targetArr = new Float32Array(PARTICLE_COUNT * 3);
    const colorsArr = new Float32Array(PARTICLE_COUNT * 3);
    const sizesArr = new Float32Array(PARTICLE_COUNT);

    const c1 = new THREE.Color(COLORS.gold);
    const c2 = new THREE.Color(COLORS.neonGold);
    const c3 = new THREE.Color(COLORS.brightYellow);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Chaos: Random sphere
      const cPos = getRandomSpherePoint(25);
      chaosArr[i * 3] = cPos[0];
      chaosArr[i * 3 + 1] = cPos[1];
      chaosArr[i * 3 + 2] = cPos[2];

      // Target: Dense inner core (slightly smaller radius than main tree)
      // We want them to form a "Ghost Tree" inside the ornaments
      const tPos = getConePoint(TREE_HEIGHT, TREE_RADIUS * 0.75, 1.5);
      targetArr[i * 3] = tPos[0];
      targetArr[i * 3 + 1] = tPos[1];
      targetArr[i * 3 + 2] = tPos[2];

      // Colors: Mostly Neon Gold/Yellow heat
      const rnd = Math.random();
      const col = rnd > 0.6 ? c1 : (rnd > 0.3 ? c2 : c3);
      colorsArr[i * 3] = col.r;
      colorsArr[i * 3 + 1] = col.g;
      colorsArr[i * 3 + 2] = col.b;

      // Sizes: Larger variation for glitter effect
      sizesArr[i] = Math.random() * 0.3 + 0.15;
    }

    return { chaos: chaosArr, target: targetArr, colors: colorsArr, sizes: sizesArr };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const mat = pointsRef.current.material as THREE.ShaderMaterial;
    if (mat.uniforms) {
        mat.uniforms.uProgress.value = progress;
        mat.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uProgress;
      attribute vec3 aChaos;
      attribute vec3 aTarget;
      attribute float aSize;
      attribute vec3 aColor;
      varying vec3 vColor;

      float easeOutQuint(float x) {
        return 1.0 - pow(1.0 - x, 5.0);
      }

      void main() {
        float t = easeOutQuint(uProgress);
        vec3 pos = mix(aChaos, aTarget, t);
        
        // Organic shimmer movement
        float twinkle = sin(uTime * 3.0 + pos.y * 5.0 + pos.x * 3.0);
        pos.y += twinkle * 0.08;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Distance attenuation
        gl_PointSize = aSize * (400.0 / -mvPosition.z) * (0.8 + 0.5 * twinkle);
        gl_Position = projectionMatrix * mvPosition;
        
        // Boost color brightness for bloom
        vColor = aColor * (1.5 + 0.8 * twinkle); 
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        // Soft glowing particle
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        
        // Intense core, soft edge
        float alpha = 1.0 - (dist * 2.0);
        alpha = pow(alpha, 3.0);

        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={target} itemSize={3} />
        <bufferAttribute attach="attributes-aChaos" count={PARTICLE_COUNT} array={chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={PARTICLE_COUNT} array={target} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={PARTICLE_COUNT} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
};