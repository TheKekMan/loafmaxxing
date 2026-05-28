"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import "../i18n";
import { LangType, StepType, AnalysisReport } from "../types";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LandingView } from "../components/LandingView";
import { UploadView } from "../components/UploadView";
import { AnalyzingView } from "../components/AnalyzingView";
import { ResultView } from "../components/ResultView";
import { ErrorView } from "../components/ErrorView";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const { t } = useTranslation();
  const [lang, setLang] = useState<LangType>("ru");
  const [step, setStep] = useState<StepType>("landing");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisReport | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadingMessages = t("loading", { returnObjects: true }) as string[];
  const loadingCount = Array.isArray(loadingMessages) ? loadingMessages.length : 1;

  // Cycle loading messages during analysis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "analyzing") {
      interval = setInterval(() => {
        setLoadingMsgIndex((prev) => (prev + 1) % loadingCount);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [step, loadingCount]);

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
      }, 2500 * (10 / loadingCount));
    }
    return () => clearInterval(progressInterval);
  }, [step, loadingCount]);

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
        let errMsg = t("errorOverload");
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMsg = String(errData.detail);
          }
        } catch {
          errMsg = t("errorGeneral");
        }
        throw new Error(errMsg);
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
      const errorMessage = err instanceof Error ? err.message : t("errorGeneral");
      setErrorMsg(errorMessage);
      setStep("error");
    }
  };

  const resetAll = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setStep("upload");
    setErrorMsg(null);
  };

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
      <Header lang={lang} setLang={setLang} setStep={setStep} />

      {/* Main Content View Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          {step === "landing" && (
            <LandingView lang={lang} setStep={setStep} />
          )}

          {step === "upload" && (
            <UploadView 
              setStep={setStep} 
              imageFile={imageFile} 
              setImageFile={setImageFile}
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              errorMsg={errorMsg}
              setErrorMsg={setErrorMsg}
              startAnalysis={startAnalysis}
            />
          )}

          {step === "analyzing" && (
            <AnalyzingView 
              lang={lang} 
              imagePreview={imagePreview} 
              loadingProgress={loadingProgress}
              loadingMsgIndex={loadingMsgIndex}
            />
          )}

          {step === "result" && analysisResult && (
            <ResultView 
              lang={lang} 
              analysisResult={analysisResult} 
              imagePreview={imagePreview} 
              API_BASE_URL={API_BASE_URL} 
              resetAll={resetAll}
              openSharePage={openSharePage}
              copied={copied}
            />
          )}

          {step === "error" && (
            <ErrorView
              errorMsg={errorMsg}
              retry={startAnalysis}
              setStep={(nextStep: StepType) => {
                if (nextStep === "upload") {
                  setErrorMsg(null);
                }
                setStep(nextStep);
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
