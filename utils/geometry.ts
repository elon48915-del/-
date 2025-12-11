import * as THREE from 'three';

// Random point inside a large sphere (Chaos)
export const getRandomSpherePoint = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Point inside a Cone volume (Tree)
export const getConePoint = (height: number, baseRadius: number, yOffset: number = 0): [number, number, number] => {
  const h = height;
  const y = Math.random() * h; 
  // Radius at this height
  const r = (baseRadius * (h - y)) / h;
  
  const angle = Math.random() * Math.PI * 2;
  const radiusRandom = Math.sqrt(Math.random()) * r; // Uniform distribution on disk

  return [
    Math.cos(angle) * radiusRandom,
    y - (height / 2) + yOffset,
    Math.sin(angle) * radiusRandom
  ];
};

// Point on the SURFACE of the Cone (Better for ornaments)
export const getConeSurfacePoint = (height: number, baseRadius: number, yOffset: number = 0): [number, number, number] => {
  const h = height;
  const y = Math.random() * h;
  const r = (baseRadius * (h - y)) / h;
  const angle = Math.random() * Math.PI * 2;
  
  return [
    Math.cos(angle) * r,
    y - (height / 2) + yOffset,
    Math.sin(angle) * r
  ];
};

export const createStarShape = (outerRadius: number = 1, innerRadius: number = 0.5, points: number = 5) => {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / points;
  
  // Start at top
  shape.moveTo(0, outerRadius);
  
  for (let i = 0; i < points; i++) {
    const angle = i * step;
    const halfAngle = angle + step / 2;
    
    // Outer point (already moved to start, but loop handles next ones)
    if (i > 0) {
      shape.lineTo(Math.cos(angle + Math.PI/2) * outerRadius, Math.sin(angle + Math.PI/2) * outerRadius);
    }
    
    // Inner point
    shape.lineTo(Math.cos(halfAngle + Math.PI/2) * innerRadius, Math.sin(halfAngle + Math.PI/2) * innerRadius);
  }
  
  shape.lineTo(0, outerRadius); // Close loop
  return shape;
};