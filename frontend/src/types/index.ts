export interface ScoreDetail {
  score: number;
  comment: string;
}

export interface AnalysisReport {
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

export type LangType = "en" | "ru";
export type StepType = "landing" | "upload" | "analyzing" | "result" | "error";
