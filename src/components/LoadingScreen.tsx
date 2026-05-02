import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, MeshWobbleMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import Logo from './Logo';

const Robot = () => {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Mesh>(null);
  const leftEye = useRef<THREE.Mesh>(null);
  const rightEye = useRef<THREE.Mesh>(null);
  const scannerRef = useRef<THREE.Mesh>(null);
  
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(0.6, 0.6, 0.4), []);
  const headGeo = useMemo(() => new THREE.BoxGeometry(0.4, 0.35, 0.35), []);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.04, 8, 8), []);
  const armGeo = useMemo(() => new THREE.BoxGeometry(0.15, 0.4, 0.15), []);
  const legGeo = useMemo(() => new THREE.BoxGeometry(0.15, 0.3, 0.15), []);
  
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b82f6", roughness: 0.1, metalness: 0.9, emissive: "#000000" }), []);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#60a5fa", roughness: 0.1, metalness: 0.9 }), []);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#00ffff" }), []);
  const armMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b82f6", metalness: 0.8 }), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d4ed8", metalness: 0.8 }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.4) * 0.3;
      group.current.position.y = 0.5 + Math.sin(t * 1.5) * 0.2;
      group.current.rotation.z = Math.sin(t * 0.2) * 0.05;
    }
    if (leftArm.current) {
      leftArm.current.rotation.x = Math.sin(t * 2) * 1.2;
      leftArm.current.rotation.z = -0.3 + Math.sin(t * 1.5) * 0.2;
    }
    if (rightArm.current) {
      rightArm.current.rotation.x = Math.cos(t * 2.2) * 1.2;
      rightArm.current.rotation.z = 0.3 + Math.sin(t * 1.8) * 0.2;
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 1.2) * 0.6;
      head.current.rotation.x = Math.sin(t * 2.5) * 0.15;
    }
    if (scannerRef.current) {
      scannerRef.current.position.y = 0.05 + Math.sin(t * 5) * 0.05;
      scannerRef.current.scale.x = 1 + Math.sin(t * 10) * 0.2;
    }
    if (leftEye.current && rightEye.current) {
      const eyeScale = 1 + Math.sin(t * 5) * 0.3;
      leftEye.current.scale.set(eyeScale, eyeScale, eyeScale);
      rightEye.current.scale.set(eyeScale, eyeScale, eyeScale);
    }
    
    // Pulsate body emissive
    bodyMat.emissive.setHSL(0.5, 1, 0.1 + Math.sin(t * 2) * 0.05);
  });

  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
        <torusGeometry args={[0.8, 0.01, 16, 100]} />
        <MeshWobbleMaterial color="#00ffff" speed={1} factor={0.2} transparent opacity={0.3} />
      </mesh>

      <mesh position={[0, 0.4, 0]} geometry={bodyGeo} material={bodyMat} castShadow />
      <mesh ref={head} position={[0, 0.9, 0]} geometry={headGeo} material={headMat} castShadow>
        <mesh ref={leftEye} position={[-0.1, 0.05, 0.18]} geometry={eyeGeo} material={eyeMat} />
        <mesh ref={rightEye} position={[0.1, 0.05, 0.18]} geometry={eyeGeo} material={eyeMat} />
        <mesh ref={scannerRef} position={[0, 0.05, 0.19]}>
          <planeGeometry args={[0.25, 0.01]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
        </mesh>
      </mesh>
      <mesh ref={leftArm} position={[-0.4, 0.5, 0]} geometry={armGeo} material={armMat} castShadow />
      <mesh ref={rightArm} position={[0.4, 0.5, 0]} geometry={armGeo} material={armMat} castShadow />
      <mesh position={[-0.15, 0.1, 0]} geometry={legGeo} material={legMat} castShadow />
      <mesh position={[0.15, 0.1, 0]} geometry={legGeo} material={legMat} castShadow />
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
    const t = state.clock.elapsedTime;
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
      const t = state.clock.elapsedTime * speed;
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
      const t = state.clock.elapsedTime;
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
      const t = state.clock.elapsedTime;
      ref.current.position.y = position[1] + Math.abs(Math.sin(t * 3 + position[0])) * 0.5;
      ref.current.rotation.x += 0.02;
      ref.current.rotation.z += 0.01;
    }
  });

  return <mesh ref={ref} position={position} geometry={geo} material={mat} castShadow />;
};

