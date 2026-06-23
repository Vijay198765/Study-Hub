import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

export default function SurprisePreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Permanently hardcoded as requested to ensure it always loads this asset
  const rawUrl = "https://drive.google.com/file/d/1QsGlZ8QCjAaNmy0cmDi3QSQQy-6fbCE_/view?usp=drivesdk";
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isBlackedOut, setIsBlackedOut] = useState(false);

  // Parse file/preview ID if drive link
  let previewUrl = rawUrl;
  if (rawUrl.includes('drive.google.com')) {
    const fileIdMatch = rawUrl.match(/\/d\/([^/&?]+)/) || rawUrl.match(/id=([^&?#]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      previewUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }

  const handleBack = () => {
    navigate('/');
  };

  // Keyboard shortcut listener to toggle blackout when pressing key '9'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing values
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }

      if (e.key === '9') {
        e.preventDefault();
        setIsBlackedOut(prev => !prev);
      } else if (e.key === '7') {
        e.preventDefault();
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Blackout overlay for rapid privacy hide of the preview */}
      {isBlackedOut && (
        <div id="blackout-curtain" className="fixed inset-0 bg-black z-[100] transition-colors duration-300" />
      )}

      {/* Absolute Header Overlay with Back Button */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="px-4 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-white/10 text-xs font-bold font-sans uppercase tracking-wider transition-all flex items-center gap-2 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14} className="text-neon-blue" />
          <span>Exit Preview</span>
        </button>
      </div>

      {/* Main Preview Container */}
      <div className="relative w-full h-full flex-grow bg-zinc-950">
        {!previewUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-zinc-950">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-6 border border-yellow-500/20 shadow-[0_0_20px_rgba(250,204,21,0.15)] animate-pulse">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">No active surprise link loaded</h1>
            <p className="text-white/40 text-sm max-w-sm mb-6">Ask your administrator to map Google Drive files on the control panel.</p>
            <button
              onClick={handleBack}
              className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <React.Fragment>
            {/* Elegant futuristic skeleton loader while iframe loads */}
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-neon-blue animate-spin" />
                  <Sparkles size={20} className="text-yellow-400 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs text-white/50 font-black uppercase tracking-[0.25em]">Opening Surprise File</p>
                  <p className="text-[10px] text-white/20 font-bold">Securely routing your drive web-preview...</p>
                </div>
              </div>
            )}
            
            <iframe
              src={previewUrl}
              className="w-full h-full border-0 absolute inset-0 bg-transparent z-0"
              allow="autoplay; encrypted-media"
              referrerPolicy="no-referrer"
              onLoad={() => setIframeLoaded(true)}
              title="Google Drive Web Preview"
            />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
