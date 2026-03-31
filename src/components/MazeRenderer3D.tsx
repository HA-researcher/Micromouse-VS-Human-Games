import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, MeshReflectorMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { MazeState } from '../types/maze';
import { Direction } from '../types/maze';
import type { MouseState } from '../types/simulator';

interface MazeRenderer3DProps {
  maze: MazeState;
  mouse?: MouseState;
  ghost?: MouseState;
  isSurvivalMode?: boolean;
}

const WALL_HEIGHT = 1.2;
const WALL_THICKNESS = 0.1;

const MouseModel: React.FC<{ mouse: MouseState; color: string; isGhost?: boolean }> = ({ mouse, color, isGhost }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Interpolate position and rotation
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const targetX = mouse.x + 0.5;
    const targetZ = mouse.y + 0.5;
    
    const rotationMap = {
      [Direction.North]: 0,
      [Direction.East]: -Math.PI / 2,
      [Direction.South]: Math.PI,
      [Direction.West]: Math.PI / 2,
    };
    const targetRotation = rotationMap[mouse.direction];
    
    meshRef.current.position.lerp(new THREE.Vector3(targetX, 0.2, targetZ), delta * 10);
    
    // Smooth rotation
    const currentRotation = meshRef.current.rotation.y;
    let diff = targetRotation - currentRotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    meshRef.current.rotation.y += diff * delta * 10;
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh castShadow>
          <coneGeometry args={[0.2, 0.5, 3]} />
          <meshStandardMaterial color={color} transparent={isGhost} opacity={isGhost ? 0.5 : 1} />
        </mesh>
      </Float>
      {/* Headlights */}
      <pointLight position={[0, 0, -0.3]} intensity={5} distance={3} color="#fff" />
    </group>
  );
};

const Walls: React.FC<{ maze: MazeState }> = ({ maze }) => {
  const { width, height, walls } = maze;
  
  const wallElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const mask = walls[y * width + x];
        const cx = x + 0.5;
        const cz = y + 0.5;
        
        // North wall
        if (mask & (1 << Direction.North)) {
          elements.push(
            <mesh key={`n-${x}-${y}`} position={[cx, WALL_HEIGHT / 2, y]} receiveShadow castShadow>
              <boxGeometry args={[1, WALL_HEIGHT, WALL_THICKNESS]} />
              <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        }
        // West wall
        if (mask & (1 << Direction.West)) {
          elements.push(
            <mesh key={`w-${x}-${y}`} position={[x, WALL_HEIGHT / 2, cz]} receiveShadow castShadow>
              <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, 1]} />
              <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        }
        
        // Outer boundaries (South and East) for the last cells
        if (x === width - 1 && (mask & (1 << Direction.East))) {
           elements.push(
            <mesh key={`e-${x}-${y}`} position={[x + 1, WALL_HEIGHT / 2, cz]} receiveShadow castShadow>
              <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, 1]} />
              <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        }
        if (y === height - 1 && (mask & (1 << Direction.South))) {
          elements.push(
            <mesh key={`s-${x}-${y}`} position={[cx, WALL_HEIGHT / 2, y + 1]} receiveShadow castShadow>
              <boxGeometry args={[1, WALL_HEIGHT, WALL_THICKNESS]} />
              <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </mesh>
          );
        }
      }
    }
    return elements;
  }, [maze]);

  return <>{wallElements}</>;
};

const FPSCamera: React.FC<{ mouse: MouseState }> = ({ mouse }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame((_, delta) => {
    if (!cameraRef.current) return;
    
    // FPS View: Positioned slightly behind the mouse head
    const targetX = mouse.x + 0.5;
    const targetZ = mouse.y + 0.5;
    
    const rotationMap = {
      [Direction.North]: 0,
      [Direction.East]: -Math.PI / 2,
      [Direction.South]: Math.PI,
      [Direction.West]: Math.PI / 2,
    };
    const targetRotation = rotationMap[mouse.direction];

    // Camera height
    const camHeight = 0.4;
    // Camera offset from center
    const offset = 0.1;
    const offX = Math.sin(targetRotation) * offset;
    const offZ = Math.cos(targetRotation) * offset;

    const targetPos = new THREE.Vector3(targetX + offX, camHeight, targetZ + offZ);
    cameraRef.current.position.lerp(targetPos, delta * 5);
    
    // Look ahead
    const lookAtX = targetX - Math.sin(targetRotation) * 2;
    const lookAtZ = targetZ - Math.cos(targetRotation) * 2;
    cameraRef.current.lookAt(lookAtX, camHeight, lookAtZ);
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault fov={75} />;
};

const MazeRenderer3D: React.FC<MazeRenderer3DProps> = ({ maze, mouse, ghost, isSurvivalMode }) => {
  return (
    <div style={{ width: '100%', height: '400px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', border: '2px solid #444' }}>
      <Canvas shadows>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 15]} />
        
        {mouse && <FPSCamera mouse={mouse} />}
        
        <ambientLight intensity={isSurvivalMode ? 0.1 : 0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Walls maze={maze} />
        
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[maze.width / 2, 0, maze.height / 2]} receiveShadow>
          <planeGeometry args={[maze.width + 10, maze.height + 10]} />
          <MeshReflectorMaterial
            mirror={0.5}
            blur={[300, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={40}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#101010"
            metalness={0.5}
          />
        </mesh>

        {/* Goal Area Highlighter */}
        <mesh position={[maze.goalX + maze.goalWidth / 2, 0.01, maze.goalY + maze.goalHeight / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[maze.goalWidth, maze.goalHeight]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} transparent opacity={0.3} />
        </mesh>

        {ghost && <MouseModel mouse={ghost} color="#4FC3F7" isGhost />}
        {mouse && <MouseModel mouse={mouse} color="#FF5252" />}
      </Canvas>
      
      {/* Overlay controls hint */}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#fff', fontSize: '10px', pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', padding: '2px 5px', borderRadius: '4px' }}>
        FPS VIEW MODE
      </div>
    </div>
  );
};

export default MazeRenderer3D;