const Rig = () => {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (state.pointer.x * 2), 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (state.pointer.y * 2) + 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

const DataPoint = ({ position, speed, offset }: { position: [number, number, number], speed: number, offset: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.y = position[1] + Math.sin(t * speed + offset) * 0.2;
      ref.current.rotation.y += 0.02;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.04, 0.04, 0.04]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
    </mesh>
  );
};

const DataPoints = ({ count = 30 }) => {
  const points = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      ] as [number, number, number],
      speed: 0.1 + Math.random() * 0.2,
      offset: Math.random() * Math.PI * 2
    }));
  }, [count]);

  return (
    <group>
      {points.map((p, i) => (
        <DataPoint key={i} {...p} />
      ))}
    </group>
  );
};

const LOADING_MESSAGES = [
  "Initializing Neural Pathways...",
  "Architecting Knowledge Grids...",
  "Optimizing Cognitive Engines...",
  "Sourcing Academic Archives...",
  "Syncing Scholastic Protocols...",
  "Calibrating HUB Systems..."
];

const LoadingScene = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <>
      <PerspectiveCamera 
        makeDefault 
        position={[0, isMobile ? 4 : 2, isMobile ? 12 : 8]} 
        fov={isMobile ? 70 : 50} 
      />
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={2} />
      <Suspense fallback={null}>
        <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={100} scale={5} size={2} speed={0.4} color="#00f2ff" />
        <DataPoints />
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
      </Suspense>
    </>
  );
};

export const LoadingScreen = ({ siteConfig }: { siteConfig?: any }) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 768;
    return false;
  });
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: isCanvasReady ? 1 : 0, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Canvas 
          shadows
          dpr={[1, isMobile ? 1.5 : 2]} 
          gl={{ antialias: !isMobile, alpha: true }}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
            setIsCanvasReady(true);
          }}
        >
          <LoadingScene isMobile={isMobile} />
        </Canvas>
      </motion.div>
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-t from-neon-blue/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-auto mb-10 sm:mb-16 flex flex-col items-center gap-8 px-6 text-center w-full max-w-lg"
      >
        <div className="space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mb-4" />
            
            {/* Logo in Loading Screen */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-4"
            >
              <Logo 
                logoUrl={siteConfig?.logoUrl} 
                faviconUrl={siteConfig?.faviconUrl}
                logoColor={siteConfig?.logoColor}
                logoColorSecondary={siteConfig?.logoColorSecondary}
                logoColorTertiary={siteConfig?.logoColorTertiary}
                logoInnerColor={siteConfig?.logoInnerColor}
                logoInnerColorSecondary={siteConfig?.logoInnerColorSecondary}
                logoInnerColorTertiary={siteConfig?.logoInnerColorTertiary}
                size="lg" 
              />
            </motion.div>

            <motion.h1
              animate={{ 
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-white font-sans text-4xl sm:text-5xl font-black tracking-[0.25em] uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {siteConfig?.siteName || 'STUDY HUB'}
            </motion.h1>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mt-4" />
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-full max-w-[280px] h-[3px] bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              animate={{ 
                x: ["-100%", "100%"]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent shadow-[0_0_20px_white]"
            />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.p 
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-neon-blue/80 text-[11px] uppercase font-mono tracking-[0.4em] font-medium"
              >
                {LOADING_MESSAGES[messageIndex]}
              </motion.p>
            </AnimatePresence>
            
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[9px] text-white/20 uppercase tracking-[0.6em] font-black"
            >
              System Online
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
