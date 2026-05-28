import os
import random
import time
import base64
import requests
import json
from typing import Dict, Any, Optional
from PIL import Image

class VLMAnalyzer:
    """
    Abstraction layer for Loaf Evaluation VLM Analyzer.
    Supports:
    - 'mock': deterministic image-aware mock ratings (bilingual RU/EN)
    - 'cloud': Gemini API (external cloud VLM, bilingual RU/EN)
    - 'local': local Qwen-family VLM model (lazy-loaded, bilingual RU/EN)
    """
    def __init__(self, model_type: str = "mock", model_path: Optional[str] = None):
        self.model_type = model_type.lower()
        self.model_path = model_path
        self.device = "cuda" if os.environ.get("USE_CUDA", "").lower() == "true" else "cpu"
        self.model = None
        self.processor = None
        
        print(f"[LoafRate AI] Initialized VLM Analyzer with model_type='{self.model_type}', device='{self.device}'")

    def analyze_image(self, image_path: str, lang: str = "en") -> Dict[str, Any]:
        """
        Analyzes a cat image and returns a detailed Batonization (Loafness) report in requested language.
        """
        lang = lang.lower() if lang in ["ru", "en"] else "en"
        
        if self.model_type == "cloud":
            return self._run_gemini_analysis(image_path, lang)
        elif self.model_type in ["local", "qwen2-vl", "qwen3-vl"]:
            return self._run_local_vlm_analysis(image_path, lang)
        else:
            return self._run_pseudo_scientific_analysis(image_path, lang)

    def _get_loaf_prompt(self, lang: str) -> str:
        """
        Returns the optimized system prompt for loafness evaluation in the target language.
        """
        is_ru = lang.lower() == "ru"
        
        class_mapping = """
- final_score < 3.0: "Крах Батонизации"
- final_score 3.0 to 4.9: "Недобулка"
- final_score 5.0 to 6.9: "Домашний Батон"
- final_score 7.0 to 8.9: "Продвинутый Батон"
- final_score 9.0 to 9.4: "Элитный Батон"
- final_score 9.5 to 10.0: "Вознесшаяся Буханка"
        """ if is_ru else """
- final_score < 3.0: "Cat Failure"
- final_score 3.0 to 4.9: "Partial Loaf"
- final_score 5.0 to 6.9: "Domestic Loaf"
- final_score 7.0 to 8.9: "Advanced Baton"
- final_score 9.0 to 9.4: "Elite Loaf"
- final_score 9.5 to 10.0: "Ascended Bread Entity"
        """

        lang_instruction = "All comments, verdicts, and roasts MUST be written entirely in Russian (русский язык) without any English words." if is_ru else "All comments, verdicts, and roasts MUST be written entirely in English."

        prompt = f"""You are a STRICT, critical feline batonization (loafness) expert judge.
Your goal is to evaluate the cat specimen's posture and structure from the image. Do not be lenient.

CRITERIA (rate each from 0.0 to 10.0):
1. Paw Concealment (paw_concealment): Are ALL 4 paws tucked underneath the body? Any visible paw, claw, or leg requires a massive deduction.
2. Loaf Geometry (loaf_geometry): Is the body in a clean, symmetric, rounded potato/bread-loaf shape? Sprawled or flat lying cats get low scores.
3. Compression Density (compression_density): Is the body compact and tightly tucked? Loose or relaxed postures reduce density.
4. Mental State (mental_loaf_state): Look of zen, calm commitment to the loaf vs alert, tense, or active (kickstands out).
5. Fur Texture (fur_texture_rating): Coat quality and baked crust appearance (e.g. golden, caramelized, well-baked).

SCORING FORMULA:
final_score = (paw_concealment * 0.3) + (loaf_geometry * 0.25) + (compression_density * 0.2) + (mental_loaf_state * 0.15) + (fur_texture_rating * 0.1)

CLASS CLASSIFICATION GUIDELINES:
{class_mapping}

OUTPUT SPECIFICATION:
You must output a single valid JSON object containing exactly the structure below. Do not include markdown code block formatting (like ```json), and do not append any explanations before or after the JSON.
{lang_instruction}

JSON Schema:
{{
  "scores": {{
    "paw_concealment": {{"score": float, "comment": "string"}},
    "loaf_geometry": {{"score": float, "comment": "string"}},
    "compression_density": {{"score": float, "comment": "string"}},
    "mental_loaf_state": {{"score": float, "comment": "string"}},
    "fur_texture_rating": {{"score": float, "comment": "string"}}
  }},
  "final_score": float,
  "class": "string",
  "verdict": "string",
  "roast": "string"
}}
"""
        return prompt

    def _run_gemini_analysis(self, image_path: str, lang: str) -> Dict[str, Any]:
        """
        Calls Gemini API using the stable google.generativeai SDK (older, proven working version).
        """
        try:
            import google.generativeai as genai
        except ImportError:
            print("[LoafRate AI] google-generativeai package is not installed.")
            raise RuntimeError("google-generativeai package is not installed.")

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("[LoafRate AI] Warning: GEMINI_API_KEY is not set.")
            raise ValueError("GEMINI_API_KEY environment variable is not set.")

        # Модель (можно задать через GEMINI_MODEL_ID)
        gemini_model = os.environ.get("GEMINI_MODEL_ID", "gemini-2.0-flash")
        retries = int(os.environ.get("GENAI_RETRIES", "2"))

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(gemini_model)

            # Загружаем изображение
            image = Image.open(image_path)
            prompt = self._get_loaf_prompt(lang)

            last_error = None
            for attempt in range(1, retries + 1):
                try:
                    response = model.generate_content(
                        [prompt, image],
                        generation_config=genai.types.GenerationConfig(
                            response_mime_type="application/json",
                            temperature=0.2,
                        )
                    )

                    text_content = response.text
                    parsed_report = self._parse_json_report(text_content)

                    # Проверка структуры
                    for key in ["scores", "final_score", "class", "verdict", "roast"]:
                        if key not in parsed_report:
                            raise KeyError(f"Missing key in Gemini response: {key}")

                    return parsed_report

                except Exception as inner_exc:
                    last_error = inner_exc
                    if attempt < retries:
                        print(f"[LoafRate AI] Gemini request failed (attempt {attempt}/{retries}): {inner_exc}. Retrying...")
                        time.sleep(2.0)
                        continue
                    raise inner_exc

        except Exception as e:
            print(f"[LoafRate AI] Gemini SDK call failed: {e}.")
            raise e

    def _run_local_vlm_analysis(self, image_path: str, lang: str) -> Dict[str, Any]:
        """
        Loads a local Qwen-family VLM lazily and runs local inference.
        """
        import torch
        from transformers import AutoProcessor
        from qwen_vl_utils import process_vision_info
        
        if self.model is None:
            print("[LoafRate AI] Lazy loading local Qwen-family VLM model (GPU/CPU)...")
            try:
                model_path = self.model_path
                if not model_path or not os.path.exists(model_path):
                    # Check default location
                    default_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "qwen2-vl-2b")
                    if os.path.exists(default_path):
                        model_path = default_path
                    else:
                        raise ValueError(f"Model path '{model_path}' not found. Please download it first using download_model.py.")

                model_cls = self._get_local_model_class()
                self.model = model_cls.from_pretrained(
                    model_path, 
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32, 
                    device_map="auto"
                )
                self.processor = AutoProcessor.from_pretrained(model_path)
                print(f"[LoafRate AI] Model loaded successfully. Device map: {self.model.hf_device_map if hasattr(self.model, 'hf_device_map') else self.model.device}")
            except Exception as e:
                print(f"[LoafRate AI] Failed to load local VLM: {e}")
                self.model = None
                raise RuntimeError(f"Failed to load local VLM model: {e}")

        try:
            prompt = self._get_loaf_prompt(lang)

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image_path},
                        {"type": "text", "text": prompt},
                    ],
                }
            ]
            
            text = self.processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = self.processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            )
            inputs = inputs.to(self.model.device)

            with torch.no_grad():
                generated_ids = self.model.generate(**inputs, max_new_tokens=1024, temperature=0.3)
                
            generated_ids_trimmed = [
                out_ids[len(in_ids) :] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = self.processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]
            
            parsed_report = self._parse_json_report(output_text)
            return parsed_report
            
        except Exception as e:
            print(f"[LoafRate AI] Local VLM inference failed: {e}.")
            raise e

    def _get_local_model_class(self):
        """
        Resolve the best available Transformers class for Qwen-family VLMs.
        Newer model families can be supported by upgrading transformers without
        changing the analyzer code.
        """
        candidates = [
            ("transformers", "Qwen3VLForConditionalGeneration"),
            ("transformers", "Qwen2_5_VLForConditionalGeneration"),
            ("transformers", "Qwen2VLForConditionalGeneration"),
            ("transformers", "AutoModelForVision2Seq"),
        ]
        for module_name, class_name in candidates:
            try:
                module = __import__(module_name, fromlist=[class_name])
                return getattr(module, class_name)
            except (ImportError, AttributeError):
                continue
        raise ImportError("No supported local VLM class found in transformers.")

    def _parse_json_report(self, text: str) -> Dict[str, Any]:
        """
        Intelligently parses JSON from VLM response.
        Attempts multiple repair strategies (fixing trailing commas, quotes, completing braces).
        If JSON parsing fails completely, uses regular expressions to salvage and construct the report.
        Strictly validates the schema and data types expected by the frontend.
        """
        import re
        import json

        cleaned = text.strip()
        
        # 1. Strip markdown code blocks
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
            cleaned = cleaned.strip()

        # 2. Extract content between first '{' and last '}'
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx >= 0 and end_idx >= 0 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx+1]
        
        # 3. Quick replacement of smart/curly quotes
        cleaned_repl = cleaned.replace('«', '"').replace('»', '"').replace('“', '"').replace('”', '"')

        # 4. Try to repair common trailing comma issues in JSON
        cleaned_repl = re.sub(r',\s*}', '}', cleaned_repl)
        cleaned_repl = re.sub(r',\s*\]', ']', cleaned_repl)

        # 5. Try completing unbalanced braces/quotes if truncated
        brace_count = 0
        in_string = False
        escape_next = False
        for i, char in enumerate(cleaned_repl):
            if escape_next:
                escape_next = False
                continue
            if char == '\\' and in_string:
                escape_next = True
                continue
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
        
        if in_string:
            cleaned_repl += '"'
        if brace_count > 0:
            cleaned_repl += '}' * brace_count

        # Try standard parse
        parsed_report = None
        for txt in [cleaned_repl, cleaned]:
            try:
                parsed_report = json.loads(txt)
                break
            except json.JSONDecodeError:
                continue

        # 6. Regex fallback if JSON loading failed completely
        if parsed_report is None:
            print("[LoafRate AI] JSON parsing failed. Attempting regex extraction fallback...")
            parsed_report = {}
            
            # Helper to find float numbers
            def find_float(pattern, default_val=5.0):
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        return float(match.group(1))
                    except ValueError:
                        pass
                return default_val

            # Helper to find strings
            def find_string(pattern, default_val=""):
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
                return default_val

            # Extract category scores and comments
            scores = {}
            categories = [
                "paw_concealment", 
                "loaf_geometry", 
                "compression_density", 
                "mental_loaf_state", 
                "fur_texture_rating"
            ]
            
            for cat in categories:
                # Try finding score and comment for the category
                cat_block_match = re.search(rf'"{cat}"\s*:\s*\{{([^}}]+)\}}', text, re.IGNORECASE)
                score_val = 5.0
                comment_val = "Not analyzed"
                
                if cat_block_match:
                    block_text = cat_block_match.group(1)
                    score_match = re.search(r'"score"\s*:\s*([0-9.]+)', block_text)
                    if score_match:
                        score_val = float(score_match.group(1))
                    comment_match = re.search(r'"comment"\s*:\s*"([^"]+)"', block_text)
                    if comment_match:
                        comment_val = comment_match.group(1)
                else:
                    score_match = re.search(rf'"{cat}"[^}}]+?"score"\s*:\s*([0-9.]+)', text, re.IGNORECASE)
                    if score_match:
                        score_val = float(score_match.group(1))
                    comment_match = re.search(rf'"{cat}"[^}}]+?"comment"\s*:\s*"([^"]+)"', text, re.IGNORECASE)
                    if comment_match:
                        comment_val = comment_match.group(1)
                
                scores[cat] = {"score": score_val, "comment": comment_val}

            parsed_report["scores"] = scores
            parsed_report["final_score"] = find_float(r'"final_score"\s*:\s*([0-9.]+)', -1.0)
            parsed_report["class"] = find_string(r'"class"\s*:\s*"([^"]+)"', "")
            parsed_report["verdict"] = find_string(r'"verdict"\s*:\s*"([^"]+)"', "")
            parsed_report["roast"] = find_string(r'"roast"\s*:\s*"([^"]+)"', "")

        # 7. Strictly validate and repair parsed report keys & types for Frontend
        if not isinstance(parsed_report, dict):
            raise ValueError("VLM response could not be parsed into a structured report.")

        # Ensure scores exist
        if "scores" not in parsed_report or not isinstance(parsed_report["scores"], dict):
            parsed_report["scores"] = {}

        # Re-verify and repair each score category
        categories = ["paw_concealment", "loaf_geometry", "compression_density", "mental_loaf_state", "fur_texture_rating"]
        for cat in categories:
            if cat not in parsed_report["scores"] or not isinstance(parsed_report["scores"][cat], dict):
                parsed_report["scores"][cat] = {"score": 5.0, "comment": "Value could not be parsed"}
            else:
                c_data = parsed_report["scores"][cat]
                # Ensure score key exists and is float/int
                if "score" not in c_data:
                    c_data["score"] = 5.0
                else:
                    try:
                        c_data["score"] = float(c_data["score"])
                        # Clamp between 0.0 and 10.0
                        c_data["score"] = max(0.0, min(10.0, c_data["score"]))
                    except (ValueError, TypeError):
                        c_data["score"] = 5.0
                
                # Ensure comment key exists and is string
                if "comment" not in c_data or not c_data["comment"]:
                    c_data["comment"] = "Evaluation complete"
                else:
                    c_data["comment"] = str(c_data["comment"])

        # Validate final_score (recalculate if invalid or missing)
        try:
            parsed_report["final_score"] = float(parsed_report.get("final_score", -1))
        except (ValueError, TypeError):
            parsed_report["final_score"] = -1.0

        if parsed_report["final_score"] < 0.0 or parsed_report["final_score"] > 10.0:
            # Recalculate using formula
            s = parsed_report["scores"]
            calc_score = (
                s["paw_concealment"]["score"] * 0.3 +
                s["loaf_geometry"]["score"] * 0.25 +
                s["compression_density"]["score"] * 0.2 +
                s["mental_loaf_state"]["score"] * 0.15 +
                s["fur_texture_rating"]["score"] * 0.1
            )
            parsed_report["final_score"] = round(calc_score, 2)

        # Validate class, verdict, roast are non-empty strings
        for k in ["class", "verdict", "roast"]:
            val = parsed_report.get(k, "")
            if not isinstance(val, str) or not val.strip():
                if k == "class":
                    score = parsed_report["final_score"]
                    if score < 3.0: parsed_report["class"] = "Cat Failure"
                    elif score < 5.0: parsed_report["class"] = "Partial Loaf"
                    elif score < 7.0: parsed_report["class"] = "Domestic Loaf"
                    elif score < 9.0: parsed_report["class"] = "Advanced Baton"
                    elif score < 9.5: parsed_report["class"] = "Elite Loaf"
                    else: parsed_report["class"] = "Ascended Bread Entity"
                elif k == "verdict":
                    parsed_report["verdict"] = "Standard feline loaf profile observed."
                elif k == "roast":
                    parsed_report["roast"] = "No particular comment on this loaf configuration."
            else:
                parsed_report[k] = val.strip()

        # If it is empty or default placeholders were assigned due to complete failure, raise error
        if parsed_report["verdict"] == "Standard feline loaf profile observed." and parsed_report["roast"] == "No particular comment on this loaf configuration.":
            if len(text.strip()) < 30:
                raise ValueError("The VLM response was empty or too short to contain a valid loaf assessment.")

        return parsed_report

    def _run_pseudo_scientific_analysis(self, image_path: str, lang: str) -> Dict[str, Any]:
        """
        Generates consistent, highly entertaining, pseudo-scientific scores
        partially based on real image metrics (aspect ratio, dominant color, size)
        bilingual (EN/RU).
        """
        # Simulate processing delay for realistic AI feel
        time.sleep(1.8)
        
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                aspect_ratio = width / height
                avg_color = img.resize((1, 1)).getpixel((0, 0))
                if isinstance(avg_color, tuple):
                    r, g, b = avg_color[:3]
                else:
                    r = g = b = avg_color
        except Exception as e:
            print(f"Error reading image properties: {e}")
            aspect_ratio = 1.2
            r = g = b = 128

        seed = int(aspect_ratio * 100) + r + g + b
        rng = random.Random(seed)

        # 1. Paw Concealment (tuck discipline)
        ratio_dev = abs(aspect_ratio - 1.4)
        paw_score = round(max(3.0, min(10.0, 9.5 - (ratio_dev * 4.0) + rng.uniform(-1.0, 1.0))), 1)
        
        # 2. Loaf Geometry (potato-form silhouette)
        geometry_score = round(rng.uniform(4.5, 9.8), 1)

        # 3. Compression Density (compactness)
        density_score = round(max(3.5, min(10.0, 8.0 + (aspect_ratio - 1.2) * 2.0 + rng.uniform(-1.5, 1.5))), 1)

        # 4. Mental Loaf State (combat loaf vs zen loaf)
        brightness = (r + g + b) / 3
        mental_score = round(max(2.0, min(10.0, (brightness / 25.5) + rng.uniform(-2.0, 2.0))), 1)

        # 5. Fur Texture Rating (toastedness, crust quality)
        warmth = r / (g + 1) if g < r else 1.0
        fur_score = round(max(4.0, min(10.0, 5.0 + (warmth * 3.0) + rng.uniform(-1.0, 1.0))), 1)

        final_score = round((paw_score * 0.30 + geometry_score * 0.25 + density_score * 0.20 + mental_score * 0.15 + fur_score * 0.10), 1)

        # Content localization mappings
        CLASSES = {
            "en": ["Cat Failure", "Partial Loaf", "Domestic Loaf", "Advanced Baton", "Elite Loaf", "Ascended Bread Entity"],
            "ru": ["Крах Батонизации", "Недобулка", "Домашний Батон", "Продвинутый Батон", "Элитный Батон", "Вознесшаяся Буханка"]
        }

        VERDICTS = {
            "en": [
                "Catastrophic structural failure. Complete tuck collapse, paws everywhere, tail wagging. Not a loaf, it's a crime scene.",
                "Pathetic attempt at loafing. Half-hearted pose with obvious limb leakage. Try harder.",
                "Barely acceptable loaf form. Competent but uninspiring. It's adequate, nothing more.",
                "Respectable loaf technique. Most paws hidden, decent compression. Still has room for improvement.",
                "Solid loaf execution. Form is maintained properly with minimal issues. Getting close to elite tier.",
                "Near-perfect loaf mastery. Flawless paw concealment, absolute geometric precision. Barely any flaws to criticize."
            ],
            "ru": [
                "Катастрофический провал. Лапы торчат со всех сторон, хвост трепыхается. Это не батон, это беспорядок.",
                "Жалкая попытка батонизации. Половинчатая поза с явной утечкой конечностей. Попробуй еще раз.",
                "Едва приемлемый батон. Компетентно, но скучно. Это просто адекватно, не более того.",
                "Уважаемое мастерство батонизации. Большинство лап спрятаны, приличное сжатие. Но есть еще куда расти.",
                "Твердое исполнение батона. Форма держится хорошо, минимум проблем. Близко к элитному уровню.",
                "Почти идеальное мастерство батона. Безупречное поджатие лап, абсолютная геометрическая точность. Практически без изъянов."
            ]
        }

        ROASTS = {
            "en": {
                "failure": [
                    "Catastrophic failure. Paws everywhere, no compression whatsoever. This isn't a loaf, it's an explosion.",
                    "Not even trying. This is just a cat lying down badly. Zero loaf commitment detected."
                ],
                "partial": [
                    "Lazy attempt. Some paws are hidden but others are flopping out. Inconsistent discipline.",
                    "Half measures. You can't be 'kind of' in a loaf. Either commit or don't."
                ],
                "domestic": [
                    "Acceptable but uninspired. It's a loaf, technically. But barely worth mentioning.",
                    "Competent mediocrity. Gets the job done but shows no ambition or style."
                ],
                "advanced": [
                    "Solid work here. Form is maintained well, paws are mostly hidden. Could be better, could be worse.",
                    "Respectable execution. Nearly there but still missing that final polish."
                ],
                "elite": [
                    "Excellent form. This cat knows what it's doing. Nearly flawless paw concealment.",
                    "High-quality loaf. Proper technique from start to finish. Very few criticisms."
                ],
                "ascended": [
                    "Perfection achieved. Absolutely no paw leakage, immaculate form. Nothing left to criticize.",
                    "True mastery. This cat has transcended and become one with the loaf. Exceptional."
                ]
            },
            "ru": {
                "failure": [
                    "Катастрофический провал. Лапы торчат везде, никакого сжатия. Это не батон, это взрыв.",
                    "Даже не пытается. Это просто кот, лежащий неправильно. Ноль приверженности батону."
                ],
                "partial": [
                    "Ленивая попытка. Некоторые лапы спрятаны, но другие торчат. Непоследовательная дисциплина.",
                    "Полумеры. Нельзя быть 'почти' в батоне. Либо выполняй, либо нет."
                ],
                "domestic": [
                    "Приемлемо, но неинтересно. Это батон, технически. Но едва ли стоит упоминания.",
                    "Компетентная посредственность. Выполняет свою работу, но не показывает амбиций."
                ],
                "advanced": [
                    "Твёрдая работа. Форма держится хорошо, лапы в основном спрятаны. Могло быть лучше.",
                    "Уважаемое исполнение. Почти идеально, но не хватает финального шика."
                ],
                "elite": [
                    "Отличная форма. Кот знает, что делает. Почти безупречное поджатие лап.",
                    "Качественный батон. Правильная техника от начала до конца. Минимум критики."
                ],
                "ascended": [
                    "Совершенство достигнуто. Абсолютно никакой утечки лап, безупречная форма. Критиковать нечего.",
                    "Истинное мастерство. Кот вознесся и слился с батоном. Исключительно."
                ]
            }
        }

        # Class matching
        if final_score < 3.0:
            idx = 0
            roast_key = "failure"
        elif final_score < 5.0:
            idx = 1
            roast_key = "partial"
        elif final_score < 7.0:
            idx = 2
            roast_key = "domestic"
        elif final_score < 9.0:
            idx = 3
            roast_key = "advanced"
        elif final_score < 9.5:
            idx = 4
            roast_key = "elite"
        else:
            idx = 5
            roast_key = "ascended"

        loaf_class = CLASSES[lang][idx]
        verdict = VERDICTS[lang][idx]
        roasts_pool = ROASTS[lang][roast_key]

        # Detailed comments database
        PAW_COMMENTS = {
            "en": [
                (9.0, "Absolute tuck mastery. Paws are fully vacuum-packed into the torso."),
                (7.5, "Minimal front paw leakage detected. Standard tuck discipline."),
                (5.5, "Minor kickstand leakage. Some elbow exposure."),
                (0.0, "Severe tuckcel behavior. Paws are fully deployed. Complete structural failure.")
            ],
            "ru": [
                (9.0, "Абсолютное мастерство поджатия. Лапки полностью втянуты в тело."),
                (7.5, "Обнаружена минимальная утечка передних лап. Стандартная дисциплина."),
                (5.5, "Небольшая утечка подножек. Локти слегка выставлены наружу."),
                (0.0, "Худшее поведение лапоцеля. Лапы полностью выпущены. Крах структуры.")
            ]
        }

        GEOM_COMMENTS = {
            "en": [
                (9.0, "Perfect potato-form silhouette. Aerodynamic curvature."),
                (7.5, "Strong oval silhouette. Minor protrusion near the shoulder blade."),
                (5.5, "Asymmetrical curvature. Slightly lumpy profile."),
                (0.0, "Unidentifiable geometric form. Looks more like a melted croissant.")
            ],
            "ru": [
                (9.0, "Идеальный силуэт картофельной формы. Аэродинамическая кривизна."),
                (7.5, "Четкий овальный силуэт. Небольшой выступ в районе лопатки."),
                (5.5, "Асимметричная кривизна. Немного бугристый профиль."),
                (0.0, "Неопознанная геометрическая форма. Больше похоже на растаявший круассан.")
            ]
        }

        DENSITY_COMMENTS = {
            "en": [
                (9.0, "Fully vacuum packed. Zero hollow space detected in the core."),
                (7.5, "High density core structure maintained. Good weight distribution."),
                (5.5, "Medium density. Fluff-to-mass ratio is slightly high."),
                (0.0, "Fluff-maxxing fraud. Zero core compression. Basically a cloud.")
            ],
            "ru": [
                (9.0, "Полный вакуум. Пустот в ядре тела не обнаружено."),
                (7.5, "Высокая плотность ядра сохранена. Отличное распределение веса."),
                (5.5, "Средняя плотность. Соотношение пушистости к массе слегка завышено."),
                (0.0, "Мошенничество с пушистостью. Нулевое сжатие. По сути, просто облако.")
            ]
        }

        MENTAL_COMMENTS = {
            "en": [
                (9.0, "Zen loaf state. Eyes closed, breathing synchronized, completely unbothered."),
                (7.0, "Alert but stable. Domestic awareness is active, but loaf form is steady."),
                (5.0, "Combat loaf tendencies present. Prepared for sudden zoomies."),
                (0.0, "Stress-loafing. Eyes wide, pupils dilated. Fully prepared to bite ankles.")
            ],
            "ru": [
                (9.0, "Состояние дзен-батона. Глаза прикрыты, дыхание ровное, полное спокойствие."),
                (7.0, "Насторожен, но стабилен. Внимание активно, но форма батона держится."),
                (5.0, "Присутствуют признаки боевого батона. Готов к внезапному тыгыдыку."),
                (0.0, "Стрессовая батонизация. Глаза по полтиннику, зрачки расширены. Готов кусать за пятки.")
            ]
        }

        FUR_COMMENTS = {
            "en": [
                (9.0, "Premium toasted crust. Perfect oven-spring color distribution."),
                (7.5, "Evenly baked coat. High-aesthetic shine."),
                (5.5, "Slightly under-baked or patchy crust color."),
                (0.0, "Raw dough energy. Zero toastiness or over-charred chaos.")
            ],
            "ru": [
                (9.0, "Превосходная поджаристая корочка. Идеальный цвет выпечки."),
                (7.5, "Равномерно пропеченная шерстка. Отличный эстетический блеск."),
                (5.5, "Слегка недопеченный или неравномерный цвет корочки."),
                (0.0, "Энергия сырого теста. Ноль поджаристости или хаотичный подпал.")
            ]
        }

        def get_comment(score_val, comments_list):
            for limit, comment in comments_list:
                if score_val >= limit:
                    return comment
            return comments_list[-1][1]

        return {
            "scores": {
                "paw_concealment": {
                    "score": paw_score,
                    "comment": get_comment(paw_score, PAW_COMMENTS[lang])
                },
                "loaf_geometry": {
                    "score": geometry_score,
                    "comment": get_comment(geometry_score, GEOM_COMMENTS[lang])
                },
                "compression_density": {
                    "score": density_score,
                    "comment": get_comment(density_score, DENSITY_COMMENTS[lang])
                },
                "mental_loaf_state": {
                    "score": mental_score,
                    "comment": get_comment(mental_score, MENTAL_COMMENTS[lang])
                },
                "fur_texture_rating": {
                    "score": fur_score,
                    "comment": get_comment(fur_score, FUR_COMMENTS[lang])
                }
            },
            "final_score": final_score,
            "class": loaf_class,
            "verdict": verdict,
            "roast": rng.choice(roasts_pool)
        }
