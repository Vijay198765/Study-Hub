import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import MusicPlayer from "./components/MusicPlayer";
import { Toaster } from "sonner";

const App: React.FC = () => {
  console.log("App rendering...");
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-orange-500/30">
      <Routes>
        {/* User View - Minimal but confirmed rendering */}
        <Route 
          path="/" 
          element={
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="z-10 text-center space-y-4">
                <h1 className="text-2xl font-bold tracking-tighter opacity-20">SyncMusic</h1>
                <p className="text-xs font-mono uppercase tracking-[0.3em] opacity-10">Connected & Waiting</p>
              </div>

              <MusicPlayer />
              
              {/* Very subtle hint that the page is active */}
              <div className="fixed bottom-6 left-6 flex gap-1 items-end h-4 opacity-20">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-0.5 bg-zinc-500 rounded-full animate-pulse" 
                    style={{ 
                      height: `${40 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.2}s`
                    }} 
                  />
                ))}
              </div>
            </div>
          } 
        />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      
      <Toaster position="top-center" theme="dark" />
    </div>
  );
};

export default App;
