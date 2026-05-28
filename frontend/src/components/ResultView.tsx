import React, { useState } from "react";
import { motion } from "framer-motion";
import { Flame, RotateCcw, Share2, Check, ShieldAlert, Layers, Gauge, Brain } from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { useTranslation } from "react-i18next";
import { LangType, AnalysisReport } from "../types";

interface ResultViewProps {
  lang: LangType;
  analysisResult: AnalysisReport;
  imagePreview: string | null;
  API_BASE_URL: string;
  resetAll: () => void;
  openSharePage: () => void;
  copied: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({
  lang,
  analysisResult,
  imagePreview,
  API_BASE_URL,
  resetAll,
  openSharePage,
  copied,
}) => {
  const { t } = useTranslation();
  const isRu = lang === "ru";
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("paw_concealment");

  const categoryMeta = {
    paw_concealment: {
      label: t("categories.paw_concealment.label"),
      icon: ShieldAlert,
      term: t("categories.paw_concealment.term"),
      desc: t("categories.paw_concealment.desc")
    },
    loaf_geometry: {
      label: t("categories.loaf_geometry.label"),
      icon: Layers,
      term: t("categories.loaf_geometry.term"),
      desc: t("categories.loaf_geometry.desc")
    },
    compression_density: {
      label: t("categories.compression_density.label"),
      icon: Gauge,
      term: t("categories.compression_density.term"),
      desc: t("categories.compression_density.desc")
    },
    mental_loaf_state: {
      label: t("categories.mental_loaf_state.label"),
      icon: Brain,
      term: t("categories.mental_loaf_state.term"),
      desc: t("categories.mental_loaf_state.desc")
    },
    fur_texture_rating: {
      label: t("categories.fur_texture_rating.label"),
      icon: Flame,
      term: t("categories.fur_texture_rating.term"),
      desc: t("categories.fur_texture_rating.desc")
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 9.5) return "text-amber-400 text-glow-orange";
    if (score >= 9.0) return "text-yellow-400";
    if (score >= 7.0) return "text-orange-400";
    if (score >= 5.0) return "text-zinc-300";
    return "text-red-500 text-glow-red";
  };

  const getLoafClassColor = (className: string) => {
    const isAscended = className === "Ascended Bread Entity" || className === "Вознесшаяся Буханка";
    const isElite = className === "Elite Loaf" || className === "Элитный Батон";
    const isAdvanced = className === "Advanced Baton" || className === "Продвинутый Батон";
    const isDomestic = className === "Domestic Loaf" || className === "Домашний Батон";
    const isPartial = className === "Partial Loaf" || className === "Недобулка";

    if (isAscended) {
      return "from-amber-400 to-orange-500 text-transparent bg-clip-text font-extrabold tracking-wider text-glow-orange";
    } else if (isElite) {
      return "from-yellow-400 to-amber-500 text-transparent bg-clip-text font-bold";
    } else if (isAdvanced) {
      return "from-orange-400 to-amber-400 text-transparent bg-clip-text font-semibold";
    } else if (isDomestic) {
      return "text-zinc-200";
    } else if (isPartial) {
      return "text-zinc-400";
    } else {
      return "text-red-500 font-medium";
    }
  };

  const getChartData = () => {
    const s = analysisResult.scores;
    return [
      { subject: t("categories.paw_concealment.label"), score: s.paw_concealment.score, fullMark: 10 },
      { subject: t("categories.loaf_geometry.label"), score: s.loaf_geometry.score, fullMark: 10 },
      { subject: t("categories.compression_density.label"), score: s.compression_density.score, fullMark: 10 },
      { subject: t("categories.mental_loaf_state.label"), score: s.mental_loaf_state.score, fullMark: 10 },
      { subject: t("categories.fur_texture_rating.label"), score: s.fur_texture_rating.score, fullMark: 10 },
    ];
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl space-y-6"
    >
      {/* Top Summary Card */}
      <div className="glass-panel rounded-2xl border border-orange-500/15 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-orange-500/20 flex-shrink-0 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${API_BASE_URL}${analysisResult.image_url}`}
              onError={(e) => {
                if (imagePreview) {
                  e.currentTarget.src = imagePreview;
                }
              }}
              alt="Analyzed specimen thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h3 className={`font-orbitron font-extrabold text-white leading-tight break-words ${isRu ? "text-base md:text-lg tracking-normal" : "text-xl"}`}>{t("evalCompleted")}</h3>
            <p className={`text-xs font-mono text-zinc-500 uppercase mt-0.5 ${isRu ? "tracking-normal" : "tracking-wider"}`}>
              {t("specimenId")} {analysisResult.filename.slice(0, 16)}...
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openSharePage}
            className="px-4 py-2.5 bg-zinc-900 border border-orange-500/10 hover:border-orange-500/30 text-xs font-mono text-zinc-300 hover:text-white rounded-lg flex items-center space-x-2 transition-all min-h-10 animate-fade-in"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t("copiedReport")}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>{t("shareReport")}</span>
              </>
            )}
          </button>
          <button
            onClick={resetAll}
            className={`px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-black font-orbitron font-bold text-xs ${isRu ? "tracking-normal" : "tracking-wider"} rounded-lg flex items-center space-x-2 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] min-h-10`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("analyzeAnother")}</span>
          </button>
        </div>
      </div>

      {/* Main Report Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT BLOCK (5 columns): Main Stats, Image & Roast */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Photo & Score Panel */}
          <div className="glass-panel rounded-2xl border border-orange-500/15 overflow-hidden flex flex-col">
            {/* The Cat Image */}
            <div className="relative aspect-square w-full bg-black/40 flex items-center justify-center border-b border-orange-500/10 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_BASE_URL}${analysisResult.image_url}`}
                onError={(e) => {
                  if (imagePreview) {
                    e.currentTarget.src = imagePreview;
                  }
                }}
                alt="Evaluated cat"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(255,140,0,0.15)_95%)] bg-[length:100%_24px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>

            {/* Overall Score Details (Fixed layout so long titles and text wrap correctly) */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-zinc-950/40 w-full min-w-0">
              <div className="min-w-0 flex-1">
                <span className={`text-[10px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} block`}>
                  {t("overallClass")}
                </span>
                <span className={`text-xl md:text-2xl font-orbitron font-extrabold block mt-1 leading-tight break-words ${getLoafClassColor(analysisResult.class)}`}>
                  {analysisResult.class}
                </span>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed break-words whitespace-normal">
                  {analysisResult.verdict}
                </p>
              </div>
              <div className="text-center flex-shrink-0 self-center sm:self-auto">
                <span className={`text-[9px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-wider"} block`}>
                  {t("batoneScore")}
                </span>
                <div className="w-16 h-16 rounded-full border-2 border-orange-500/30 flex flex-col items-center justify-center bg-orange-950/20 shadow-glow mt-1 mx-auto">
                  <span className="text-xl font-orbitron font-black text-orange-400">
                    {analysisResult.final_score.toFixed(1)}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 -mt-1">/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roast Commentary Panel */}
          <div className="glass-panel rounded-2xl border border-orange-500/15 p-6 flex flex-col space-y-3 relative overflow-hidden bg-gradient-to-br from-zinc-900/60 to-red-950/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full filter blur-xl pointer-events-none" />
            <div className="flex items-center space-x-2 text-red-400 border-b border-red-500/10 pb-2">
              <Flame className="w-4 h-4 text-glow-red" />
              <span className={`font-orbitron font-bold text-xs ${isRu ? "tracking-normal" : "tracking-widest"} uppercase break-words`}>{t("labRoast")}</span>
            </div>
            <blockquote className="italic text-zinc-300 text-sm leading-relaxed pt-1">
              &ldquo;{analysisResult.roast}&rdquo;
            </blockquote>
            <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono text-zinc-500 pt-2">
              <span>{t("ratingState")}</span>
              <span>{t("diagnosis")}</span>
            </div>
          </div>

        </div>

        {/* RIGHT BLOCK (7 columns): Radar Chart & Category Cards */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Radar Chart Display (With removed strange grey axis line) */}
          <div className="glass-panel rounded-2xl border border-orange-500/15 p-6 flex flex-col items-center justify-center">
            <span className={`self-start text-[10px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} border-b border-orange-500/10 pb-2 w-full mb-4 break-words`}>
              {t("dimensionMap")}
            </span>
            <div className="w-full h-[240px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData()}>
                  <PolarGrid stroke="rgba(255, 140, 0, 0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 10]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#52525b", fontSize: 9 }} 
                  />
                  <Radar
                     name="Cat Score"
                     dataKey="score"
                     stroke="#ff8c00"
                     fill="#ff8c00"
                     fillOpacity={0.3}
                     dot={{ r: 4, strokeWidth: 1 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Tabbed Category Details */}
          <div className="glass-panel rounded-2xl border border-orange-500/15 overflow-hidden flex flex-col">
            {/* Tab Selectors */}
            <div className="flex border-b border-orange-500/10 overflow-x-auto scrollbar-none bg-zinc-950/20">
              {Object.entries(categoryMeta).map(([key, meta]) => {
                const Icon = meta.icon;
                const score = analysisResult.scores[key]?.score || 0;
                const isActive = activeCategoryTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategoryTab(key)}
                    className={`flex-1 py-3.5 px-4 font-orbitron font-semibold text-xs ${isRu ? "tracking-normal" : "tracking-wider"} flex flex-col items-center space-y-1 border-b-2 transition-all min-w-[104px] ${
                      isActive 
                        ? "border-orange-500 text-orange-400 bg-orange-950/10" 
                        : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-zinc-500"}`} />
                    <span className="truncate max-w-full">{meta.label}</span>
                    <span className={`text-[10px] font-mono font-bold ${getScoreColorClass(score)}`}>
                      {score.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6 space-y-4">
              {Object.entries(categoryMeta).map(([key, meta]) => {
                if (activeCategoryTab !== key) return null;
                const score = analysisResult.scores[key]?.score || 0;
                const comment = analysisResult.scores[key]?.comment || "";
                return (
                  <motion.div 
                    key={key}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {/* Score header */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={`font-orbitron font-extrabold text-white uppercase leading-tight break-words ${isRu ? "text-base" : "text-lg"}`}>{meta.label}</h4>
                        <span className="text-[10px] font-mono text-orange-400/80 uppercase break-words">
                          #{meta.term}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center space-x-1.5 bg-orange-950/20 px-3 py-1 rounded-full border border-orange-500/10">
                          <span className={`font-orbitron font-black text-xl ${getScoreColorClass(score)}`}>
                            {score.toFixed(1)}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">/ 10</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {meta.desc}
                    </p>

                    {/* Commentary box */}
                    <div className="bg-zinc-950/50 rounded-xl p-4 border border-orange-500/10 flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0 animate-ping" />
                      <div>
                        <span className={`text-[10px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} block`}>{t("aiObservation")}</span>
                        <p className="text-zinc-200 text-sm mt-0.5 font-medium italic">
                          &ldquo;{comment}&rdquo;
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
