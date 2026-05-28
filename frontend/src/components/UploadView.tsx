import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileImage, RotateCcw, Brain, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StepType } from "../types";

interface UploadViewProps {
  setStep: (s: StepType) => void;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (p: string | null) => void;
  errorMsg: string | null;
  setErrorMsg: (e: string | null) => void;
  startAnalysis: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  setStep,
  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
  errorMsg,
  setErrorMsg,
  startAnalysis,
}) => {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setErrorMsg(t("errorImage"));
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
        setErrorMsg(t("errorImage"));
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
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
            <h3 className="font-orbitron font-bold text-lg text-white">{t("uploadTitle")}</h3>
          </div>
          <button 
            onClick={() => setStep("landing")}
            className="text-xs font-mono text-zinc-400 hover:text-orange-400 transition-colors"
          >
            {t("cancel")}
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
              <p className="text-zinc-200 font-semibold text-sm">{t("dragDrop")}</p>
              <p className="text-zinc-500 text-xs mt-1">{t("browse")}</p>
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
                title={t("cancel")}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center space-x-2 justify-between text-xs font-mono text-zinc-500 bg-black/25 px-3 py-2 rounded-lg border border-orange-500/5">
              <span className="truncate max-w-[280px]">{t("fileLabel")} {imageFile?.name}</span>
              <span>{t("sizeLabel")} {((imageFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</span>
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
          <span>{t("submitButton")}</span>
        </button>
      </div>
    </motion.div>
  );
};
