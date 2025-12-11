import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TREE_HEIGHT, TREE_RADIUS, COLORS } from '../constants';
import { getRandomSpherePoint, getConeSurfacePoint } from '../utils/geometry';

interface OrnamentProps {
  progress: number;
}

// Reusable batch component
const OrnamentBatch: React.FC<{ 
  geometryType: 'sphere' | 'box', 
  count: number, 
  progress: number,
  baseScale: number,
  colors: THREE.Color[],
  material: React.ReactNode
}> = ({ geometryType, count, progress, baseScale, colors, material }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();

  const data = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      // Pick random color from provided palette
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        scatter: getRandomSpherePoint(30),
        // Place on surface with slight random push in/out
        tree: getConeSurfacePoint(TREE_HEIGHT, TREE_RADIUS * 1.05, 1),
        rotationSpeed: Math.random() * 0.02,
        // Scale variation
        scale: (Math.random() * 0.4 + 0.8) * baseScale, 
        color: color
      };
    });
  }, [count, baseScale, colors]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = 1 - Math.pow(1 - progress, 3); // Cubic ease

    data.forEach((d, i) => {
      // Position Lerp
      const x = THREE.MathUtils.lerp(d.scatter[0], d.tree[0], t);
      const y = THREE.MathUtils.lerp(d.scatter[1], d.tree[1], t);
      const z = THREE.MathUtils.lerp(d.scatter[2], d.tree[2], t);

      tempObject.position.set(x, y, z);
      
      // Rotation
      tempObject.rotation.x = state.clock.elapsedTime * d.rotationSpeed + i;
      tempObject.rotation.y = state.clock.elapsedTime * d.rotationSpeed + i;
      
      // Scale pop
      const scalePop = t > 0.9 ? 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.05 : 1;
      tempObject.scale.setScalar(d.scale * scalePop);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, d.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {geometryType === 'sphere' ? <sphereGeometry args={[1, 32, 32]} /> : <boxGeometry args={[1, 1, 1]} />}
      {material}
    </instancedMesh>
  );
};

export const Ornaments: React.FC<OrnamentProps> = ({ progress }) => {
  // 1. Molten Gold: Super High Metalness + Heat (Emissive)
  const moltenGoldMaterial = (
    <meshStandardMaterial 
      metalness={1.0} 
      roughness={0.05} 
      emissive={COLORS.gold}
      emissiveIntensity={0.6} // Glowing hot gold
      envMapIntensity={4.5}   // Strong reflections
      color={COLORS.gold} 
    />
  );

  // 2. Crystal Emerald: Metallic Glass Gemstone look
  const crystalEmeraldMaterial = (
    <meshPhysicalMaterial 
      color={COLORS.emerald}
      metalness={0.4}       // Increased metalness for metallic glass shine
      roughness={0.0}       // Perfectly smooth
      transmission={0.4}    // Semitransparent
      thickness={1.5}
      ior={1.6}             // High IOR for gem-like refraction
      clearcoat={1.0}
      emissive={COLORS.emerald} 
      emissiveIntensity={1.5}   // Strong internal glow
      envMapIntensity={5.0}     // High reflections
    />
  );

  // 3. Candy Red: Metallic Lacquer (Anodized look)
  const candyRedMaterial = (
    <meshPhysicalMaterial 
      color={COLORS.ruby}
      metalness={0.8}       // High metalness for foil/anodized look
      roughness={0.1}       // Very smooth
      clearcoat={1.0}
      clearcoatRoughness={0.05}
      emissive={COLORS.ruby}
      emissiveIntensity={0.4}
      envMapIntensity={3.5}
    />
  );

  return (
    <group>
      {/* --- MOLTEN GOLD MIX --- */}
      <OrnamentBatch 
        geometryType="sphere" 
        count={260} 
        progress={progress} 
        baseScale={0.35} 
        colors={[COLORS.gold, COLORS.neonGold]} 
        material={moltenGoldMaterial} 
      />
      {/* Big Gold Boxes */}
      <OrnamentBatch 
        geometryType="box" 
        count={90} 
        progress={progress} 
        baseScale={0.7} 
        colors={[COLORS.gold]} 
        material={moltenGoldMaterial} 
      />
       {/* Small Gold Boxes */}
      <OrnamentBatch 
        geometryType="box" 
        count={140} 
        progress={progress} 
        baseScale={0.25} 
        colors={[COLORS.gold]} 
        material={moltenGoldMaterial} 
      />

      {/* --- CRYSTAL EMERALD MIX --- */}
      {/* Green Spheres - Gems */}
      <OrnamentBatch 
        geometryType="sphere" 
        count={320} 
        progress={progress} 
        baseScale={0.4} 
        colors={[COLORS.emerald]} 
        material={crystalEmeraldMaterial} 
      />
      {/* Big Green Boxes - Glass Gifts */}
      <OrnamentBatch 
        geometryType="box" 
        count={70} 
        progress={progress} 
        baseScale={0.75} 
        colors={[COLORS.emerald]} 
        material={crystalEmeraldMaterial} 
      />
      {/* Small Green Boxes */}
      <OrnamentBatch 
        geometryType="box" 
        count={180} 
        progress={progress} 
        baseScale={0.25} 
        colors={[COLORS.emerald]} 
        material={crystalEmeraldMaterial} 
      />

      {/* --- CANDY RED MIX --- */}
      {/* Big Red Boxes - Main Gifts */}
      <OrnamentBatch 
        geometryType="box" 
        count={100} 
        progress={progress} 
        baseScale={0.8} 
        colors={[COLORS.ruby]} 
        material={candyRedMaterial} 
      />
      {/* Small Red Boxes */}
      <OrnamentBatch 
        geometryType="box" 
        count={140} 
        progress={progress} 
        baseScale={0.3} 
        colors={[COLORS.ruby]} 
        material={candyRedMaterial} 
      />
      {/* Red Spheres - Baubles */}
      <OrnamentBatch 
        geometryType="sphere" 
        count={90} 
        progress={progress} 
        baseScale={0.3} 
        colors={[COLORS.ruby]} 
        material={candyRedMaterial} 
      />
    </group>
  );
};