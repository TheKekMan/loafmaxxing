import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RotateCcw, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StepType } from "../types";

interface ErrorViewProps {
  errorMsg: string | null;
  retry: () => void;
  setStep: (step: StepType) => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ errorMsg, retry, setStep }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-xl"
    >
      <div className="glass-panel rounded-2xl border border-red-500/20 p-8 flex flex-col items-center gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="font-orbitron text-2xl text-white">{t("errorScreenTitle")}</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">{t("errorScreenSubtitle")}</p>
          <p className="text-xs font-mono uppercase tracking-[0.35em] text-orange-300">{t("errorCode")}</p>
          {errorMsg ? (
            <div className="mt-2 rounded-2xl border border-orange-500/20 bg-orange-950/30 px-4 py-3 text-sm text-orange-100 leading-relaxed">
              {errorMsg}
            </div>
          ) : null}
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2">
          <button
            onClick={() => setStep("upload")}
            className="w-full rounded-2xl border border-orange-500/20 bg-zinc-900/90 px-4 py-3 text-sm font-semibold text-zinc-200 hover:border-orange-400/40 hover:text-white transition"
          >
            <RotateCcw className="inline-block mr-2 -mb-0.5 w-4 h-4" />
            {t("changeImageButton")}
          </button>
          <button
            onClick={retry}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-semibold text-black hover:brightness-110 transition"
          >
            <Repeat className="inline-block mr-2 -mb-0.5 w-4 h-4" />
            {t("retryButton")}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
