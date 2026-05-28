import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t border-orange-500/10 py-6 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-zinc-500 z-10 space-y-4 md:space-y-0">
      <div>
        <span>LOAFRATE V1.0.0-MVP © 2026. ALL RIGHTS RESERVED.</span>
      </div>
      <div className="flex space-x-6">
        <span className="hover:text-orange-400 transition-colors cursor-help">NEURAL LOAFNET PROTOCOL</span>
        <span className="hover:text-orange-400 transition-colors cursor-help">TERMS OF ASCENSION</span>
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-orange-400 transition-colors"
        >
          INTERNATIONAL BREAD INST.
        </a>
      </div>
    </footer>
  );
};
