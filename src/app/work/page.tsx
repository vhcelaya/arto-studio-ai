import Link from "next/link";

// Portfolio data from ARTO Portafolio 2026 (Notion)
// This will eventually be fetched from Notion API at build time
const projects = [
  {
    slug: "grupo-proeza-2025",
    name: "Zano Fresh",
    client: "Grupo Proeza",
    year: "2025",
    categories: ["Branding", "Web Development"],
    industry: "Industrial",
    location: "Monterrey, MX",
    tags: ["Corporativo", "B2B", "Digital", "Identidad Visual"],
    description:
      "Branding and web development for Grupo Proeza. Strengthened the brand system and translated it into a clear, responsive web experience that communicates the group's platform and business units.",
  },
  {
    slug: "gse-biomedical",
    name: "GSE Biomedical",
    client: "Kolab Ventures",
    year: "2024",
    categories: ["Branding"],
    industry: "Salud",
    location: "Hermosillo, MX",
    tags: ["Corporativo", "Identidad Visual", "Estrategia"],
    description:
      "Brand identity for GSE Biomedical in the health and medical technology sector. Created a clear, professional visual identity to build recognition and credibility in a specialized market.",
  },
  {
    slug: "grupo-proeza-ecosystem",
    name: "ZANO",
    client: "Grupo Proeza",
    year: "2023",
    categories: ["Branding", "Brand Ecosystem"],
    industry: "Industrial",
    location: "Monterrey, MX",
    tags: ["Corporativo", "B2B", "Identidad Visual", "Estrategia", "Digital"],
    description:
      "Brand ecosystem for Grupo Proeza. Structured a consistent brand system across business units and channels, creating visual clarity and narrative coherence.",
  },
  {
    slug: "poder-partners",
    name: "Poder Partners",
    client: "Poder Partners",
    year: "2022",
    categories: ["Branding"],
    industry: "Finanzas",
    location: "New York, US",
    tags: ["Corporativo", "Identidad Visual"],
    description:
      "Branding for a technology investment vehicle. Built a contemporary, sophisticated visual identity that communicates vision, solidity, and purpose.",
  },
  {
    slug: "mr-fox",
    name: "Mr. Fox",
    client: "Mr. Fox",
    year: "2021",
    categories: ["UI Design", "Shopify Development"],
    industry: "Retail",
    location: "Mexico City, MX",
    tags: ["Digital", "Retail"],
    description:
      "UI design and Shopify development focused on clarity and conversion. Created a stable, scalable e-commerce platform that elevated user experience.",
  },
  {
    slug: "kavak-showroom",
    name: "Kavak Showroom",
    client: "Kavak",
    year: "2019",
    categories: ["Brand Strategy", "Branding"],
    industry: "Automotriz",
    location: "Mexico City, MX",
    tags: ["Corporativo", "Retail"],
    description:
      "Brand strategy and showroom experience for Kavak. Developed narrative, visual cues, and a coherent physical experience for customers and visitors.",
  },
  {
    slug: "break-off",
    name: "Break Off",
    client: "Break Off",
    year: "2019",
    categories: ["Branding", "Website", "Brand Strategy"],
    industry: "Servicios",
    location: "UK, Hong Kong & US",
    tags: ["Digital", "Identidad Visual"],
    description:
      "Full brand ecosystem — strategy, visual identity, and web platform — for a global digital services company. Built to compete across multiple markets.",
  },
  {
    slug: "el-mural-mas-fino",
    name: "El Mural Mas Fino",
    client: "Cerveza Corona",
    year: "2019",
    categories: ["Branding", "Mural"],
    industry: "Alimentos",
    location: "Ciudad de Mexico",
    tags: ["Alimentos", "Identidad Visual", "Corporativo", "Retail"],
    description:
      "Monumental mural designed by Pedro Friedeberg for Cerveza Corona. Art, brand, and public space merged into a memorable urban experience.",
  },
  {
    slug: "grupo-proeza-2019",
    name: "Grupo Proeza",
    client: "Grupo Proeza",
    year: "2019",
    categories: ["Branding", "Web Development", "Video Production"],
    industry: "Industrial",
    location: "Monterrey, MX",
    tags: ["Corporativo", "B2B", "Digital"],
    description:
      "Comprehensive brand, web, and video project. Strengthened the group's visibility and communication of its purpose and business units.",
  },
  {
    slug: "niki-b",
    name: "Niki B",
    client: "Niki Baratta",
    year: "2019",
    categories: ["Branding", "UI Design", "Shopify Development"],
    industry: "Retail",
    location: "New York, US",
    tags: ["Digital", "Retail"],
    description:
      "Brand identity and Shopify e-commerce for a New York retail brand. Created a cohesive digital presence with a focus on usability and aesthetics.",
  },
  {
    slug: "vehement",
    name: "Vehement",
    client: "Vehement",
    year: "2019",
    categories: ["Naming", "Branding"],
    industry: "Technology",
    location: "Texas, US",
    tags: ["Identidad Visual"],
    description:
      "Naming and brand identity. Defined the name and built a clear, consistent visual system ready to scale across touchpoints.",
  },
  {
    slug: "mezcal-inmortal",
    name: "Mezcal Inmortal",
    client: "Mezcal Inmortal",
    year: "2018",
    categories: ["Branding", "Illustration"],
    industry: "Alimentos",
    location: "Mexico City, MX",
    tags: ["Alimentos", "Identidad Visual"],
    description:
      "Branding and illustration for an artisanal mezcal brand. Distinctive visual language that communicates tradition and character in a competitive market.",
  },
  {
    slug: "muvop",
    name: "MUVOP",
    client: "MUVOP",
    year: "2018",
    categories: ["Branding", "Product Design"],
    industry: "Finanzas",
    location: "Mexico",
    tags: ["Corporativo", "Identidad Visual"],
    description:
      "Branding and product design for a financial institution empowering women through credit access and financial education.",
  },
  {
    slug: "comnor",
    name: "COMNOR",
    client: "Sigma Alimentos",
    year: "2018",
    categories: ["Brand Strategy", "Brand Redesign"],
    industry: "Alimentos",
    location: "Monterrey, MX",
    tags: ["Alimentos", "Corporativo", "Identidad Visual", "Estrategia"],
    description:
      "Brand strategy and redesign for Sigma Alimentos' meat cuts brand. Consumer segmentation, simplified identity, and improved shelf clarity.",
  },
  {
    slug: "loly-in-the-sky",
    name: "Loly in the Sky",
    client: "Loly in the Sky",
    year: "2018",
    categories: ["UI Design", "Shopify Development"],
    industry: "Retail",
    location: "Monterrey, MX",
    tags: ["Digital", "Retail"],
    description:
      "UI/UX redesign and Shopify store for a beloved Mexican shoe brand. Translated the physical brand personality into a digital shopping experience.",
  },
  {
    slug: "celaya-brothers-gallery",
    name: "Celaya Brothers Gallery",
    client: "Celaya Brothers Gallery",
    year: "2017",
    categories: ["Web Development"],
    industry: "Servicios",
    location: "Mexico City, MX",
    tags: ["Digital"],
    description:
      "Web development for a contemporary art gallery. Clean architecture and elegant navigation optimized for exhibitions and artist profiles.",
  },
  {
    slug: "aisha-sufe",
    name: "Aisha Sufe",
    client: "Aisha Sufe",
    year: "2017",
    categories: ["Branding", "Web Development"],
    industry: "Retail",
    location: "Monterrey, MX",
    tags: ["Digital", "Retail"],
    description:
      "Branding and e-commerce for a creative art and products brand. Built a digital platform to grow the offering and reach new audiences.",
  },
  {
    slug: "mlab-metalsa",
    name: "MLab",
    client: "Metalsa",
    year: "2016",
    categories: ["Branding", "UI Design"],
    industry: "Industrial",
    location: "Monterrey, MX",
    tags: ["Corporativo", "Industrial", "B2B", "Digital"],
    description:
      "Branding and UI system for Metalsa's innovation lab. Created a distinctive tech-forward identity with coherent interface language.",
  },
  {
    slug: "galvasid",
    name: "GALVASID",
    client: "GALVASID",
    year: "2016",
    categories: ["Logo Re-design", "Brand Strategy"],
    industry: "Industrial",
    location: "Monterrey, MX",
    tags: ["Industrial", "B2B", "Corporativo", "Identidad Visual", "Estrategia"],
    description:
      "Logo redesign and brand strategy for an industrial company. Refreshed identity with strategic guidelines for market positioning.",
  },
  {
    slug: "basket",
    name: "Basket",
    client: "Basket",
    year: "2016",
    categories: ["Branding", "Web Development"],
    industry: "Alimentos",
    location: "Monterrey, MX",
    tags: ["Alimentos", "Retail", "Digital", "Packaging"],
    description:
      "Branding and web development for an artisanal gift basket brand. Clear customization experience aligned with the handcrafted proposition.",
  },
  {
    slug: "julee",
    name: "Julee",
    client: "Julee",
    year: "2016",
    categories: ["Naming", "Branding", "UI Design", "Product Design"],
    industry: "Retail",
    location: "Monterrey, MX",
    tags: ["Digital", "Retail", "Identidad Visual"],
    description:
      "Full brand creation — naming, identity, UI, and product design. Built a distinctive and coherent visual system for retail growth.",
  },
  {
    slug: "call-us-whatever",
    name: "Call Us Whatever",
    client: "Call Us Whatever",
    year: "2014",
    categories: ["Branding", "UI Design", "Web Development"],
    industry: "Retail",
    location: "Monterrey, MX",
    tags: ["Identidad Visual", "Digital"],
    description:
      "Branding, UI, and web development for a Monterrey fashion and lifestyle brand. Unified identity and digital experience.",
  },
  {
    slug: "distrito",
    name: "Distrito",
    client: "Distrito",
    year: "2014",
    categories: ["Branding"],
    industry: "Servicios",
    location: "Monterrey, MX",
    tags: ["Identidad Visual"],
    description:
      "Brand identity for Monterrey's innovation and entrepreneurship ecosystem initiative. Clear communication of community purpose.",
  },
  {
    slug: "don-cortes",
    name: "Don Cortes",
    client: "Don Cortes",
    year: "2014",
    categories: ["Branding", "Web Development"],
    industry: "Retail",
    location: "Monterrey, MX",
    tags: ["Digital", "Retail"],
    description:
      "Branding and online store for a men's accessories brand. Optimized shopping experience aligned with brand identity.",
  },
];

