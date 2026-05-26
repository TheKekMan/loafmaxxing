"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, 
  FileImage, 
  Sparkles, 
  RotateCcw, 
  Brain, 
  ChevronRight, 
  Flame, 
  Gauge, 
  ShieldAlert, 
  Layers, 
  Activity,
  Share2,
  Check,
  AlertCircle
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";

// Configuration for API endpoint
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
}

const TRANSLATIONS = {
  en: {
    sysActive: "NEURAL LOAF LAB: ACTIVE",
    sysActiveShort: "SYS: ACTIVE",
    // Landing
    badge: "looksmaxxing-inspired feline lab",
    subtitle: "Advanced AI Batonization Analysis",
    description: "Why judge your cat on personality when you can evaluate their structural integrity? Our state-of-the-art Feline VLM models calculate ",
    descriptionHighlight1: "paw concealment vectors",
    descriptionHighlight2: "potato-form geometry",
    descriptionHighlight3: "compression density",
    descriptionAnd: ", ",
    descriptionAnd2: ", and ",
    descriptionEnd: " with pseudo-scientific precision.",
    ctaButton: "INITIALIZE EVALUATION",
    
    // Fake credentials
    cred1Title: "Neural Loaf Networks",
    cred1Val: "99.8% Accuracy",
    cred1Desc: "Trained on millions of loafed and failed bread specimens.",
    
    cred2Title: "International Bread Institute",
    cred2Val: "Certified Lab",
    cred2Desc: "100% compliant with standard baguettes and boules.",
    
    cred3Title: "Tuckcel Elimination",
    cred3Val: "Instant Roast",
    cred3Desc: "Identify and eliminate lazy kickstand posture immediately.",

    // Upload
    uploadTitle: "UPLOAD CAT SPECIMEN",
    cancel: "CANCEL",
    dragDrop: "Drag and drop your cat photo here",
    browse: "or click to browse local drives",
    fileLabel: "FILE:",
    sizeLabel: "SIZE:",
    submitButton: "INITIATE BATONIZATION METRICS",
    errorImage: "Selected file must be an image (PNG, JPG, WEBP).",
    errorGeneral: "An unexpected error occurred during AI analysis.",
    errorOverload: "Failed to process the cat image. Model overloaded.",

    // Analyzing
    compiling: "NEURAL COMPILING - DO NOT SHUT DOWN SYSTEM",
    status: "STATUS:",

    // Result
    evalCompleted: "EVALUATION METRICS COMPLETED",
    specimenId: "SPECIMEN ID:",
    copiedReport: "COPIED REPORT",
    shareReport: "SHARE REPORT",
    analyzeAnother: "ANALYZE ANOTHER",
    overallClass: "Overall Classification",
    batoneScore: "Batone Score",
    labRoast: "LABORATORY ROAST",
    ratingState: "RATING STATE: MEMEPILLED",
    diagnosis: "DIAGNOSIS: BRUTAL",
    dimensionMap: "BATONIZATION DIMENSION MAP",
    aiObservation: "AI OBSERVATION",
    
    // Radar categories
    paw_concealment: "Paw Concealment",
    loaf_geometry: "Loaf Geometry",
    compression_density: "Compression Density",
    mental_loaf_state: "Mental State",
    fur_texture_rating: "Fur Texture",
  },
  ru: {
    sysActive: "НЕЙРОЛАБОРАТОРИЯ БАТОНА: АКТИВНА",
    sysActiveShort: "СИС: АКТИВНА",
    // Landing
    badge: "исследовательский лаб в стиле looksmaxxing",
    subtitle: "Продвинутый ИИ-анализ батонизации",
    description: "Зачем оценивать характер кота, если можно проверить его структурную целостность? Наши передовые ИИ-модели вычисляют ",
    descriptionHighlight1: "векторы скрытия лапок",
    descriptionHighlight2: "геометрию картофельного силуэта",
    descriptionHighlight3: "плотность сжатия",
    descriptionAnd: ", ",
    descriptionAnd2: " и ",
    descriptionEnd: " с псевдонаучной точностью.",
    ctaButton: "НАЧАТЬ ОЦЕНКУ",
    
    // Fake credentials
    cred1Title: "Нейросети Батонизации",
    cred1Val: "Точность 99.8%",
    cred1Desc: "Обучено на миллионах идеальных батонов и провальных булок.",
    
    cred2Title: "Институт Хлебобулочных Изделий",
    cred2Val: "Сертифицированный лаб",
    cred2Desc: "Полное соответствие стандартам багетов и чиабатт.",
    
    cred3Title: "Борьба с лапоцелями",
    cred3Val: "Мгновенный розжиг",
    cred3Desc: "Быстрое обнаружение и осуждение ленивой осанки выставленных лапок.",

    // Upload
    uploadTitle: "ЗАГРУЗИТЬ ОБРАЗЕЦ КОТА",
    cancel: "ОТМЕНА",
    dragDrop: "Перетащите фото котика сюда",
    browse: "или кликните для выбора файла",
    fileLabel: "ФАЙЛ:",
    sizeLabel: "РАЗМЕР:",
    submitButton: "ЗАПУСТИТЬ МЕТРИКИ БАТОНИЗАЦИИ",
    errorImage: "Выбранный файл должен быть изображением (PNG, JPG, WEBP).",
    errorGeneral: "Произошла непредвиденная ошибка при анализе ИИ.",
    errorOverload: "Не удалось обработать фото кота. Модель перегружена.",

    // Analyzing
    compiling: "НЕЙРОСЕТЕВАЯ КОМПИЛЯЦИЯ - НЕ ВЫКЛЮЧАЙТЕ СИСТЕМУ",
    status: "СТАТУС:",

    // Result
    evalCompleted: "АНАЛИЗ МЕТРИК ЗАВЕРШЕН",
    specimenId: "ID ОБРАЗЦА:",
    copiedReport: "СКОПИРОВАНО",
    shareReport: "ПОДЕЛИТЬСЯ",
    analyzeAnother: "ОЦЕНИТЬ ДРУГОГО",
    overallClass: "Общая Классификация",
    batoneScore: "Индекс Батона",
    labRoast: "ЛАБОРАТОРНЫЙ ПРОЖАР",
    ratingState: "СТАТУС: МЕМНЫЙ",
    diagnosis: "ДИАГНОЗ: ЖЁСТКИЙ",
    dimensionMap: "КАРТА ИЗМЕРЕНИЙ БАТОНИЗАЦИИ",
    aiObservation: "НАБЛЮДЕНИЕ ИИ",
    
    // Radar categories
    paw_concealment: "Скрытие Лапок",
    loaf_geometry: "Геометрия",
    compression_density: "Плотность Сжатия",
    mental_loaf_state: "Состояние",
    fur_texture_rating: "Текстура Корочки",
  }
};

