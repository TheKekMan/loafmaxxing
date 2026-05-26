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
        Calls Gemini API via HTTPS using the GEMINI_API_KEY environment variable.
        """
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("[LoafRate AI] Warning: GEMINI_API_KEY is not set. Falling back to mock analysis.")
            return self._run_pseudo_scientific_analysis(image_path, lang)
        
        try:
            with open(image_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode("utf-8")
            
            # Detect MIME type
            mime_type = "image/jpeg"
            if image_path.lower().endswith(".png"):
                mime_type = "image/png"
            elif image_path.lower().endswith(".webp"):
                mime_type = "image/webp"

            # Model to use — set via GEMINI_MODEL_ID env var (default: gemini-2.5-flash)
            gemini_model = os.environ.get("GEMINI_MODEL_ID", "gemini-2.5-flash")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}"
            
            prompt = f"""You are an expert feline batonization (loafness) engineer. Rate this cat specimen in a looksmaxxing-inspired, pseudo-scientific, meme-heavy tone.
Analyze the following parameters on a scale of 0.0 to 10.0:
1. Paw Concealment (tuckcel vs breadmogger: measures how well paws and limbs are concealed)
2. Loaf Geometry (potato-form silhouette: curvature, symmetry and roundedness of the cat)
3. Compression Density (vacuum packed index: compactness and lack of hollow space)
4. Mental State (zen loaf vs combat loaf: how relaxed and unbothered the cat looks)
5. Fur Texture (sourdough crust rating: toastiness and quality of the outer coat/crust)

Return a JSON object with this exact structure:
{{
  "scores": {{
    "paw_concealment": {{"score": float, "comment": "string"}},
    "loaf_geometry": {{"score": float, "comment": "string"}},
    "compression_density": {{"score": float, "comment": "string"}},
    "mental_loaf_state": {{"score": float, "comment": "string"}},
    "fur_texture_rating": {{"score": float, "comment": "string"}}
  }},
  "final_score": float (weighted average: paw*0.3 + geometry*0.25 + density*0.2 + mental*0.15 + fur*0.1),
  "class": "string",
  "verdict": "string",
  "roast": "string"
}}

Class guidelines based on final_score:
- < 3.0: Cat Failure
- 3.0 to 4.9: Partial Loaf
- 5.0 to 6.9: Domestic Loaf
- 7.0 to 8.9: Advanced Baton
- 9.0 to 9.4: Elite Loaf
- 9.5+: Ascended Bread Entity

Language requirements:
You MUST return all strings (comments, class name, verdict, roast) in the requested language: {lang}.
If language is "ru", translate the classes exactly as:
- Cat Failure -> "Крах Батонизации"
- Partial Loaf -> "Недобулка"
- Domestic Loaf -> "Домашний Батон"
- Advanced Baton -> "Продвинутый Батон"
- Elite Loaf -> "Элитный Батон"
- Ascended Bread Entity -> "Вознесшаяся Буханка"
"""

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inlineData": {
                                    "mimeType": mime_type,
                                    "data": image_data
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }

            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=payload, headers=headers, timeout=25)
            response.raise_for_status()
            
            res_json = response.json()
            text_content = res_json["candidates"][0]["content"]["parts"][0]["text"]
            parsed_report = self._parse_json_report(text_content)
            
            # Just to guarantee structure safety
            for key in ["scores", "final_score", "class", "verdict", "roast"]:
                if key not in parsed_report:
                    raise KeyError(f"Missing key in VLM response: {key}")
                    
            return parsed_report
            
        except Exception as e:
            print(f"[LoafRate AI] Cloud VLM call failed: {e}. Falling back to mock analysis.")
            return self._run_pseudo_scientific_analysis(image_path, lang)

    def _run_local_vlm_analysis(self, image_path: str, lang: str) -> Dict[str, Any]:
        """
        Loads a local Qwen-family VLM lazily and runs local inference.
        """
        if self.model is None:
            print("[LoafRate AI] Lazy loading local Qwen-family VLM model (GPU/CPU)...")
            try:
                import torch
                from transformers import AutoProcessor
                
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
            from qwen_vl_utils import process_vision_info
            
            prompt = f"""You are an expert feline batonization (loafness) engineer. Rate this cat specimen in a looksmaxxing-inspired, pseudo-scientific, meme-heavy tone.
Analyze the following parameters on a scale of 0.0 to 10.0:
1. Paw Concealment (tuckcel vs breadmogger: measures how well paws and limbs are concealed)
2. Loaf Geometry (potato-form silhouette: curvature, symmetry and roundedness of the cat)
3. Compression Density (vacuum packed index: compactness and lack of hollow space)
4. Mental State (zen loaf vs combat loaf: how relaxed and unbothered the cat looks)
5. Fur Texture (sourdough crust rating: toastiness and quality of the outer coat/crust)

Return a JSON object with this exact structure:
{{
  "scores": {{
    "paw_concealment": {{"score": float, "comment": "string"}},
    "loaf_geometry": {{"score": float, "comment": "string"}},
    "compression_density": {{"score": float, "comment": "string"}},
    "mental_loaf_state": {{"score": float, "comment": "string"}},
    "fur_texture_rating": {{"score": float, "comment": "string"}}
  }},
  "final_score": float (weighted average: paw*0.3 + geometry*0.25 + density*0.2 + mental*0.15 + fur*0.1),
  "class": "string",
  "verdict": "string",
  "roast": "string"
}}

Class guidelines based on final_score:
- < 3.0: Cat Failure
- 3.0 to 4.9: Partial Loaf
- 5.0 to 6.9: Domestic Loaf
- 7.0 to 8.9: Advanced Baton
- 9.0 to 9.4: Elite Loaf
- 9.5+: Ascended Bread Entity