// Get unique categories and years for filters
const allCategories = [...new Set(projects.flatMap((p) => p.categories))].sort();
const allYears = [...new Set(projects.map((p) => p.year))]
  .filter((y) => y !== "Por definir")
  .sort()
  .reverse();

export default function WorkPage() {
  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/brand/arto-logo-black.png"
              alt="ARTO"
              className="h-6 w-auto"
            />
            <span className="text-sm font-medium tracking-wide text-zinc-500">
              STUDIO AI
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/work"
              className="text-sm font-medium text-zinc-900"
            >
              Work
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#waitlist"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Join Waitlist
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
            Portfolio
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Our work speaks.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-500">
            A decade of branding, strategy, and digital experiences for clients
            across industries and continents. This is what powers ARTO Studio AI.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {allYears.map((year) => (
              <span
                key={year}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500"
              >
                {year}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-3xl font-bold">{projects.length}+</p>
              <p className="mt-1 text-sm text-zinc-500">Projects delivered</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {new Set(projects.map((p) => p.client)).size}+
              </p>
              <p className="mt-1 text-sm text-zinc-500">Clients served</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {allYears.length > 1
                  ? `${allYears[allYears.length - 1]}–${allYears[0]}`
                  : allYears[0]}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Years of work</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {new Set(projects.map((p) => p.industry)).size}
              </p>
              <p className="mt-1 text-sm text-zinc-500">Industries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Grid */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.slug}
                className="group rounded-2xl border border-zinc-200 p-6 transition-all hover:border-zinc-400 hover:shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    {project.year}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {project.location}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight group-hover:text-zinc-600 transition-colors">
                  {project.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  {project.client}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 line-clamp-3">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.categories.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            This knowledge powers ARTO Studio AI.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Every project above trained our AI on real strategy, real creativity,
            and real results. Now it&apos;s your turn.
          </p>
          <Link
            href="/#waitlist"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Start your free trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/brand/arto-logo-black.png"
                alt="ARTO"
                className="h-4 w-auto invert"
              />
              <span className="text-xs tracking-wide text-zinc-500">
                STUDIO AI
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              A product by ARTO Group. Design, Culture & Technology since 2009.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
