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

    def _run_gemini_analysis(self, image_path: str, lang: str) -> Dict[str, Any]:
        """
        Calls Gemini API using the official Google GenAI SDK.
        """
        try:
            import google.generativeai as genai
        except ImportError:
            print("[LoafRate AI] google-generativeai package is not installed. Falling back to mock.")
            return self._run_pseudo_scientific_analysis(image_path, lang)

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("[LoafRate AI] Warning: GEMINI_API_KEY is not set. Falling back to mock analysis.")
            return self._run_pseudo_scientific_analysis(image_path, lang)

        # Инициализация клиента (можно вынести в __init__ позже)
        genai.configure(api_key=api_key)

        # Модель (можно задать через GEMINI_MODEL_ID)
        gemini_model = os.environ.get("GEMINI_MODEL_ID", "gemini-2.5-flash")  # или gemini-2.5-pro и т.д.

        try:
            model = genai.GenerativeModel(
                model_name=gemini_model,
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                }
            )

            # Загружаем изображение
            image = Image.open(image_path)

            prompt = f"""You are a STRICT feline batonization (loafness) judge. Rate this cat specimen CRITICALLY - do NOT be lenient.
A true loaf (батон) is a SPECIFIC pose with MANDATORY requirements:
- ALL 4 paws MUST be tucked underneath the body (not extended, not partially visible)
- Tail MUST be completely hidden or wrapped around the body
- Head should be lowered or level with the body
- Entire body compressed into a compact, rectangular loaf shape
- If ANY of these are missing/wrong, deduct significantly

Analyze ONLY these parameters on a scale of 0.0 to 10.0. Be harsh:
1. Paw Concealment - Are ALL 4 paws truly hidden? Partially visible = major deduction
2. Loaf Geometry - Is the body actually in loaf pose? Not just laying - must be compressed loaf form
3. Compression Density - Is the body genuinely compact? Loose/sprawled = low score
4. Mental State - Does the cat look relaxed or tense? Is it actually committed to the loaf?
5. Fur Texture - Coat quality (separate from pose, but affects overall impression)

CRITICAL: If the cat is NOT in proper loaf pose, scores MUST be lower (5.0 max for paw/geometry/density).

Return a JSON object with this structure:
{{
  "scores": {{
    "paw_concealment": {{"score": float, "comment": "string in {lang}"}},
    "loaf_geometry": {{"score": float, "comment": "string in {lang}"}},
    "compression_density": {{"score": float, "comment": "string in {lang}"}},
    "mental_loaf_state": {{"score": float, "comment": "string in {lang}"}},
    "fur_texture_rating": {{"score": float, "comment": "string in {lang}"}}
  }},
  "final_score": float,
  "class": "string in {lang}",
  "verdict": "string in {lang}",
  "roast": "string in {lang}"
}}

Scoring formula: final_score = (paw*0.3 + geometry*0.25 + density*0.2 + mental*0.15 + fur*0.1)

Class guidelines based on final_score (STRICT):
- < 3.0: Cat Failure - Not a loaf, just a puddle
- 3.0 to 4.9: Partial Loaf - Attempting but failing
- 5.0 to 6.9: Domestic Loaf - Barely acceptable form
- 7.0 to 8.9: Advanced Baton - Legitimate form with minor issues
- 9.0 to 9.4: Elite Loaf - Proper technique, well executed
- 9.5+: Ascended Bread Entity - Perfect loaf form

Russian translations:
- Cat Failure -> "Крах Батонизации"
- Partial Loaf -> "Недобулка"
- Domestic Loaf -> "Домашний Батон"
- Advanced Baton -> "Продвинутый Батон"
- Elite Loaf -> "Элитный Батон"
- Ascended Bread Entity -> "Вознесшаяся Буханка"

Language: {lang}
If {lang}=="ru": все комментарии только на русском, без английских слов
If {lang}=="en": all comments only in English, no Russian words

JUDGE STRICTLY. DO NOT INFLATE SCORES. Base ratings on actual observable loaf form.
"""

            response = model.generate_content(
                contents=[prompt, image],
                request_options={"timeout": 25}
            )

            text_content = response.text
            parsed_report = self._parse_json_report(text_content)

            # Проверка структуры
            for key in ["scores", "final_score", "class", "verdict", "roast"]:
                if key not in parsed_report:
                    raise KeyError(f"Missing key in Gemini response: {key}")

            return parsed_report

        except Exception as e:
            print(f"[LoafRate AI] Gemini SDK call failed: {e}. Falling back to mock analysis.")
            return self._run_pseudo_scientific_analysis(image_path, lang)

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
                print("[LoafRate AI] Please run 'python download_model.py' and install local dependencies: pip install torch torchvision transformers qwen-vl-utils accelerate")
                print("[LoafRate AI] Falling back to mock analysis.")
                self.model = None
                return self._run_pseudo_scientific_analysis(image_path, lang)

        try:
            prompt = f"""Ты — крайне строгий и придирчивый судья кошачьей батонизации (loaf judge). 
Твоя задача — оценивать котов максимально жёстко и без жалости.

Настоящий "батон" (loaf) имеет СТРОГИЕ обязательные признаки:
- ВСЕ 4 лапы полностью спрятаны под телом (ни одна лапа не должна быть видна или торчать)
- Хвост полностью скрыт или плотно обёрнут вокруг тела
- Тело сильно сжато в компактный прямоугольник
- Голова опущена или на одном уровне с телом

Если хотя бы один из этих пунктов нарушен — это НЕ батон. Максимальная оценка в таком случае — 5.0.

Оценивай по шкале 0.0–10.0 ОЧЕНЬ ЖЁСТКО:

1. Paw Concealment — Все 4 лапы действительно спрятаны?
2. Loaf Geometry — Тело имеет чёткую loaf-форму или просто лежит?
3. Compression Density — Насколько сильно сжато тело?
4. Mental Loaf State — Кот расслаблен и committed к позе?
5. Fur Texture — Качество шерсти (наименее важный параметр)

Правила:
- Если кот НЕ в правильной loaf-позе → оценки paw_concealment, loaf_geometry и compression_density не выше 5.0
- Не льсти. Не оправдывай. Будь максимально критичным.
- Комментарии должны быть короткими (1-2 предложения).

Верни ТОЛЬКО валидный JSON, без всякого дополнительного текста:

{{
  "scores": {{
    "paw_concealment": {{"score": float, "comment": "короткий комментарий на {lang}"}},
    "loaf_geometry": {{"score": float, "comment": "короткий комментарий на {lang}"}},
    "compression_density": {{"score": float, "comment": "короткий комментарий на {lang}"}},
    "mental_loaf_state": {{"score": float, "comment": "короткий комментарий на {lang}"}},
    "fur_texture_rating": {{"score": float, "comment": "короткий комментарий на {lang}"}}
  }},
  "final_score": float,
  "class": "string",
  "verdict": "string",
  "roast": "string"
}}

Language: {lang}. Если ru — всё только на русском языке.
Судьи строго. Не завышай оценки.
"""

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
            print(f"[LoafRate AI] Local VLM inference failed: {e}. Falling back to mock analysis.")
            return self._run_pseudo_scientific_analysis(image_path, lang)

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
        Parse JSON from direct API JSON responses or markdown-fenced model text.
        Handles malformed, truncated JSON with better recovery strategies.
        """
        import re
        
        cleaned = text.strip()
        
        # Remove markdown code fences
        if cleaned.startswith("```"):
            cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
            cleaned = cleaned.strip()
        
        # Find the start of JSON
        if not cleaned.startswith("{"):
            start = cleaned.find("{")
            if start >= 0:
                cleaned = cleaned[start:]
        
        # Try to intelligently complete truncated JSON
        if cleaned.startswith("{"):
            # Count unmatched quotes and braces
            brace_count = 0
            in_string = False
            escape_next = False
            last_key = None
            
            for i, char in enumerate(cleaned):
                if escape_next:
                    escape_next = False
                    continue
                    
                if char == '\\' and in_string:
                    escape_next = True
                    continue
                
                if char == '"' and not escape_next:
                    in_string = not in_string
                    # Track keys for incomplete object detection
                    if not in_string and i+1 < len(cleaned) and cleaned[i+1:i+2] == ':':
                        # This was a key
                        key_start = cleaned.rfind('"', 0, i-1)
                        if key_start >= 0:
                            last_key = cleaned[key_start+1:i]
                    continue
                
                if not in_string:
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
            
            # If JSON is incomplete, try to complete it
            if in_string or brace_count > 0:
                # Close any open string
                if in_string:
                    cleaned = cleaned + '"'
                # Close any open braces
                if brace_count > 0:
                    cleaned = cleaned + "}" * brace_count
        
        # Try to parse with various fallback strategies
        parse_attempts = [
            (cleaned, "original"),
            (cleaned.replace('«', '"').replace('»', '"').replace('"', '"').replace('"', '"'), "quote_replacement"),
        ]
        
        parsed_report = None
        last_error = None
        
        for attempt_text, attempt_name in parse_attempts:
            try:
                parsed_report = json.loads(attempt_text)
                break
            except json.JSONDecodeError as e:
                last_error = e
                continue
        
        if parsed_report is None:
            # Last resort: try to extract and salvage what we can
            print(f"[LoafRate AI] JSON parsing attempts failed: {last_error}")
            print(f"[LoafRate AI] Raw response (first 500 chars): {text[:500]}")
            print(f"[LoafRate AI] Cleaned JSON (first 500 chars): {cleaned[:500]}")
            
            # Return fallback with generic scores
            parsed_report = {
                "scores": {
                    "paw_concealment": {"score": 3.0, "comment": "Parsing error - review required"},
                    "loaf_geometry": {"score": 3.0, "comment": "Parsing error - review required"},
                    "compression_density": {"score": 3.0, "comment": "Parsing error - review required"},
                    "mental_loaf_state": {"score": 3.0, "comment": "Parsing error - review required"},
                    "fur_texture_rating": {"score": 3.0, "comment": "Parsing error - review required"}
                },
                "final_score": 3.0,
                "class": "Partial Loaf",
                "verdict": "VLM parsing error - fallback scores applied",
                "roast": "Model response was truncated/malformed"
            }
            # Don't raise, just return with fallback scores
            return parsed_report
        
        # Validate required keys exist
        for key in ["scores", "final_score", "class", "verdict", "roast"]:
            if key not in parsed_report:
                # Add missing keys with defaults
                if key == "scores":
                    parsed_report["scores"] = {
                        "paw_concealment": {"score": 3.0, "comment": "Missing"},
                        "loaf_geometry": {"score": 3.0, "comment": "Missing"},
                        "compression_density": {"score": 3.0, "comment": "Missing"},
                        "mental_loaf_state": {"score": 3.0, "comment": "Missing"},
                        "fur_texture_rating": {"score": 3.0, "comment": "Missing"}
                    }
                else:
                    parsed_report[key] = f"Missing ({key})"
        
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
