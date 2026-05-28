import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LangType } from "../types";

interface AnalyzingViewProps {
  lang: LangType;
  imagePreview: string | null;
  loadingProgress: number;
  loadingMsgIndex: number;
}

export const AnalyzingView: React.FC<AnalyzingViewProps> = ({
  imagePreview,
  loadingProgress,
  loadingMsgIndex,
}) => {
  const { t } = useTranslation();
  const loadingMessages = t("loading", { returnObjects: true }) as string[];
  const activeMessage = Array.isArray(loadingMessages) 
    ? loadingMessages[loadingMsgIndex] 
    : "";

  return (
    <motion.div
      key="analyzing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-xl flex flex-col items-center justify-center space-y-8"
    >
      {/* Scanning visual */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-orange-500/30 bg-black shadow-glow max-w-md">
        {imagePreview && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imagePreview}
            alt="Scanning specimen"
            className="w-full h-full object-cover opacity-60 filter blur-[0.5px]"
          />
        )}
        {/* Horizontal moving laser line */}
        <motion.div 
          className="absolute left-0 w-full h-[3px] laser-line"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Scanning reticle grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none flex flex-col justify-between p-4">
          <div className="flex justify-between font-mono text-[9px] text-orange-400">
            <span>SYS_SCAN_V1.09</span>
            <span>FRAME_CAP_OK</span>
          </div>
          <div className="flex justify-between font-mono text-[9px] text-orange-400">
            <span>GRID_MATRIX_LOCKED</span>
            <span>AI_INF_RUNNING</span>
          </div>
        </div>
      </div>

      {/* Progress and status messages */}
      <div className="w-full max-w-md text-center space-y-4">
        <div className="flex justify-between items-center text-xs font-mono text-zinc-400">
          <span className="flex items-center space-x-1 min-w-0">
            <Activity className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />
            <span className="truncate">
              {t("status")} {activeMessage}
            </span>
          </span>
          <span>{loadingProgress}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-950 rounded-full border border-orange-500/10 overflow-hidden p-[2px]">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
            style={{ width: `${loadingProgress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest pt-2">
          {t("compiling")}
        </p>
      </div>
    </motion.div>
  );
};