Language requirements:
You MUST return all strings (comments, class name, verdict, roast) in the requested language: {lang}.
If language is "ru", translate the classes exactly as:
- Cat Failure -> "Крах Батонизации"
- Partial Loaf -> "Недобулка"
- Domestic Loaf -> "Домашний Батон"
- Advanced Baton -> "Продвинутый Батон"
- Elite Loaf -> "Элитный Батон"
- Ascended Bread Entity -> "Вознесшаяся Буханка"
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
                generated_ids = self.model.generate(**inputs, max_new_tokens=512)
                
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
        """
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`").strip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()

        if not cleaned.startswith("{"):
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start >= 0 and end > start:
                cleaned = cleaned[start:end + 1]

        parsed_report = json.loads(cleaned)
        for key in ["scores", "final_score", "class", "verdict", "roast"]:
            if key not in parsed_report:
                raise KeyError(f"Missing key in VLM response: {key}")
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
                "Severe structural breakdown. Complete tuck failure and absolute paw leakage. This is a puddle, not a loaf.",
                "Sub-optimal compacting. Tail is visible and front limbs are displaying clear leakage.",
                "A standard, respectable household loaf. Average compactness and decent tuck discipline.",
                "Highly polished potato-form. Exceptional tuck discipline and minimal paw leakage.",
                "Masterclass in batonization. Spherical-cylindrical perfection. Paws and tail have successfully entered the shadow dimension.",
                "Sourdough ascension achieved. The cat has transcended feline form and become 100% pure bread. All limbs, tails, and ears are fully integrated."
            ],
            "ru": [
                "Критический сбой структуры. Полный провал поджатия лап и абсолютная утечка конечностей. Это лужа, а не батон.",
                "Субоптимальное сжатие. Виден хвост, а передние лапы демонстрируют явную утечку.",
                "Стандартный домашний батон. Средняя компактность и неплохая дисциплина поджатия.",
                "Отполированная картофельная форма. Исключительная дисциплина поджатия и минимальная утечка лап.",
                "Мастер-класс батонизации. Сферически-цилиндрическое совершенство. Лапки и хвост скрылись в теневом измерении.",
                "Достигнуто вознесение чиабатты! Кот превзошел кошачью форму и стал на 100% чистым хлебом. Все лапы, хвост и уши полностью интегрированы."
            ]
        }

        ROASTS = {
            "en": {
                "failure": [
                    "Unacceptable tuckcel behavior. Paws are fully extended, tail is dragging, zero core tension. Go back to loaf boot camp.",
                    "Complete structural compromise. This cat has dissolved into a liquid state. Absolute zero bread aura."
                ],
                "partial": [
                    "A classic tuckcel. Tried to loaf but left the kickstands down. 4/10 on the breadmogger scale.",
                    "Partial loaf attempt. Back paws are showing. Clearly lack the mental discipline of a true sourdough."
                ],
                "domestic": [
                    "Decent tuck, but mentally still paying taxes. Very domestic, zero cosmic energy.",
                    "Not bad, but a bit sourdough-deficient. Good for beginners, but won't be breadmogging anyone soon."
                ],
                "advanced": [
                    "Solid execution. Almost fully vacuum packed. Breadmogging 95% of domestic cats in a 5-mile radius.",
                    "Advanced batonization. Smooth contours, high density. Almost zero paw leakage detected. Respectable."
                ],
                "elite": [
                    "Elite breadmogger. Absolute tuck god. Paws are in another dimension. Highly densepilled.",
                    "Vacuum packed to absolute perfection. No leakage, pure aerodynamic loaf geometry. An absolute unit."
                ],
                "ascended": [
                    "We are witnessing a sourdough ascension. He is breadmogging the entire universe. Complete zen state achieved.",
                    "Ascended beyond physical limitations. Zero paw leakage. This isn't a cat, it's a fresh boule straight from the cosmic oven."
                ]
            },
            "ru": {
                "failure": [
                    "Недопустимое поведение лапоцеля. Лапы полностью вытянуты, хвост волочится, напряжение кора нулевое. Возвращайся в учебку батонизации.",
                    "Полный компромисс структуры. Этот кот растворился до жидкого состояния. Абсолютно нулевая аура хлеба."
                ],
                "partial": [
                    "Классический лапоцель. Пытался сжаться в батон, но оставил подножки выставленными. 4/10 по шкале хлебомога.",
                    "Попытка частичного батона. Задние лапы торчат. Очевидно отсутствие ментальной дисциплины истинного хлеба."
                ],
                "domestic": [
                    "Неплохое поджатие, но ментально всё ещё платит налоги. Слишком домашний, ноль космической энергии.",
                    "Нормально, но не хватает закваски. Хорошо для новичков, но вряд ли кого-то затмит в хлебомоггинге."
                ],
                "advanced": [
                    "Отличное исполнение. Почти полностью вакуумирован. Обходит в хлебомоггинге 95% домашних котов в радиусе 5 миль.",
                    "Продвинутая батонизация. Гладкие контуры, высокая плотность. Утечка лап почти отсутствует. Уважение."
                ],
                "elite": [
                    "Элитный хлебомог. Божественное поджатие лап. Конечности ушли в другое измерение. Заряжен плотностью.",
                    "Запакован в вакуум до абсолютного совершенства. Никакой утечки, чистая аэродинамика формы. Настоящий гигачад."
                ],
                "ascended": [
                    "Мы свидетели хлебного вознесения! Он затмил своим величием всю вселенную. Достигнуто абсолютное состояние дзен.",
                    "Вознесся над физическими ограничениями. Нулевая утечка лап. Это не кот, это свежая булка прямо из космической печи."
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
