import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, Text, MeshWobbleMaterial, OrbitControls, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

const Robot = () => {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(0.6, 0.6, 0.4), []);
  const headGeo = useMemo(() => new THREE.BoxGeometry(0.4, 0.35, 0.35), []);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.04, 8, 8), []);
  const armGeo = useMemo(() => new THREE.BoxGeometry(0.15, 0.4, 0.15), []);
  const legGeo = useMemo(() => new THREE.BoxGeometry(0.15, 0.3, 0.15), []);
  
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b82f6", roughness: 0.3, metalness: 0.8 }), []);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#60a5fa", roughness: 0.3, metalness: 0.8 }), []);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#00ffff" }), []);
  const armMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b82f6" }), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d4ed8" }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.5) * 0.2;
      group.current.position.y = Math.sin(t * 2) * 0.15;
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 3) * 0.8;
      leftArm.current.rotation.z = -0.2 + Math.sin(t * 2) * 0.1;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = Math.cos(t * 3) * 0.8;
      rightArm.current.rotation.z = 0.2 + Math.sin(t * 2) * 0.1;
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 1.5) * 0.4;
      head.current.rotation.x = Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <mesh position={[0, 0.4, 0]} geometry={bodyGeo} material={bodyMat} castShadow />
      <mesh ref={head} position={[0, 0.9, 0]} geometry={headGeo} material={headMat} castShadow>
        <mesh position={[-0.1, 0.05, 0.18]} geometry={eyeGeo} material={eyeMat} />
        <mesh position={[0.1, 0.05, 0.18]} geometry={eyeGeo} material={eyeMat} />
        {/* Scanning Line */}
        <mesh position={[0, 0.05, 0.19]}>
          <planeGeometry args={[0.25, 0.01]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </mesh>
      </mesh>
      <mesh ref={leftArm} position={[-0.4, 0.5, 0]} geometry={armGeo} material={armMat} castShadow />
      <mesh ref={rightArm} position={[0.4, 0.5, 0]} geometry={armGeo} material={armMat} castShadow />
      <mesh position={[-0.15, 0, 0]} geometry={legGeo} material={legMat} castShadow />
      <mesh position={[0.15, 0, 0]} geometry={legGeo} material={legMat} castShadow />
    </group>
  );
};

const FloatingIsland = () => {
  const islandGeo = useMemo(() => new THREE.CylinderGeometry(2, 1.5, 0.8, 6), []);
  const dirtGeo = useMemo(() => new THREE.CylinderGeometry(1.5, 0.2, 1.2, 6), []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), []);
  const coneGeo = useMemo(() => new THREE.ConeGeometry(0.3, 0.6, 6), []);
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(0.25, 8, 8), []);

  const islandMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4ade80", roughness: 0.8, emissive: "#4ade80", emissiveIntensity: 0.1 }), []);
  const dirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#78350f", roughness: 1 }), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#451a03" }), []);
  const leafMat1 = useMemo(() => new THREE.MeshStandardMaterial({ color: "#166534" }), []);
  const leafMat2 = useMemo(() => new THREE.MeshStandardMaterial({ color: "#15803d" }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    islandMat.emissiveIntensity = 0.1 + Math.sin(t * 2) * 0.05;
  });

  return (
    <group position={[0, -0.5, 0]}>
      <mesh receiveShadow castShadow geometry={islandGeo} material={islandMat} />
      <mesh position={[0, -0.6, 0]} receiveShadow geometry={dirtGeo} material={dirtMat} />
      
      <group position={[1.2, 0.4, 0.5]}>
        <mesh position={[0, 0.2, 0]} geometry={trunkGeo} material={trunkMat} castShadow />
        <mesh position={[0, 0.6, 0]} geometry={coneGeo} material={leafMat1} castShadow />
      </group>
      
      <group position={[-1, 0.4, -0.8]}>
        <mesh position={[0, 0.2, 0]} geometry={trunkGeo} material={trunkMat} castShadow />
        <mesh position={[0, 0.5, 0]} geometry={sphereGeo} material={leafMat2} castShadow />
      </group>
    </group>
  );
};

const OrbitingPlanet = ({ color, distance, speed, size }: { color: string, distance: number, speed: number, size: number }) => {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(size, 16, 16), [size]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color, 
    emissive: color, 
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8
  }), [color]);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime() * speed;
      ref.current.position.x = Math.cos(t) * distance;
      ref.current.position.z = Math.sin(t) * distance;
      ref.current.position.y = Math.sin(t * 0.5) * (distance * 0.2);
      ref.current.rotation.y += 0.02;
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow geometry={geo} material={mat}>
        <pointLight color={color} intensity={0.5} distance={2} />
      </mesh>
      {color === '#facc15' && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[size * 1.8, 0.02, 2, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.6} emissive={color} emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  );
};

