import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      sysActive: "NEURAL LOAF LAB: ACTIVE",
      sysActiveShort: "SYS: ACTIVE",
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
      
      cred1Title: "Neural Loaf Networks",
      cred1Val: "99.8% Accuracy",
      cred1Desc: "Trained on millions of loafed and failed bread specimens.",
      
      cred2Title: "International Bread Institute",
      cred2Val: "Certified Lab",
      cred2Desc: "100% compliant with standard baguettes and boules.",
      
      cred3Title: "Tuckcel Elimination",
      cred3Val: "Instant Roast",
      cred3Desc: "Identify and eliminate lazy kickstand posture immediately.",

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
      
      errorScreenTitle: "ANALYSIS FAILURE",
      errorScreenSubtitle: "Neural loaf inference encountered an unrecoverable anomaly.",
      errorCode: "ERR_LOAF_INFERENCE",
      retryButton: "RETRY ANALYSIS",
      changeImageButton: "USE DIFFERENT IMAGE",

      compiling: "NEURAL COMPILING - DO NOT SHUT DOWN SYSTEM",
      status: "STATUS:",

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
      
      categories: {
        paw_concealment: {
          label: "Paw Concealment",
          term: "tuckcel vs breadmogger",
          desc: "Measures the visibility and leakage of the paws. A true elite breadmogger fully conceals all extremities in the shadow dimension."
        },
        loaf_geometry: {
          label: "Loaf Geometry",
          term: "potato-form profile",
          desc: "Evaluates the overall 3D curvature and symmetry. The ideal form is a smooth, continuous cylinder with no angular anomalies."
        },
        compression_density: {
          label: "Compression Density",
          term: "vacuum packed index",
          desc: "Measures the compactness. Higher compression values indicate a tight, aerodynamic structure with no air pockets."
        },
        mental_loaf_state: {
          label: "Mental State",
          term: "zen loaf vs combat loaf",
          desc: "Analyzes the feline's neurological state. Zen state yields perfect loaf composure. Combat state indicates active kickstands."
        },
        fur_texture_rating: {
          label: "Fur Texture",
          term: "sourdough crust rating",
          desc: "Rates the outer coat toastiness. A high rating represents a beautifully caramelized, oven-baked texture."
        }
      },
      
      loading: [
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
      ]
    }
  },
  ru: {
    translation: {
      sysActive: "НЕЙРОЛАБОРАТОРИЯ БАТОНА: АКТИВНА",
      sysActiveShort: "СИС: АКТИВНА",
      badge: "исследовательская лаборатория в стиле looksmaxxing",
      subtitle: "Продвинутый ИИ-анализ батонизации",
      description: "Зачем оценивать характер кота, если можно проверить его структурную целостность? Наши передовые ИИ-модели вычисляют ",
      descriptionHighlight1: "векторы скрытия лапок",
      descriptionHighlight2: "геометрию картофельного силуэта",
      descriptionHighlight3: "плотность сжатия",
      descriptionAnd: ", ",
      descriptionAnd2: " и ",
      descriptionEnd: " с псевдонаучной точностью.",
      ctaButton: "НАЧАТЬ ОЦЕНКУ",
      
      cred1Title: "Нейросети Батонизации",
      cred1Val: "Точность 99.8%",
      cred1Desc: "Обучено на миллионах идеальных батонов и провальных булок.",
      
      cred2Title: "Институт Хлебобулочных Изделий",
      cred2Val: "Сертифицированный лаб",
      cred2Desc: "Полное соответствие стандартам багетов и чиабатт.",
      
      cred3Title: "Борьба с лапоцелями",
      cred3Val: "Мгновенный розжиг",
      cred3Desc: "Быстрое обнаружение и осуждение ленивой осанки выставленных лапок.",

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

      errorScreenTitle: "ОШИБКА АНАЛИЗА",
      errorScreenSubtitle: "Нейросеть не смогла завершить обработку изображения. Попробуйте ещё раз.",
      errorCode: "Код ошибки: батон-анализа",
      retryButton: "ПОВТОРИТЬ АНАЛИЗ",
      changeImageButton: "ВЫБРАТЬ ДРУГОЕ ИЗОБРАЖЕНИЕ",

      compiling: "НЕЙРОСЕТЕВАЯ КОМПИЛЯЦИЯ - НЕ ВЫКЛЮЧАЙТЕ СИСТЕМУ",
      status: "СТАТУС:",

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
      
      categories: {
        paw_concealment: {
          label: "Скрытие Лапок",
          term: "лапоцель против хлебомога",
          desc: "Измеряет видимость и утечку лап. Настоящий элитный хлебомог полностью прячет конечности в теневое измерение."
        },
        loaf_geometry: {
          label: "Геометрия",
          term: "картофельный силуэт",
          desc: "Оценивает общую трехмерную кривизну и симметрию. Идеальная форма — гладкий непрерывный цилиндр без угловых аномалий."
        },
        compression_density: {
          label: "Плотность Сжатия",
          term: "индекс вакуумной упаковки",
          desc: "Определяет компактность. Более высокие значения сжатия указывают на плотную, авиодинамичную структуру без воздушных карманов."
        },
        mental_loaf_state: {
          label: "Состояние",
          term: "дзен-батон против боевого",
          desc: "Анализирует неврологическое состояние кошачьего. Дзен-состояние дает безупречное самообладание батона. Боевое состояние указывает на выпущенные лапки-подпорки."
        },
        fur_texture_rating: {
          label: "Текстура Корочки",
          term: "рейтинг корочки чиабатты",
          desc: "Оценивает поджаристость шерсти. Высокий балл означает красивую карамелизированную текстуру, словно прямо из духовки."
        }
      },
      
      loading: [
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
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
