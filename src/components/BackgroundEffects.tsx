import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface BackgroundEffectsProps {
  effect?: 'none' | 'snow' | 'confetti' | 'stars' | 'cybergrid' | 'aurora' | 'matrix' | 'nebula' | 'vortex' | 'drift' | 'supernova' | 'meteors' | 'hyperdrive' | 'fireflies' | 'digitalwave' | 'cosmicdust' | 'blackhole' | 'sonar' | 'rain' | 'glitch' | 'orion' | 'spacewarp';
  quality?: 'high' | 'medium' | 'low';
}

const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ effect = 'none', quality = 'high' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === 'confetti') {
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [effect]);

  // Unified Canvas Effects Engine
  useEffect(() => {
    const canvasEffects = [
      'matrix', 'hyperdrive', 'digitalwave', 'orion', 'meteors', 
      'fireflies', 'cosmicdust', 'blackhole', 'sonar', 'rain', 
      'glitch', 'spacewarp'
    ];
    if (!canvasEffects.includes(effect) || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let animationFrame: number;
    let frameCount = 0;

    // --- State Initializations by Effect ---
    
    // Matrix State
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%';
    const fontSize = 16;
    const columns = Math.ceil(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    // Hyperdrive State
    const starCount = quality === 'high' ? 180 : quality === 'medium' ? 90 : 40;
    const stars: Array<{ x: number; y: number; z: number; speed: number }> = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000 + 100,
        speed: Math.random() * 10 + 15
      });
    }

    // Orion/Constellation State
    const nodeCount = quality === 'high' ? 65 : quality === 'medium' ? 35 : 15;
    const nodes: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2 + 1
      });
    }

    // Meteors State
    const meteorCount = quality === 'high' ? 10 : quality === 'medium' ? 5 : 2;
    const meteos: Array<{ x: number; y: number; s: number; l: number; w: number; active: boolean; delay: number }> = [];
    for (let i = 0; i < meteorCount; i++) {
      meteos.push({
        x: Math.random() * (width + 200),
        y: -100,
        s: Math.random() * 12 + 8,
        l: Math.random() * 140 + 70,
        w: Math.random() * 1.5 + 0.8,
        active: true,
        delay: Math.random() * 300
      });
    }

    // Fireflies State
    const flyCount = quality === 'high' ? 40 : quality === 'medium' ? 20 : 8;
    const flies: Array<{ x: number; y: number; vx: number; vy: number; r: number; phase: number; freq: number }> = [];
    for (let i = 0; i < flyCount; i++) {
      flies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.5 + 1.5,
        phase: Math.random() * Math.PI * 2,
        freq: Math.random() * 0.04 + 0.01
      });
    }

    // Cosmic Dust State
    const dustCount = quality === 'high' ? 90 : quality === 'medium' ? 45 : 20;
    const dust: Array<{ x: number; y: number; vx: number; vy: number; r: number; color: string }> = [];
    const colors = ['rgba(0,229,255,', 'rgba(179,71,255,', 'rgba(255,107,53,', 'rgba(255,255,255,'];
    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1, // Rising drift
        r: Math.random() * 1.8 + 0.4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Black Hole Accretion Particles
    const bhParticles: Array<{ a: number; r: number; s: number; size: number; col: string }> = [];
    const bhCount = quality === 'high' ? 180 : quality === 'medium' ? 90 : 40;
    const colorsBH = ['#00e5ff', '#ff007f', '#b347ff', '#ff7b00', '#ffd700'];
    for (let i = 0; i < bhCount; i++) {
      bhParticles.push({
        a: Math.random() * Math.PI * 2,
        r: Math.random() * 160 + 55,
        s: Math.random() * 0.02 + 0.01,
        size: Math.random() * 2 + 0.8,
        col: colorsBH[Math.floor(Math.random() * colorsBH.length)]
      });
    }

    // Sonar Rings State
    const sonarRings = [0, 120, 240, 360, 480];
    const pulseSpeed = quality === 'low' ? 1.0 : 1.4;

    // Rain State
    const rainCount = quality === 'high' ? 140 : quality === 'medium' ? 70 : 30;
    const rainDrops: Array<{ x: number; y: number; d: number; s: number }> = [];
    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        d: Math.random() * 18 + 12,
        s: Math.random() * 14 + 11
      });
    }

    // Spacewarp Spiral Rings
    const maxWarpR = Math.min(width, height) * 0.85;

    // Draw Loop
    const draw = () => {
      frameCount++;
      const time = frameCount * 0.012;

      // Handle custom clear modes for trails/fading
      if (effect === 'matrix') {
        ctx.fillStyle = 'rgba(1, 2, 8, 0.07)';
        ctx.fillRect(0, 0, width, height);
      } else if (effect === 'glitch') {
        ctx.fillStyle = Math.random() > 0.985 ? 'rgba(0,229,255,0.06)' : 'rgba(1, 2, 8, 0.12)';
        ctx.fillRect(0, 0, width, height);
      } else if (effect === 'blackhole') {
         ctx.fillStyle = 'rgba(1, 2, 8, 0.16)';
         ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      // 1. Matrix
      if (effect === 'matrix') {
        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
          const text = characters.charAt(Math.floor(Math.random() * characters.length));
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      } 
      
      // 2. Hyperdrive
      else if (effect === 'hyperdrive') {
        ctx.fillStyle = 'rgba(1, 2, 8, 0.25)';
        ctx.fillRect(0, 0, width, height);
        ctx.lineWidth = 1.5;
        const cx = width / 2;
        const cy = height / 2;
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const px = ((s.x / s.z) * width) + cx;
          const py = ((s.y / s.z) * height) + cy;
          s.z -= s.speed;
          if (s.z <= 0 || px < 0 || px > width || py < 0 || py > height) {
            s.z = 1000;
            s.x = (Math.random() - 0.5) * width * 2;
            s.y = (Math.random() - 0.5) * height * 2;
          } else {
            const nx = ((s.x / s.z) * width) + cx;
            const ny = ((s.y / s.z) * height) + cy;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 229, 255, ${Math.min(1.0, (1000 - s.z) / 450)})`;
            ctx.moveTo(px, py);
            ctx.lineTo(nx, ny);
            ctx.stroke();
          }
        }
      } 
      
      // 3. Digital Wave
      else if (effect === 'digitalwave') {
        ctx.lineWidth = 1.3;
        for (let lineIndex = 0; lineIndex < 5; lineIndex++) {
          ctx.beginPath();
          ctx.strokeStyle = lineIndex % 2 === 0 ? 'rgba(0, 229, 255, 0.25)' : 'rgba(179, 71, 255, 0.22)';
          for (let x = 0; x < width; x += 18) {
            const y = height / 2 + Math.sin(x * 0.0028 + time + lineIndex * 0.7) * 75 + Math.cos(x * 0.0012 - time * 0.6) * 35;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        // Wave glowing points
        ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
        for (let i = 0; i < 12; i++) {
          const dotX = ((frameCount * 1.8 + i * (width / 12)) % width);
          const dotY = height / 2 + Math.sin(dotX * 0.0028 + time) * 75 + Math.cos(dotX * 0.0012 - time * 0.6) * 35;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } 
      
      // 4. Conestellation Orion
      else if (effect === 'orion') {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
        ctx.lineWidth = 0.7;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        // Draw constellation bindings
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 120) {
              const o = (1 - dist / 120) * 0.18;
              ctx.strokeStyle = `rgba(0, 229, 255, ${o})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      } 
      
      // 5. Meteors
      else if (effect === 'meteors') {
        ctx.fillStyle = 'rgba(1, 2, 8, 0.15)';
        ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < meteos.length; i++) {
          const m = meteos[i];
          if (m.delay > 0) {
            m.delay--;
            continue;
          }
          if (m.active) {
            m.x -= m.s;
            m.y += m.s;
            // Draw gradient trail
            const grad = ctx.createLinearGradient(m.x, m.y, m.x + m.l, m.y - m.l);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.12, 'rgba(0, 229, 255, 0.45)');
            grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = m.w;
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m.x + m.l, m.y - m.l);
            ctx.stroke();

            if (m.x < -150 || m.y > height + 150) {
              m.active = false;
              m.delay = Math.random() * 450 + 50;
            }
          } else {
            m.x = Math.random() * (width + 300) + 100;
            m.y = -100;
            m.s = Math.random() * 12 + 8;
            m.active = true;
          }
        }
      } 
      
      // 6. Fireflies
      else if (effect === 'fireflies') {
        for (let i = 0; i < flies.length; i++) {
          const f = flies[i];
          f.phase += f.freq;
          const oscOpacity = 0.25 + (Math.sin(f.phase) + 1) * 0.35;
          f.x += f.vx + Math.sin(f.phase) * 0.12;
          f.y += f.vy + Math.cos(f.phase) * 0.12;

          if (f.x < -20) f.x = width + 20;
          if (f.x > width + 20) f.x = -20;
          if (f.y < -20) f.y = height + 20;
          if (f.y > height + 20) f.y = -20;

          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.8);
          grad.addColorStop(0, `rgba(164, 255, 87, ${oscOpacity})`);
          grad.addColorStop(0.35, `rgba(0, 229, 255, ${oscOpacity * 0.35})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } 
      
      // 7. Cosmic Dust
      else if (effect === 'cosmicdust') {
        for (let i = 0; i < dust.length; i++) {
          const d = dust[i];
          d.x += d.vx;
          d.y += d.vy;
          if (d.x < 0 || d.x > width) d.vx *= -1;
          if (d.y < -10) d.y = height + 10;
          
          ctx.fillStyle = d.color + '0.45)';
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } 
      
      // 8. Black Hole
      else if (effect === 'blackhole') {
         const cx = width / 2;
         const cy = height / 2;
         
         // Event horizon
         ctx.beginPath();
         ctx.arc(cx, cy, 60, 0, Math.PI * 2);
         ctx.fillStyle = '#010103';
         ctx.fill();

         // Particles in disk
         for (let i = 0; i < bhParticles.length; i++) {
           const p = bhParticles[i];
           p.a += p.s;
           ctx.beginPath();
           const px = cx + Math.cos(p.a) * p.r;
           const py = cy + Math.sin(p.a) * p.r * 0.42; // perspective
           ctx.arc(px, py, p.size, 0, Math.PI * 2);
           ctx.fillStyle = p.col;
           ctx.fill();
         }
      } 
      
      // 9. Sonar Pulse
      else if (effect === 'sonar') {
         const cx = width / 2;
         const cy = height / 2;
         ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
         ctx.lineWidth = 1;
         
         ctx.beginPath();
         ctx.arc(cx, cy, 100, 0, Math.PI * 2);
         ctx.moveTo(cx + 250, cy);
         ctx.arc(cx, cy, 250, 0, Math.PI * 2);
         ctx.stroke();

         ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
         ctx.beginPath();
         ctx.moveTo(cx - 320, cy); ctx.lineTo(cx + 320, cy);
         ctx.moveTo(cx, cy - 320); ctx.lineTo(cx, cy + 320);
         ctx.stroke();

         for (let i = 0; i < sonarRings.length; i++) {
           sonarRings[i] += pulseSpeed;
           if (sonarRings[i] > 550) {
             sonarRings[i] = 0;
           }
           const alpha = (1 - sonarRings[i] / 550) * 0.25;
           ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
           ctx.lineWidth = 1.3;
           ctx.beginPath();
           ctx.arc(cx, cy, sonarRings[i], 0, Math.PI * 2);
           ctx.stroke();
         }
      } 
      
      // 10. Cosmic Rain
      else if (effect === 'rain') {
        ctx.strokeStyle = 'rgba(160, 190, 240, 0.22)';
        ctx.lineWidth = 1;
        for (let i = 0; i < rainDrops.length; i++) {
          const r = rainDrops[i];
          r.y += r.s;
          if (r.y > height) {
            r.y = -35;
            r.x = Math.random() * width;
          }
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - 1, r.y + r.d);
          ctx.stroke();
        }
      } 
      
      // 11. Retro Cyber Glitch
      else if (effect === 'glitch') {
        if (Math.random() > 0.4) {
          ctx.fillStyle = 'rgba(179, 71, 255, 0.25)';
          for (let i = 0; i < 3; i++) {
             const gx = Math.random() * width;
             const gy = Math.random() * height;
             const gw = Math.random() * 90 + 15;
             const gh = Math.random() * 1.8 + 0.8;
             ctx.fillRect(gx, gy, gw, gh);
          }
        }
        if (Math.random() > 0.97) {
           const sliceY = Math.random() * height;
           const sliceH = Math.random() * 35 + 5;
           const offset = (Math.random() - 0.5) * 45;
           ctx.drawImage(canvas, 0, sliceY, width, sliceH, offset, sliceY, width, sliceH);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.012)';
        for (let i = 0; i < height; i += 5) {
           ctx.fillRect(0, i, width, 1);
        }
      } 
      
      // 12. Cosmic Tunnel Spacewarp
      else if (effect === 'spacewarp') {
         const cx = width / 2;
         const cy = height / 2;
         const spinAngle = time * 0.35;
         ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
         ctx.lineWidth = 1;
         
         for (let r = 25; r < maxWarpR; r += 32) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, spinAngle, spinAngle + Math.PI * 1.6);
            ctx.stroke();
            
            ctx.fillStyle = `rgba(179, 71, 255, ${0.08 + (1 - r / maxWarpR) * 0.3})`;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
               const tx = cx + Math.cos(angle + spinAngle * (r * 0.0015)) * r;
               const ty = cy + Math.sin(angle + spinAngle * (r * 0.0015)) * r;
               ctx.beginPath();
               ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
               ctx.fill();
            }
         }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [effect, quality]);

  if (effect === 'none') return null;

  const canvasEffects = [
    'matrix', 'hyperdrive', 'digitalwave', 'orion', 'meteors', 
    'fireflies', 'cosmicdust', 'blackhole', 'sonar', 'rain', 
    'glitch', 'spacewarp'
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {effect === 'snow' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(quality === 'high' ? 50 : 20)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full opacity-20 animate-fall pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 10}s`,
                filter: 'blur(1px)'
              }}
            />
          ))}
        </div>
      )}

      {effect === 'stars' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(quality === 'high' ? 100 : 40)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white rounded-full animate-twinkle pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 5}s`,
                boxShadow: '0 0 10px rgba(255,255,255,0.8)'
              }}
            />
          ))}
        </div>
      )}

      {effect === 'cybergrid' && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] animate-grid-move pointer-events-none" />
        </div>
      )}

      {effect === 'aurora' && (
        <div className="absolute inset-0 filter blur-[100px] opacity-30 mix-blend-screen pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-neon-blue rounded-full animate-blob opacity-50 pointer-events-none" />
          <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-neon-purple rounded-full animate-blob animation-delay-2000 opacity-50 pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[60%] bg-neon-pink rounded-full animate-blob animation-delay-4000 opacity-50 pointer-events-none" />
        </div>
      )}

      {effect === 'supernova' && (
        <div className="absolute inset-0 flex items-center justify-center filter blur-[120px] opacity-35 pointer-events-none">
          <div className="absolute w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full bg-gradient-to-r from-orange-400 via-red-500 to-indigo-950 animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
          <div className="absolute w-[90vw] h-[90vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-gradient-to-r from-amber-300 via-pink-500 to-transparent animate-spin-slow opacity-30 pointer-events-none" />
        </div>
      )}

      {effect === 'nebula' && (
        <div className="absolute inset-0 bg-transparent pointer-events-none">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay animate-pulse pointer-events-none" style={{ backgroundColor: '#050505' }} />
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full blur-[80px] opacity-20 animate-pulse pointer-events-none"
              style={{
                width: `${Math.random() * 40 + 30}%`,
                height: `${Math.random() * 40 + 30}%`,
                left: `${Math.random() * 100 - 20}%`,
                top: `${Math.random() * 100 - 20}%`,
                backgroundColor: i % 2 === 0 ? '#00f2ff' : '#bc13fe',
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}

      {effect === 'vortex' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="w-[180vw] h-[180vw] rounded-full border-[100px] border-neon-blue/5 animate-spin-slow opacity-20 pointer-events-none" />
          <div className="absolute w-[140vw] h-[140vw] rounded-full border-[60px] border-neon-purple/5 animate-spin-reverse opacity-20 pointer-events-none" />
          <div className="absolute w-[90vw] h-[90vw] rounded-full border-[40px] border-neon-pink/5 animate-spin-slow opacity-20 pointer-events-none" />
        </div>
      )}

      {effect === 'drift' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(quality === 'high' ? 40 : 15)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-gradient-to-r from-neon-blue to-transparent w-24 h-px opacity-10 animate-drift-line pointer-events-none"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 10}s`,
                animationDelay: `${Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      )}

      {canvasEffects.includes(effect) && (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-80 mix-blend-screen pointer-events-none z-0" />
      )}
    </div>
  );
};

export default BackgroundEffects;