const LOADING_MESSAGES = {
  en: [
    "Initializing Feline Batonization Matrix...",
    "Calculating loaf density (g/cm³)...",
    "Analyzing tuck integrity & limb exposure...",
    "Measuring bread aura & sourdough index...",
    "Checking for paw leakage & elbow deployment...",
    "Evaluating potato-form symmetry...",
    "Scanning tail retraction vectors...",
    "Processing mental state (combat vs zen loaf)...",
    "Consulting the International Bread Institute...",
    "Finalizing looksmaxxing scorecard..."
  ],
  ru: [
    "Инициализация матрицы кошачьей батонизации...",
    "Расчёт плотности батона (г/см³)...",
    "Анализ поджатия лап и торчащих конечностей...",
    "Изменение хлебной ауры и индекса закваски...",
    "Проверка утечки лапок и выставленных локтей...",
    "Оценка симметрии картофельной формы...",
    "Сканирование векторов втягивания хвоста...",
    "Определение ментального состояния (боевой vs дзен-батон)...",
    "Консультация с Международным Институтом Хлеба...",
    "Формирование итоговой карточки хлебомоггинга..."
  ]
};

export default function Home() {
  const [lang, setLang] = useState<"en" | "ru">("ru");
  const [step, setStep] = useState<"landing" | "upload" | "analyzing" | "result">("landing");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisReport | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("paw_concealment");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang];
  const isRu = lang === "ru";

  // Cycling loading messages during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "analyzing") {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES[lang].length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [step, lang]);

  // Simulating a progress bar during analysis
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (step === "analyzing") {
      setLoadingProgress(0);
      progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 98) {
            return 98; // Hold at 98 until API returns
          }
          return prev + Math.floor(Math.random() * 8) + 2;
        });
      }, 2500 * (10 / LOADING_MESSAGES[lang].length));
    }
    return () => clearInterval(progressInterval);
  }, [step, lang]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setErrorMsg(null);
      } else {
        setErrorMsg(lang === "ru" ? "Выбранный файл должен быть изображением (PNG, JPG, WEBP)." : t.errorImage);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setErrorMsg(null);
      } else {
        setErrorMsg(lang === "ru" ? "Выбранный файл должен быть изображением." : "Selected file must be an image.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const startAnalysis = async () => {
    if (!imageFile) return;

    setStep("analyzing");
    setErrorMsg(null);
    setLoadingMsgIndex(0);
    setLoadingProgress(5);

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze?lang=${lang}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(lang === "ru" ? "Не удалось обработать изображение. Модель перегружена." : t.errorOverload);
      }

      const data = (await response.json()) as AnalysisReport;
      setAnalysisResult(data);
      setLoadingProgress(100);
      
      // Short delay to show 100% completion before revealing results
      setTimeout(() => {
        setStep("result");
      }, 800);

    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : (lang === "ru" ? "Произошла непредвиденная ошибка при анализе ИИ." : t.errorGeneral);
      setErrorMsg(errorMessage);
      setStep("upload");
    }
  };

  const resetAll = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setStep("upload");
    setErrorMsg(null);
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
    if (!analysisResult) return [];
    
    const s = analysisResult.scores;
    return [
      { subject: t.paw_concealment, score: s.paw_concealment.score, fullMark: 10 },
      { subject: t.loaf_geometry, score: s.loaf_geometry.score, fullMark: 10 },
      { subject: t.compression_density, score: s.compression_density.score, fullMark: 10 },
      { subject: t.mental_loaf_state, score: s.mental_loaf_state.score, fullMark: 10 },
      { subject: t.fur_texture_rating, score: s.fur_texture_rating.score, fullMark: 10 },
    ];
  };

  const getCategoryMeta = (langKey: "en" | "ru") => ({
    paw_concealment: {
      label: langKey === "ru" ? "Скрытие Лапок" : "Paw Concealment",
      icon: ShieldAlert,
      term: langKey === "ru" ? "лапоцель против хлебомога" : "tuckcel vs breadmogger",
      desc: langKey === "ru" 
        ? "Измеряет видимость и утечку лап. Настоящий элитный хлебомог полностью прячет конечности в теневое измерение." 
        : "Measures the visibility and leakage of the paws. A true elite breadmogger fully conceals all extremities in the shadow dimension."
    },
    loaf_geometry: {
      label: langKey === "ru" ? "Геометрия" : "Loaf Geometry",
      icon: Layers,
      term: langKey === "ru" ? "картофельный силуэт" : "potato-form profile",
      desc: langKey === "ru" 
        ? "Оценивает общую трехмерную кривизну и симметрию. Идеальная форма — гладкий непрерывный цилиндр без угловых аномалий." 
        : "Evaluates the overall 3D curvature and symmetry. The ideal form is a smooth, continuous cylinder with no angular anomalies."
    },
    compression_density: {
      label: langKey === "ru" ? "Плотность Сжатия" : "Compression Density",
      icon: Gauge,
      term: langKey === "ru" ? "индекс вакуумной упаковки" : "vacuum packed index",
      desc: langKey === "ru" 
        ? "Определяет компактность. Более высокие значения сжатия указывают на плотную, аэродинамичную структуру без воздушных карманов." 
        : "Measures the compactness. Higher compression values indicate a tight, aerodynamic structure with no air pockets."
    },
    mental_loaf_state: {
      label: langKey === "ru" ? "Состояние" : "Mental State",
      icon: Brain,
      term: langKey === "ru" ? "дзен-батон против боевого" : "zen loaf vs combat loaf",
      desc: langKey === "ru" 
        ? "Анализирует неврологическое состояние кошачьего. Дзен-состояние дает безупречное самообладание батона. Боевое состояние указывает на выпущенные лапки-подпорки." 
        : "Analyzes the feline's neurological state. Zen state yields perfect loaf composure. Combat state indicates active kickstands."
    },
    fur_texture_rating: {
      label: langKey === "ru" ? "Текстура Корочки" : "Fur Texture",
      icon: Flame,
      term: langKey === "ru" ? "рейтинг корочки чиабатты" : "sourdough crust rating",
      desc: langKey === "ru" 
        ? "Оценивает поджаристость шерсти. Высокий балл означает красивую карамелизированную текстуру, словно прямо из духовки." 
        : "Rates the outer coat toastiness. A high rating represents a beautifully caramelized, oven-baked texture."
    }
  });

  const openSharePage = () => {
    if (!analysisResult) return;
    const shareUrl = `${window.location.origin}/share/${analysisResult.share_id}`;
    navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden cyber-grid">
      {/* Laser scanline overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none scanline z-0" />

      {/* Header */}
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
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded transition-colors ${
                lang === "en" ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black font-extrabold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ru")}
              className={`px-2 py-1 rounded transition-colors ${
                lang === "ru" ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black font-extrabold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              RU
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-zinc-400 bg-orange-950/20 px-3 py-1.5 rounded-full border border-orange-500/10 max-w-[42vw]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate">{t.sysActive}</span>
          </div>
        </div>
      </header>

      {/* Main Content View Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: LANDING PAGE */}
          {step === "landing" && (
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
                <span className="break-words">{t.badge}</span>
              </div>

              {/* Title Section */}
              <div className="space-y-4">
                <h1 className="font-orbitron font-black text-5xl sm:text-6xl md:text-8xl tracking-tight leading-none text-white text-glow-orange select-none">
                  LOAFRATE
                </h1>
                <h2 className={`font-orbitron font-semibold text-lg sm:text-xl md:text-3xl ${isRu ? "tracking-normal max-w-3xl" : "tracking-widest"} text-orange-400/90 uppercase text-balance leading-tight`}>
                  {t.subtitle}
                </h2>
              </div>

              {/* Fake Scientific Marketing */}
              <p className="max-w-2xl text-zinc-400 text-sm md:text-base leading-relaxed font-sans font-light">
                {t.description}
                <span className="text-orange-400 font-medium">{t.descriptionHighlight1}</span>
                {t.descriptionAnd}
                <span className="text-orange-400 font-medium">{t.descriptionHighlight2}</span>
                {t.descriptionAnd2}
                <span className="text-orange-400 font-medium">{t.descriptionHighlight3}</span>
                {t.descriptionEnd}
              </p>

              {/* Call to Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => setStep("upload")}
                  className={`group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-400 text-black font-orbitron font-extrabold ${isRu ? "text-base tracking-normal" : "text-lg tracking-wider"} rounded-lg shadow-glow hover:shadow-glow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center space-x-3 overflow-hidden`}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">{t.ctaButton}</span>
                  <ChevronRight className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>

              {/* Fake Credentials Panel */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 pt-12 md:pt-16 max-w-4xl">
                {[
                  { title: t.cred1Title, value: t.cred1Val, desc: t.cred1Desc },
                  { title: t.cred2Title, value: t.cred2Val, desc: t.cred2Desc },
                  { title: t.cred3Title, value: t.cred3Val, desc: t.cred3Desc }
                ].map((item, idx) => (
                  <div key={idx} className="glass-panel p-5 rounded-xl border border-orange-500/10 text-left hover:border-orange-500/20 transition-all duration-300 min-w-0">
                    <h4 className={`text-[11px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} break-words`}>{item.title}</h4>
                    <p className={`font-orbitron font-semibold text-orange-400 mt-1 leading-tight break-words ${isRu ? "text-base" : "text-lg"}`}>{item.value}</p>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed break-words">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: UPLOAD PAGE */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl"
            >
              <div className="glass-panel rounded-2xl border border-orange-500/15 p-6 md:p-8 flex flex-col space-y-6">
                <div className="flex justify-between items-center border-b border-orange-500/10 pb-4">
                  <div className="flex items-center space-x-2">
                    <UploadCloud className="w-5 h-5 text-orange-400" />
                    <h3 className="font-orbitron font-bold text-lg text-white">{t.uploadTitle}</h3>
                  </div>
                  <button 
                    onClick={() => setStep("landing")}
                    className="text-xs font-mono text-zinc-400 hover:text-orange-400 transition-colors"
                  >
                    {t.cancel}
                  </button>
                </div>

                {/* Error message */}
                {errorMsg && (
                  <div className="bg-red-950/20 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                {!imagePreview ? (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all duration-300 ${
                      dragActive
                        ? "border-orange-400 bg-orange-950/10 shadow-glow"
                        : "border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-950/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <div className="w-16 h-16 rounded-full bg-orange-950/30 flex items-center justify-center border border-orange-500/10">
                      <FileImage className="w-8 h-8 text-orange-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-200 font-semibold text-sm">{t.dragDrop}</p>
                      <p className="text-zinc-500 text-xs mt-1">{t.browse}</p>
                    </div>
                    <div className="text-zinc-600 text-[10px] font-mono tracking-wider pt-2">
                      JPEG, PNG, WEBP (MAX 10MB)
                    </div>
                  </div>
                ) : (
                  /* Preview Screen */
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-orange-500/20 bg-black/40 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Cat specimen preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-3 right-3 bg-black/75 hover:bg-red-600/90 text-white p-2 rounded-full border border-orange-500/10 hover:border-red-500/30 transition-all"
                        title={t.cancel}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 justify-between text-xs font-mono text-zinc-500 bg-black/25 px-3 py-2 rounded-lg border border-orange-500/5">
                      <span className="truncate max-w-[280px]">{t.fileLabel} {imageFile?.name}</span>
                      <span>{t.sizeLabel} {((imageFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  disabled={!imageFile}
                  onClick={startAnalysis}
                  className={`w-full py-4 rounded-xl font-orbitron font-extrabold text-sm tracking-wider flex items-center justify-center space-x-2 transition-all duration-300 ${
                    imageFile
                      ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 active:translate-y-0"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  <span>{t.submitButton}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: ANALYZING PAGE */}
          {step === "analyzing" && (
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
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                    <span>{t.status} {LOADING_MESSAGES[lang][loadingMsgIndex]}</span>
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
                  {t.compiling}
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 4: RESULT PAGE */}
          {step === "result" && analysisResult && (
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
                    {/* Render backend static image or fallback preview if static not loaded yet */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE_URL}${analysisResult.image_url}`}
                      onError={(e) => {
                        // Fallback if backend url isn't fully ready/resolved
                        if (imagePreview) {
                          e.currentTarget.src = imagePreview;
                        }
                      }}
                      alt="Analyzed specimen thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-orbitron font-extrabold text-white leading-tight break-words ${isRu ? "text-base md:text-lg tracking-normal" : "text-xl"}`}>{t.evalCompleted}</h3>
                    <p className={`text-xs font-mono text-zinc-500 uppercase mt-0.5 ${isRu ? "tracking-normal" : "tracking-wider"}`}>
                      {t.specimenId} {analysisResult.filename.slice(0, 16)}...
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={openSharePage}
                    className="px-4 py-2.5 bg-zinc-900 border border-orange-500/10 hover:border-orange-500/30 text-xs font-mono text-zinc-300 hover:text-white rounded-lg flex items-center space-x-2 transition-all min-h-10"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t.copiedReport}</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{t.shareReport}</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetAll}
                    className={`px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-black font-orbitron font-bold text-xs ${isRu ? "tracking-normal" : "tracking-wider"} rounded-lg flex items-center space-x-2 transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] min-h-10`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.analyzeAnother}</span>
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
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(255,140,0,0.15)_95%)] bg-[length:100%_24px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
                    </div>

                    {/* Overall Score Details */}
                    <div className="p-6 flex items-center justify-between gap-4 bg-zinc-950/40">
                      <div>
                        <span className={`text-[10px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} block`}>{t.overallClass}</span>
                        <span className={`text-lg md:text-xl font-orbitron font-extrabold block mt-0.5 leading-tight break-words ${getLoafClassColor(analysisResult.class)}`}>
                          {analysisResult.class}
                        </span>
                        <p className="text-xs text-zinc-400 mt-1 leading-snug line-clamp-2">
                          {analysisResult.verdict}
                        </p>
                      </div>
                      <div className="text-center flex-shrink-0">
                        <span className={`text-[9px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-wider"} block`}>{t.batoneScore}</span>
                        <div className="w-16 h-16 rounded-full border-2 border-orange-500/30 flex flex-col items-center justify-center bg-orange-950/20 shadow-glow mt-1">
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
                      <span className={`font-orbitron font-bold text-xs ${isRu ? "tracking-normal" : "tracking-widest"} uppercase break-words`}>{t.labRoast}</span>
                    </div>
                    <blockquote className="italic text-zinc-300 text-sm leading-relaxed pt-1">
                      &ldquo;{analysisResult.roast}&rdquo;
                    </blockquote>
                    <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] font-mono text-zinc-500 pt-2">
                      <span>{t.ratingState}</span>
                      <span>{t.diagnosis}</span>
                    </div>
                  </div>

                </div>

                {/* RIGHT BLOCK (7 columns): Radar Chart & Category Cards */}
                <div className="lg:col-span-7 flex flex-col space-y-6">
                  
                  {/* Radar Chart Display */}
                  <div className="glass-panel rounded-2xl border border-orange-500/15 p-6 flex flex-col items-center justify-center">
                    <span className={`self-start text-[10px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} border-b border-orange-500/10 pb-2 w-full mb-4 break-words`}>
                      {t.dimensionMap}
                    </span>
                    <div className="w-full h-[240px] md:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData()}>
                          <PolarGrid stroke="rgba(255, 140, 0, 0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#52525b", fontSize: 9 }} />
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
                      {Object.entries(getCategoryMeta(lang)).map(([key, meta]) => {
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
                      {Object.entries(getCategoryMeta(lang)).map(([key, meta]) => {
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
                                <span className={`text-[10px] font-mono text-zinc-500 uppercase ${isRu ? "tracking-normal" : "tracking-widest"} block`}>{t.aiObservation}</span>
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
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
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
    </div>
  );
}