const FloatingBook = ({ position, color }: { position: [number, number, number], color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  const bookGeo = useMemo(() => new THREE.BoxGeometry(0.3, 0.4, 0.08), []);
  const pageGeo = useMemo(() => new THREE.BoxGeometry(0.28, 0.38, 0.06), []);
  const bookMat = useMemo(() => new THREE.MeshStandardMaterial({ color }), [color]);
  const pageMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "white" }), []);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.1;
      ref.current.rotation.y += 0.01;
      ref.current.rotation.z = Math.sin(t) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={position} geometry={bookGeo} material={bookMat} castShadow>
      <mesh position={[0.02, 0, 0]} geometry={pageGeo} material={pageMat} />
    </mesh>
  );
};

const BouncingIcon = ({ position, color, type }: { position: [number, number, number], color: string, type: 'sphere' | 'box' | 'torus' }) => {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    if (type === 'sphere') return new THREE.SphereGeometry(0.15, 8, 8);
    if (type === 'box') return new THREE.BoxGeometry(0.2, 0.2, 0.2);
    return new THREE.TorusGeometry(0.12, 0.04, 6, 16);
  }, [type]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 }), [color]);
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.position.y = position[1] + Math.abs(Math.sin(t * 3 + position[0])) * 0.5;
      ref.current.rotation.x += 0.02;
      ref.current.rotation.z += 0.01;
    }
  });

  return <mesh ref={ref} position={position} geometry={geo} material={mat} castShadow />;
};

const Rig = () => {
  return useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (state.mouse.x * 2), 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (state.mouse.y * 2) + 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
};

const Scene = () => {
  return (
    <>
      <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={100} scale={5} size={2} speed={0.4} color="#00f2ff" />
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={2} castShadow />
      <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <FloatingIsland />
        <Robot />
        
        <FloatingBook position={[0.8, 1.2, 0.5]} color="#ef4444" />
        <FloatingBook position={[-0.7, 1.5, -0.3]} color="#8b5cf6" />
        <FloatingBook position={[0.4, 1.8, -0.8]} color="#f59e0b" />

        <BouncingIcon position={[-1.2, 0.8, 0.8]} color="#00f2ff" type="sphere" />
        <BouncingIcon position={[1.5, 0.6, -0.5]} color="#ff00ff" type="box" />
        <BouncingIcon position={[0, 2.2, 0]} color="#bc13fe" type="torus" />
      </Float>

      <OrbitingPlanet color="#f87171" distance={5} speed={0.5} size={0.3} />
      <OrbitingPlanet color="#60a5fa" distance={8} speed={0.3} size={0.5} />
      <OrbitingPlanet color="#facc15" distance={12} speed={0.2} size={0.4} />
      
      <Rig />
    </>
  );
};

export const LoadingScreen = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Canvas 
          shadows 
          dpr={[1, 2]} 
          gl={{ antialias: true, alpha: true }}
          onCreated={() => setIsCanvasReady(true)}
        >
          <PerspectiveCamera 
            makeDefault 
            position={[0, isMobile ? 3 : 2, isMobile ? 10 : 8]} 
            fov={isMobile ? 60 : 50} 
          />
          <Scene />
        </Canvas>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mt-auto mb-16 sm:mb-20 flex flex-col items-center gap-4 px-6 text-center w-full max-w-lg"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
            letterSpacing: ["0.15em", "0.25em", "0.15em"],
            textShadow: [
              "0 0 10px #00f2ff, 0 0 20px #00f2ff",
              "0 0 30px #00f2ff, 0 0 50px #00f2ff",
              "0 0 10px #00f2ff, 0 0 20px #00f2ff"
            ]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-neon-blue font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] uppercase drop-shadow-[0_0_15px_rgba(0,242,255,0.7)]"
        >
          Igniting Knowledge
        </motion.div>
        
        <div className="w-full max-w-[280px] sm:max-w-[320px] h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 relative">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ 
              x: ["-100%", "100%"]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-neon-blue to-transparent shadow-[0_0_10px_#00f2ff]"
          />
        </div>
        
        <motion.p 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/60 text-[10px] sm:text-[12px] uppercase tracking-[0.4em] font-mono leading-relaxed max-w-[250px] sm:max-w-none"
        >
          Syncing with the Knowledge Galaxy...
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
