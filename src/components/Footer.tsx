import React from 'react';
import { Github, Twitter, Instagram, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark-bg border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-display font-bold text-white mb-1">Study-hub</h3>
          <p className="text-xs text-neon-blue font-bold uppercase tracking-widest mb-4">Owner: Vijay Ninama</p>
          <p className="text-white/50 max-w-md mb-6">
            Empowering students with futuristic learning tools and high-quality study materials. 
            Join our mission to revolutionize education.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-neon-blue/20 hover:text-neon-blue transition-all">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-neon-blue/20 hover:text-neon-blue transition-all">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-neon-blue/20 hover:text-neon-blue transition-all">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-white/50">
            <li><a href="/" className="hover:text-neon-blue transition-colors">Home</a></li>
            <li><a href="/classes" className="hover:text-neon-blue transition-colors">Classes</a></li>
            <li><a href="/tips" className="hover:text-neon-blue transition-colors">Study Tips</a></li>
            <li><a href="/login" className="hover:text-neon-blue transition-colors">Admin Login</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Contact</h4>
          <ul className="space-y-2 text-white/50">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@vijayninama.com</li>
            <li className="text-xs mt-4">Made with <Heart className="w-3 h-3 inline text-neon-pink" /> for students worldwide.</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/5 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} Study-hub by Vijay Ninama. All rights reserved.
      </div>
    </footer>
  );
}
