import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LangType, StepType } from "../types";

interface LandingViewProps {
  lang: LangType;
  setStep: (s: StepType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ lang, setStep }) => {
  const { t } = useTranslation();
  const isRu = lang === "ru";

  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl text-center flex flex-col items-center space-y-8"
    >
      {/* Badge */}
      <div className={`inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-xs font-mono ${isRu ? "tracking-normal" : "tracking-widest"} uppercase mb-2 max-w-full`}>
        <Sparkles className="w-3.5 h-3.5" />
        <span className="break-words">{t("badge")}</span>
      </div>

      {/* Title Section */}
      <div className="space-y-4">
        <h1 className="font-orbitron font-black text-5xl sm:text-6xl md:text-8xl tracking-tight leading-none text-white text-glow-orange select-none">
          LOAFRATE
        </h1>
        <h2 className={`font-orbitron font-semibold text-lg sm:text-xl md:text-3xl ${isRu ? "tracking-normal max-w-3xl" : "tracking-widest"} text-orange-400/90 uppercase text-balance leading-tight`}>
          {t("subtitle")}
        </h2>
      </div>

      {/* Fake Scientific Marketing */}
      <p className="max-w-2xl text-zinc-400 text-sm md:text-base leading-relaxed font-sans font-light">
        {t("description")}
        <span className="text-orange-400 font-medium">{t("descriptionHighlight1")}</span>
        {t("descriptionAnd")}
        <span className="text-orange-400 font-medium">{t("descriptionHighlight2")}</span>
        {t("descriptionAnd2")}
        <span className="text-orange-400 font-medium">{t("descriptionHighlight3")}</span>
        {t("descriptionEnd")}
      </p>

      {/* Call to Action Button */}
      <div className="pt-4">
        <button
          onClick={() => setStep("upload")}
          className={`group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-400 text-black font-orbitron font-extrabold ${isRu ? "text-base tracking-normal" : "text-lg tracking-wider"} rounded-lg shadow-glow hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center space-x-3 overflow-hidden`}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10">{t("ctaButton")}</span>
          <ChevronRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

      {/* Fake Credentials Panel */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 pt-12 md:pt-16 max-w-4xl">
        {[
          { title: t("cred1Title"), value: t("cred1Val"), desc: t("cred1Desc") },
          { title: t("cred2Title"), value: t("cred2Val"), desc: t("cred2Desc") },
          { title: t("cred3Title"), value: t("cred3Val"), desc: t("cred3Desc") }
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-xl border border-orange-500/10 text-left hover:border-orange-500/20 transition-all duration-300 min-w-0">
            <h4 className={`text-[11px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} break-words`}>{item.title}</h4>
            <p className={`font-orbitron font-semibold text-orange-400 mt-1 leading-tight break-words ${isRu ? "text-base" : "text-lg"}`}>{item.value}</p>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed break-words">{item.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
