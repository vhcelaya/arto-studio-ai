// SEO copy per category. Each entry is the editorial spine of the landing page.
// Keep titles under 60 chars (SEO), descriptions under 160 chars.

// Category type kept loose (string) to avoid pulling the prompts catalog
// type system. When /prompts migrates in Phase C, switch back to:
//   import type { Category } from "@/types/prompt";
export type Category =
  | "branding"
  | "graphic_design"
  | "copywriting"
  | "photography"
  | "video"
  | "ux_ui"
  | "illustration"
  | "marketing"
  | "music"
  | "architecture"
  | "fashion"
  | "creative_productivity";

export interface LearnPageConfig {
  slug: string;
  category: Category;
  title_en: string;
  title_es: string;
  meta_description_en: string;
  meta_description_es: string;
  hero_en: string;
  hero_es: string;
  intro_en: string;
  intro_es: string;
  use_cases_en: string[];
  use_cases_es: string[];
  related_keywords: string[];
}

export const LEARN_PAGES: LearnPageConfig[] = [
  {
    slug: "branding",
    category: "branding",
    title_en: "Top AI Branding Prompts for 2026 — ARTO Studio AI",
    title_es: "Mejores Prompts de Branding con IA 2026 — ARTO Studio AI",
    meta_description_en: "250 production-grade AI prompts for branding — naming, positioning, tone of voice, brand architecture, identity systems. Bilingual EN/ES, ready to ship.",
    meta_description_es: "250 prompts de IA listos para producción de branding — naming, posicionamiento, tono de voz, arquitectura de marca. Bilingüe EN/ES.",
    hero_en: "AI Branding Prompts that ship work, not slideware",
    hero_es: "Prompts de Branding con IA para producir, no para presentar",
    intro_en: "Building a brand with AI in 2026 means more than asking Claude for a tagline. You need prompts that move through naming, positioning, tone of voice, architecture decisions, and identity systems — in the right order. The 250 prompts in our Branding vertical are the ones we use at ARTO Studio AI for real client work.",
    intro_es: "Construir una marca con IA en 2026 es más que pedirle un slogan a Claude. Necesitas prompts que avanzan por naming, posicionamiento, tono de voz, arquitectura y sistemas de identidad — en el orden correcto. Los 250 prompts de nuestra vertical de Branding son los que usamos en ARTO Studio AI con clientes reales.",
    use_cases_en: ["Naming a new product or company", "Defining brand positioning against competitors", "Writing a tone-of-voice guide", "Sub-brand architecture decisions", "Brief writing for designers and copywriters"],
    use_cases_es: ["Naming de un producto o empresa nueva", "Posicionamiento frente a competidores", "Escribir guía de tono de voz", "Decidir arquitectura de sub-marcas", "Brief para diseñadores y copywriters"],
    related_keywords: ["brand naming prompts", "positioning prompts", "branding AI", "tone of voice prompts", "brand architecture"],
  },
  {
    slug: "graphic-design",
    category: "graphic_design",
    title_en: "AI Graphic Design Prompts — Social, Print, Web",
    title_es: "Prompts IA de Diseño Gráfico — Social, Print, Web",
    meta_description_en: "250 AI prompts for graphic designers — Instagram carousels, posters, brochures, presentation decks, packaging. Tested workflows in Midjourney, Recraft, Ideogram.",
    meta_description_es: "250 prompts de IA para diseñadores gráficos — carruseles de Instagram, posters, brochures, decks, packaging.",
    hero_en: "Graphic Design Prompts for working designers",
    hero_es: "Prompts de Diseño Gráfico para diseñadores que producen",
    intro_en: "AI image tools changed graphic design in 2026. The hard part isn't the tool anymore — it's writing the prompt that gets you a usable result on the first try. These 250 prompts cover Instagram carousels, posters, packaging, presentation decks, lower-thirds, social campaigns, and everything in between.",
    intro_es: "Las herramientas de imagen con IA cambiaron el diseño gráfico en 2026. Lo difícil ya no es la herramienta — es escribir el prompt que da un resultado usable al primer intento. Estos 250 prompts cubren carruseles, posters, packaging, decks, lower-thirds, campañas sociales, y todo en medio.",
    use_cases_en: ["Instagram and TikTok carousel design", "Poster and event collateral", "Packaging concepts", "Presentation slides at scale", "Social media campaign templates"],
    use_cases_es: ["Carruseles para Instagram y TikTok", "Posters y collateral para eventos", "Conceptos de packaging", "Presentaciones a escala", "Templates de campañas en redes sociales"],
    related_keywords: ["graphic design AI prompts", "midjourney design prompts", "social media prompts", "presentation design prompts"],
  },
  {
    slug: "copywriting",
    category: "copywriting",
    title_en: "AI Copywriting Prompts for Marketing and Product",
    title_es: "Prompts IA de Copywriting para Marketing y Producto",
    meta_description_en: "250 AI prompts for copywriters — landing pages, ads, product descriptions, email sequences, social posts, onboarding copy. Bilingual EN/ES.",
    meta_description_es: "250 prompts de IA para copywriters — landings, anuncios, descripciones de producto, secuencias de email, onboarding.",
    hero_en: "AI Copywriting Prompts that read like a human wrote them",
    hero_es: "Prompts de Copywriting que leen como si los hubiera escrito una persona",
    intro_en: "ChatGPT-flavored copy is dead in 2026. Buyers can spot it in a paragraph. These 250 prompts are written to make Claude or GPT-5 produce copy that sounds like a real human — with voice, point of view, and the discipline to cut filler. Tested on landing pages, ads, product launches, and email sequences.",
    intro_es: "El copy con sabor a ChatGPT está muerto en 2026. Los lectores lo detectan en un párrafo. Estos 250 prompts hacen que Claude o GPT-5 escriban copy que suena como una persona real — con voz, punto de vista y la disciplina de cortar relleno. Probados en landings, anuncios, lanzamientos y secuencias de email.",
    use_cases_en: ["Landing page hero and CTA copy", "Product descriptions for e-commerce", "Email onboarding sequences", "Ad headlines and body copy", "Social posts with personality"],
    use_cases_es: ["Hero y CTAs de landings", "Descripciones de producto para e-commerce", "Secuencias de onboarding por email", "Headlines y bodycopy de anuncios", "Posts sociales con personalidad"],
    related_keywords: ["copywriting prompts", "claude copy prompts", "marketing copy AI", "landing page copy prompts"],
  },
  {
    slug: "photography",
    category: "photography",
    title_en: "AI Photography Prompts — Portrait, Product, Editorial",
    title_es: "Prompts IA de Fotografía — Retrato, Producto, Editorial",
    meta_description_en: "250 AI prompts for photography direction — lighting, composition, mood, lens choice, location scouting briefs. Bilingual EN/ES.",
    meta_description_es: "250 prompts de IA para dirección de fotografía — iluminación, composición, mood, elección de lente, briefs de locación.",
    hero_en: "Photography Prompts for art directors and photographers",
    hero_es: "Prompts de Fotografía para directores de arte y fotógrafos",
    intro_en: "Whether you're directing a shoot, briefing a photographer, or generating reference images in Flux or Midjourney, the quality of your output depends on the quality of your prompt. These 250 prompts cover lighting setups, composition, location scouting briefs, mood references, and full editorial concepts.",
    intro_es: "Ya sea que dirijas una sesión, briefies a un fotógrafo o generes referencias en Flux o Midjourney, la calidad de tu output depende de la calidad de tu prompt. Estos 250 prompts cubren setups de iluminación, composición, briefs de locación, referencias de mood y conceptos editoriales completos.",
    use_cases_en: ["Briefing a portrait or product shoot", "Generating mood boards in image AI", "Lighting setup specifications", "Editorial campaign concepts", "Location scouting briefs"],
    use_cases_es: ["Brief para sesiones de retrato o producto", "Generar mood boards con IA", "Especificaciones de iluminación", "Conceptos de campañas editoriales", "Briefs de locación"],
    related_keywords: ["photography prompts", "midjourney photo prompts", "art direction prompts", "lighting prompts"],
  },
  {
    slug: "video",
    category: "video",
    title_en: "AI Video Prompts — Scripts, Storyboards, Shot Lists",
    title_es: "Prompts IA de Video — Guiones, Storyboards, Shot Lists",
    meta_description_en: "250 AI prompts for video production — scripts, storyboards, shot lists, motion graphics specs, social video templates. Bilingual EN/ES.",
    meta_description_es: "250 prompts de IA para producción de video — guiones, storyboards, shot lists, especificaciones de motion graphics.",
    hero_en: "Video Prompts for the whole pipeline — script to screen",
    hero_es: "Prompts de Video para el pipeline completo — del guion a la pantalla",
    intro_en: "AI video generation (Veo, Kling, Runway, Sora-replacements) needs a different kind of prompt than image AI. These 250 prompts cover scripting, storyboarding, shot lists, motion graphics specs, lower-thirds, kinetic typography openers, and full social video templates for Instagram, TikTok, and YouTube.",
    intro_es: "La generación de video con IA (Veo, Kling, Runway, alternativas a Sora) necesita un tipo de prompt distinto al de imagen. Estos 250 prompts cubren guiones, storyboards, shot lists, especificaciones de motion graphics, lower-thirds, openers de tipografía cinética y templates completos para video social.",
    use_cases_en: ["60-second brand story scripts", "Multi-shot storyboards for ads", "Motion graphics specifications", "Lower-thirds for news and corporate", "Kinetic typography opener concepts"],
    use_cases_es: ["Guiones de brand story de 60 segundos", "Storyboards multi-shot para anuncios", "Especificaciones de motion graphics", "Lower-thirds para noticias y corporativo", "Conceptos de tipografía cinética"],
    related_keywords: ["video prompts", "veo prompts", "runway prompts", "storyboard AI prompts"],
  },
  {
    slug: "ux-ui",
    category: "ux_ui",
    title_en: "AI UX/UI Prompts for Web and Mobile Design",
    title_es: "Prompts IA de UX/UI para Diseño Web y Móvil",
    meta_description_en: "250 AI prompts for UX/UI designers — wireframes, user flows, design systems, onboarding flows, component libraries. Bilingual EN/ES.",
    meta_description_es: "250 prompts de IA para diseñadores UX/UI — wireframes, flujos, design systems, onboarding, librerías de componentes.",
    hero_en: "UX/UI Prompts for designers shipping real products",
    hero_es: "Prompts de UX/UI para diseñadores que entregan producto real",
    intro_en: "Designing a SaaS product or mobile app with AI in 2026 means generating low-fidelity wireframes, user flows, design system tokens, onboarding sequences, and component libraries faster than ever. These 250 prompts walk through every stage — research, IA, flows, wireframes, hi-fi specs, and design system documentation.",
    intro_es: "Diseñar un SaaS o app móvil con IA en 2026 significa generar wireframes low-fi, flujos de usuario, tokens de design system, onboarding y librerías de componentes más rápido que nunca. Estos 250 prompts cubren cada etapa — research, IA, flujos, wireframes, specs hi-fi y documentación de design system.",
    use_cases_en: ["SaaS onboarding flow design", "Component library specs", "User research synthesis", "Design system tokens", "Mobile app navigation patterns"],
    use_cases_es: ["Flujos de onboarding para SaaS", "Especificaciones de librerías de componentes", "Síntesis de user research", "Tokens de design system", "Patrones de navegación móvil"],
    related_keywords: ["UX prompts", "UI design prompts", "wireframe AI", "design system prompts"],
  },
  {
    slug: "illustration",
    category: "illustration",
    title_en: "AI Illustration Prompts — Editorial, Character, Stickers",
    title_es: "Prompts IA de Ilustración — Editorial, Personajes, Stickers",
    meta_description_en: "250 AI illustration prompts — editorial illustrations, character design, sticker packs, isometric scenes, cover art. For Midjourney, Flux, Recraft.",
    meta_description_es: "250 prompts de ilustración con IA — editorial, personajes, sticker packs, escenas isométricas, cover art.",
    hero_en: "Illustration Prompts for working illustrators and art directors",
    hero_es: "Prompts de Ilustración para ilustradores y directores de arte",
    intro_en: "AI illustration tools (Midjourney, Flux, Recraft, Stable Diffusion 3) can produce editorial-quality work — if you prompt them right. These 250 prompts cover editorial illustrations, character design, sticker packs, isometric scenes, book and album cover art, and brand mascots.",
    intro_es: "Las herramientas de ilustración con IA (Midjourney, Flux, Recraft, Stable Diffusion 3) producen calidad editorial — si las prompteas bien. Estos 250 prompts cubren ilustraciones editoriales, diseño de personajes, sticker packs, escenas isométricas, portadas de libros y discos, y mascotas de marca.",
    use_cases_en: ["Editorial illustrations for blog and magazine", "Sticker packs for messaging apps", "Character design for brands", "Isometric scene illustration", "Book and album cover art"],
    use_cases_es: ["Ilustraciones editoriales para blog y revista", "Sticker packs para apps de mensajería", "Diseño de personajes para marcas", "Ilustraciones isométricas", "Portadas de libros y discos"],
    related_keywords: ["illustration prompts", "midjourney illustration", "character design AI", "sticker design prompts"],
  },
  {
    slug: "marketing",
    category: "marketing",
    title_en: "AI Marketing Prompts — Strategy, Ads, Growth",
    title_es: "Prompts IA de Marketing — Estrategia, Anuncios, Growth",
    meta_description_en: "250 AI marketing prompts — campaign strategy, ad copy, growth experiments, audience research, content calendars. Bilingual EN/ES.",
    meta_description_es: "250 prompts de IA para marketing — estrategia de campaña, anuncios, growth experiments, audience research, calendarios de contenido.",
    hero_en: "Marketing Prompts for operators, not theorists",
    hero_es: "Prompts de Marketing para operadores, no teóricos",
    intro_en: "Marketing in 2026 lives or dies on speed of iteration. These 250 prompts run the full operator pipeline: audience research, campaign strategy, ad copy variants, growth experiments, content calendars, conversion analysis, and budget allocation under uncertainty.",
    intro_es: "El marketing en 2026 vive o muere por velocidad de iteración. Estos 250 prompts corren el pipeline operativo completo: audience research, estrategia de campaña, variantes de anuncios, growth experiments, calendarios, análisis de conversión y asignación de presupuesto bajo incertidumbre.",
    use_cases_en: ["Campaign brief writing", "Ad copy A/B variants", "Audience persona development", "Growth experiment design", "Content calendar generation"],
    use_cases_es: ["Briefs de campaña", "Variantes A/B de anuncios", "Desarrollo de personas", "Diseño de growth experiments", "Calendarios de contenido"],
    related_keywords: ["marketing AI prompts", "campaign prompts", "growth marketing prompts", "ad copy AI"],
  },
  {
    slug: "music",
    category: "music",
    title_en: "AI Music Prompts — Suno, Udio, ElevenLabs",
    title_es: "Prompts IA de Música — Suno, Udio, ElevenLabs",
    meta_description_en: "250 AI music prompts for Suno, Udio, Riffusion, ElevenLabs Music — full songs, instrumentals, lo-fi beats, jingles, scoring briefs.",
    meta_description_es: "250 prompts de IA para Suno, Udio, Riffusion, ElevenLabs Music — canciones, instrumentales, lo-fi beats, jingles, briefs de score.",
    hero_en: "Music Prompts for Suno, Udio, and Co.",
    hero_es: "Prompts de Música para Suno, Udio y Cía.",
    intro_en: "Suno and Udio made it possible to generate broadcast-quality music in seconds. But the average prompt still produces generic loops. These 250 prompts are tuned for specific outputs: lo-fi study beats, brand jingles, film and game scoring briefs, full pop songs with lyrics, and instrumental moods for video.",
    intro_es: "Suno y Udio hicieron posible generar música de calidad broadcast en segundos. Pero el prompt promedio aún produce loops genéricos. Estos 250 prompts están afinados para outputs específicos: beats de lo-fi para estudiar, jingles, briefs para scoring de film y game, canciones pop completas con letra, e instrumentales para video.",
    use_cases_en: ["Lo-fi hip hop beat creation", "Brand jingles for ads", "Film and game scoring briefs", "Full pop songs with lyrics", "Instrumental moods for video"],
    use_cases_es: ["Creación de beats de lo-fi", "Jingles para anuncios", "Briefs de scoring para film y game", "Canciones pop completas", "Instrumentales para video"],
    related_keywords: ["suno prompts", "udio prompts", "music AI prompts", "elevenlabs music prompts"],
  },
  {
    slug: "architecture",
    category: "architecture",
    title_en: "AI Architecture Prompts — Concept to Construction",
    title_es: "Prompts IA de Arquitectura — Concepto a Construcción",
    meta_description_en: "250 AI architecture prompts — concept design, residential and commercial briefs, sustainability strategies, rendering and visualization.",
    meta_description_es: "250 prompts de IA para arquitectura — diseño conceptual, briefs residencial y comercial, sustentabilidad, renderizado y visualización.",
    hero_en: "Architecture Prompts for studios and solo architects",
    hero_es: "Prompts de Arquitectura para estudios y arquitectos independientes",
    intro_en: "AI is changing how architectural concepts move from intent to drawings. These 250 prompts span concept statements, residential and commercial briefs, sustainability strategies, regulatory analysis, material specifications, and rendering / visualization prompts for Midjourney and Flux.",
    intro_es: "La IA está cambiando cómo los conceptos arquitectónicos pasan de intención a planos. Estos 250 prompts cubren statements conceptuales, briefs residencial y comercial, sustentabilidad, análisis regulatorio, especificaciones de materiales y prompts de renderizado para Midjourney y Flux.",
    use_cases_en: ["Residential concept statements", "Commercial space program briefs", "Sustainability strategy outlines", "Material and finish specifications", "Rendering prompts for visualization"],
    use_cases_es: ["Statements conceptuales residenciales", "Briefs de programa para espacios comerciales", "Esquemas de estrategia de sustentabilidad", "Especificaciones de materiales y acabados", "Prompts de renderizado"],
    related_keywords: ["architecture AI prompts", "concept design prompts", "rendering prompts", "sustainable design prompts"],
  },
  {
    slug: "fashion",
    category: "fashion",
    title_en: "AI Fashion Prompts — Design, Trend, Brand",
    title_es: "Prompts IA de Moda — Diseño, Tendencia, Marca",
    meta_description_en: "250 AI fashion prompts — collection concepts, trend reports, brand positioning, sketch generation, lookbook briefs. Bilingual EN/ES.",
    meta_description_es: "250 prompts de IA para moda — conceptos de colección, trend reports, posicionamiento, generación de bocetos, briefs de lookbook.",
    hero_en: "Fashion Prompts for designers, stylists, and brands",
    hero_es: "Prompts de Moda para diseñadores, stylists y marcas",
    intro_en: "AI is the new pattern-cutting room. These 250 prompts run from trend forecasting and seasonal collection concepts through fashion croquis and technical sketches, lookbook briefs, e-commerce styling, and brand positioning for fashion houses old and new.",
    intro_es: "La IA es el nuevo cuarto de patronaje. Estos 250 prompts van desde forecasting de tendencias y conceptos de colección estacional, hasta croquis y sketches técnicos, briefs de lookbook, styling para e-commerce y posicionamiento de marcas de moda.",
    use_cases_en: ["Seasonal collection concept boards", "Fashion croquis and technical sketches", "Trend forecast reports", "Lookbook briefs for photo shoots", "Fashion brand positioning"],
    use_cases_es: ["Concept boards de colección estacional", "Croquis y sketches técnicos", "Reportes de forecasting de tendencias", "Briefs de lookbook", "Posicionamiento de marca de moda"],
    related_keywords: ["fashion AI prompts", "fashion design prompts", "trend forecasting AI", "lookbook prompts"],
  },
  {
    slug: "creative-productivity",
    category: "creative_productivity",
    title_en: "AI Creative Productivity Prompts — Plan, Focus, Ship",
    title_es: "Prompts IA de Productividad Creativa — Planea, Enfoca, Entrega",
    meta_description_en: "250 AI prompts for creative productivity — sprint planning, deep work, project briefs, retrospectives, async communication.",
    meta_description_es: "250 prompts de IA para productividad creativa — sprint planning, deep work, briefs, retrospectivas, comunicación asíncrona.",
    hero_en: "Productivity Prompts for creative operators",
    hero_es: "Prompts de Productividad para operadores creativos",
    intro_en: "Solo creatives and small studios live and die on output velocity. These 250 prompts target the actual bottlenecks: weekly sprint planning, deep-work focus protocols, project briefs that don't need revision, retrospective frameworks, async communication, and decision logs for projects with shifting scope.",
    intro_es: "Los creativos solos y los estudios pequeños viven y mueren por velocidad de output. Estos 250 prompts atacan los cuellos de botella reales: sprint planning semanal, protocolos de deep work, briefs que no requieren revisión, frameworks de retrospectiva, comunicación asíncrona, y decision logs para proyectos con scope cambiante.",
    use_cases_en: ["Weekly sprint planning templates", "Deep-work focus protocols", "Project brief writing", "Retrospective frameworks", "Async communication patterns"],
    use_cases_es: ["Templates de sprint planning semanal", "Protocolos de deep work", "Escritura de briefs", "Frameworks de retrospectiva", "Patrones de comunicación asíncrona"],
    related_keywords: ["creative productivity prompts", "sprint planning AI", "deep work prompts", "freelance productivity prompts"],
  },
];

export function getLearnPage(slug: string): LearnPageConfig | undefined {
  return LEARN_PAGES.find((p) => p.slug === slug);
}
