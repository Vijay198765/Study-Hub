import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

interface FirebaseSetupGuideProps {
  errorType: 'auth' | 'firestore' | 'both';
  projectId: string;
}

export default function FirebaseSetupGuide({ errorType, projectId }: FirebaseSetupGuideProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="max-w-2xl w-full bg-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Firebase Setup Required</h2>
            <p className="text-white/40 text-sm">Your application needs a few dashboard settings enabled to work correctly.</p>
          </div>
        </div>

        <div className="space-y-6">
          {(errorType === 'auth' || errorType === 'both') && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold text-white">Enable Anonymous Auth</h3>
              </div>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                The secret login system uses Anonymous Authentication to grant you admin access. This is currently disabled in your Firebase Console.
              </p>
              <a 
                href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neon-blue text-black rounded-xl text-xs font-bold hover:scale-105 transition-transform"
              >
                Open Auth Settings <ExternalLink size={14} />
              </a>
              <ul className="mt-4 space-y-2 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-neon-blue" /> Click "Add new provider"</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-neon-blue" /> Select "Anonymous"</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-neon-blue" /> Click "Enable" and "Save"</li>
              </ul>
            </div>
          )}

          {(errorType === 'firestore' || errorType === 'both') && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center text-neon-purple">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold text-white">Check Firestore Connection</h3>
              </div>
              <p className="text-white/60 text-sm mb-4 leading-relaxed">
                The app is having trouble reaching your Firestore database. This can happen if the database hasn't been fully provisioned or if there's a network block.
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`https://console.firebase.google.com/project/${projectId}/firestore`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neon-purple text-white rounded-xl text-xs font-bold hover:scale-105 transition-transform"
                >
                  Open Firestore Console <ExternalLink size={14} />
                </a>
                <button 
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  Refresh App
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Project ID: {projectId}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-white/40 hover:text-white text-xs font-medium transition-colors"
          >
            I've fixed it, try again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
