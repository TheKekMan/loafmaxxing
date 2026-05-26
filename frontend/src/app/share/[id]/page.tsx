"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Brain,
  Flame,
  Gauge,
  Layers,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ScoreDetail {
  score: number;
  comment: string;
}

interface AnalysisReport {
  scores: {
    paw_concealment: ScoreDetail;
    loaf_geometry: ScoreDetail;
    compression_density: ScoreDetail;
    mental_loaf_state: ScoreDetail;
    fur_texture_rating: ScoreDetail;
    [key: string]: ScoreDetail;
  };
  final_score: number;
  class: string;
  verdict: string;
  roast: string;
  image_url: string;
  filename: string;
  share_id: string;
  lang?: "en" | "ru";
  created_at?: string;
}

const LABELS = {
  en: {
    badge: "public loaf report",
    title: "LoafRate verdict",
    score: "Batone Score",
    class: "Overall Classification",
    roast: "Laboratory Roast",
    metrics: "Batonization Metrics",
    notFound: "This loaf report was not found.",
    loading: "Loading public analysis...",
    analyze: "Analyze another cat",
    paw_concealment: "Paw Concealment",
    loaf_geometry: "Loaf Geometry",
    compression_density: "Compression Density",
    mental_loaf_state: "Mental State",
    fur_texture_rating: "Fur Texture",
  },
  ru: {
    badge: "публичный отчет о батонизации",
    title: "Вердикт LoafRate",
    score: "Индекс Батона",
    class: "Классификация",
    roast: "Лабораторный прожар",
    metrics: "Метрики батонизации",
    notFound: "Этот отчет о батонизации не найден.",
    loading: "Загружаем публичный анализ...",
    analyze: "Оценить другого кота",
    paw_concealment: "Скрытие лапок",
    loaf_geometry: "Геометрия",
    compression_density: "Плотность",
    mental_loaf_state: "Состояние",
    fur_texture_rating: "Текстура",
  },
};

const CATEGORY_ICONS = {
  paw_concealment: ShieldAlert,
  loaf_geometry: Layers,
  compression_density: Gauge,
  mental_loaf_state: Brain,
  fur_texture_rating: Flame,
};

export default function SharedReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      try {
        const response = await fetch(`${API_BASE_URL}/reports/${params.id}`);
        if (!response.ok) {
          throw new Error("Report not found");
        }
        const data = (await response.json()) as AnalysisReport;
        if (!cancelled) {
          setReport(data);
        }
      } catch {
        if (!cancelled) {
          setError("not_found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (params.id) {
      loadReport();
    }

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const lang = report?.lang === "en" ? "en" : "ru";
  const t = LABELS[lang];

  const chartData = useMemo(() => {
    if (!report) return [];
    return Object.entries(report.scores).map(([key, value]) => ({
      subject: t[key as keyof typeof t] || key,
      score: value.score,
      fullMark: 10,
    }));
  }, [report, t]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden cyber-grid">
      <div className="absolute inset-0 pointer-events-none scanline" />

      <header className="relative z-10 w-full glass-panel border-b border-orange-500/10 py-4 px-4 md:px-12 flex items-center justify-between gap-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-zinc-300 hover:text-orange-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-black">
            L
          </div>
          <span className="font-orbitron font-extrabold text-lg md:text-xl tracking-wider bg-gradient-to-r from-orange-500 to-amber-300 text-transparent bg-clip-text">
            LOAFRATE
          </span>
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-3 py-2 rounded-lg bg-zinc-900 border border-orange-500/15 text-xs font-mono text-zinc-300 hover:border-orange-500/40 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.analyze}</span>
        </button>
      </header>

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 md:py-14">
        {loading && (
          <div className="glass-panel rounded-xl border border-orange-500/15 p-8 text-center text-zinc-400 font-mono">
            <Activity className="w-5 h-5 mx-auto mb-3 text-orange-400 animate-spin" />
            {t.loading}
          </div>
        )}

        {!loading && error && (
          <div className="glass-panel rounded-xl border border-red-500/20 p-8 text-center">
            <p className="text-red-300 font-orbitron font-bold">{t.notFound}</p>
          </div>
        )}

        {!loading && report && (
          <div className="space-y-6">
            <section className="text-center flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-xs font-mono uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.badge}</span>
              </div>
              <h1 className="font-orbitron font-black text-3xl md:text-6xl text-white text-glow-orange leading-tight">
                {t.title}
              </h1>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 glass-panel rounded-2xl border border-orange-500/15 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_BASE_URL}${report.image_url}`}
                  alt="Evaluated cat"
                  className="w-full aspect-square object-cover bg-black"
                />
                <div className="p-6 bg-zinc-950/40 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">{t.class}</p>
                      <p className="font-orbitron text-xl font-extrabold text-orange-400 leading-tight break-words">
                        {report.class}
                      </p>
                    </div>
                    <div className="w-20 h-20 rounded-full border-2 border-orange-500/30 bg-orange-950/20 flex flex-col items-center justify-center shrink-0 shadow-glow">
                      <span className="font-orbitron font-black text-2xl text-orange-400">{report.final_score.toFixed(1)}</span>
                      <span className="text-[9px] font-mono text-zinc-400">/10</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{report.verdict}</p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel rounded-2xl border border-orange-500/15 p-6">
                  <div className="flex items-center gap-2 text-red-400 border-b border-red-500/10 pb-3 mb-4">
                    <Flame className="w-4 h-4" />
                    <span className="font-orbitron font-bold text-xs uppercase">{t.roast}</span>
                  </div>
                  <blockquote className="text-zinc-200 italic leading-relaxed">
                    &ldquo;{report.roast}&rdquo;
                  </blockquote>
                </div>

                <div className="glass-panel rounded-2xl border border-orange-500/15 p-6">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase border-b border-orange-500/10 pb-3 mb-4">
                    {t.metrics}
                  </p>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke="rgba(255, 140, 0, 0.12)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#52525b", fontSize: 9 }} />
                        <Radar dataKey="score" stroke="#ff8c00" fill="#ff8c00" fillOpacity={0.3} dot={{ r: 4, strokeWidth: 1 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {Object.entries(report.scores).map(([key, value]) => {
                const Icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS] || Gauge;
                const label = t[key as keyof typeof t] || key;
                return (
                  <div key={key} className="glass-panel rounded-xl border border-orange-500/15 p-4 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="w-4 h-4 text-orange-400 shrink-0" />
                      <span className="font-orbitron font-black text-orange-400">{value.score.toFixed(1)}</span>
                    </div>
                    <h2 className="mt-3 font-orbitron font-bold text-sm text-white uppercase leading-tight break-words">
                      {label}
                    </h2>
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed break-words">
                      {value.comment}
                    </p>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
