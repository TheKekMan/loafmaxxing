import React from "react";
import { useTranslation } from "react-i18next";
import { StepType, LangType } from "../types";

interface HeaderProps {
  lang: LangType;
  setLang: (l: LangType) => void;
  setStep: (s: StepType) => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, setStep }) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (newLang: LangType) => {
    setLang(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="w-full glass-panel border-b border-orange-500/10 py-4 px-4 md:px-12 flex justify-between items-center gap-4 z-10">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setStep("landing")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-black text-lg">
          L
        </div>
        <span className="font-orbitron font-extrabold text-xl tracking-wider bg-gradient-to-r from-orange-500 to-amber-300 text-transparent bg-clip-text">
          LOAFRATE
        </span>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {/* Language Switch Toggle */}
        <div className="flex items-center space-x-1 bg-zinc-900 border border-orange-500/20 rounded-lg p-0.5 text-xs font-mono">
          <button
            onClick={() => handleLanguageChange("en")}
            className={`px-2 py-1 rounded transition-colors ${
              lang === "en" ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageChange("ru")}
            className={`px-2 py-1 rounded transition-colors ${
              lang === "ru" ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black font-extrabold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            RU
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-orange-950/20 px-3 py-1.5 rounded-full border border-orange-500/10 max-w-[42vw]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="truncate">{t("sysActive")}</span>
        </div>
      </div>
    </header>
  );
};
