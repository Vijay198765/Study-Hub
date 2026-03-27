import React, { useState, useEffect } from "react";
import socket from "../lib/socket";
import { getDirectDriveLink } from "../lib/driveUtils";
import { Play, Pause, Power, Save, Music } from "lucide-react";

const AdminPanel: React.FC = () => {
  const [url, setUrl] = useState("");
  const [musicState, setMusicState] = useState<any>(null);

  useEffect(() => {
    socket.on("musicStateUpdate", (state) => {
      setMusicState(state);
      if (!url) setUrl(state.url);
    });

    return () => {
      socket.off("musicStateUpdate");
    };
  }, []);

  const handleUpdate = (updates: any) => {
    socket.emit("updateMusicState", updates);
  };

  const saveUrl = () => {
    const directLink = getDirectDriveLink(url);
    handleUpdate({ url: directLink });
  };

  if (!musicState) return <div className="p-8 text-center">Connecting to server...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Music className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SyncMusic Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${musicState.isEnabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-zinc-700'}`} />
            <span className="text-xs font-mono uppercase tracking-widest opacity-50">
              {musicState.isEnabled ? 'Global Active' : 'Global Inactive'}
            </span>
          </div>
        </header>

        <section className="space-y-4">
          <label className="text-xs font-mono uppercase tracking-widest opacity-50">Music Source (Google Drive Link)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Google Drive sharing link here..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500/50 transition-colors font-mono text-sm"
            />
            <button
              onClick={saveUrl}
              className="bg-zinc-100 text-zinc-950 px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
          <p className="text-xs opacity-40 italic">Supports standard sharing links. We'll convert them to direct download links for you.</p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleUpdate({ isEnabled: !musicState.isEnabled })}
            className={`p-8 rounded-2xl border transition-all flex flex-col items-center gap-4 ${
              musicState.isEnabled 
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            <Power className="w-12 h-12" />
            <span className="font-bold uppercase tracking-widest text-xs">
              {musicState.isEnabled ? 'Disable System' : 'Enable System'}
            </span>
          </button>

          <button
            onClick={() => handleUpdate({ isPlaying: !musicState.isPlaying })}
            disabled={!musicState.isEnabled}
            className={`p-8 rounded-2xl border transition-all flex flex-col items-center gap-4 ${
              !musicState.isEnabled 
                ? 'opacity-20 cursor-not-allowed bg-zinc-900 border-zinc-800' 
                : musicState.isPlaying 
                  ? 'bg-zinc-100 border-white text-zinc-950' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-700'
            }`}
          >
            {musicState.isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
            <span className="font-bold uppercase tracking-widest text-xs">
              {musicState.isPlaying ? 'Global Pause' : 'Global Play'}
            </span>
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest opacity-50">Current Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="opacity-50">Source URL</span>
              <span className="font-mono truncate max-w-[300px]">{musicState.url || 'None'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-50">Playback</span>
              <span className="font-bold">{musicState.isPlaying ? 'Playing' : 'Paused'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
