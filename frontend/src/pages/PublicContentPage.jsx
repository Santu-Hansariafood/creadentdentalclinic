import { Link, Navigate } from "react-router-dom";
import {
  Building2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import SEO from "../components/SEO";
import PublicLayout from "../components/PublicLayout";
import ScrollToTop from "../components/ScrollToTop";
import publicContent from "../data/publicPages.json";
import { Suspense } from "react";
import Preloader from "../components/Preloader";

const iconMap = {
  building: Building2,
  clock: Clock3,
  mail: Mail,
  "map-pin": MapPin,
  phone: Phone,
  shield: ShieldCheck,
};

const PublicContentPage = ({ pageSlug }) => {
  const { site, pages } = publicContent;
  const page = pages.find((item) => item.slug === pageSlug);

  if (!page) {
    return <Navigate to="/about-us" replace />;
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: site.name,
        item: site.website,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.label,
        item: `${site.website}${page.path}`,
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type":
      page.slug === "contact-us"
        ? "ContactPage"
        : page.slug === "home"
          ? "WebPage"
          : page.slug === "about-us"
            ? "AboutPage"
            : "WebPage",
    name: page.title,
    description: page.seo.description,
    url: `${site.website}${page.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.website,
    },
  };

  const dentistSchema = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: site.name,
    image: `${site.website}/logo/logo.png`,
    url: site.website,
    telephone: site.phoneDisplay,
    email: site.email,
    priceRange: "₹200-₹5000",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.addressLines[0],
      addressLocality: "Kolkata",
      addressRegion: "West Bengal",
      postalCode: "700064",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: Number(site.geo?.latitude || 22.5855),
      longitude: Number(site.geo?.longitude || 88.4017),
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "20:00",
      },
    ],
    areaServed: ["Salt Lake", "Bidhannagar", "Kolkata", "West Bengal"],
    medicalSpecialty: "Dentistry",
  };

  const faqSchema = page.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const structuredData = [webPageSchema, breadcrumbSchema, dentistSchema];
  if (faqSchema) structuredData.push(faqSchema);

  return (
    <Suspense fallback={<Preloader />}>
      <ScrollToTop />
      <SEO
        title={page.seo.title}
        description={page.seo.description}
        keywords={page.seo.keywords}
        url={page.path}
        canonical={`${site.website}${page.path}`}
        structuredData={structuredData}
      />

      <PublicLayout>
        <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-slate-900 via-primary/90 to-cyan-800 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/20 shadow-sm">
                <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                {page.badge}
              </span>

              <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
                {page.title}
              </h1>

              <div className="mt-4 inline-block overflow-hidden whitespace-nowrap border-r-2 border-cyan-400 pr-2 font-mono text-xs sm:text-sm text-cyan-200 animate-[typing_4s_steps(40,end),blink-caret_.75s_step-end_infinite]">
                Advanced Healthcare • Trusted Dental Excellence in Salt Lake,
                Kolkata
              </div>

              <p className="mt-5 text-lg leading-relaxed text-gray-100 sm:text-xl font-light">
                {page.heroDescription}
              </p>
            </div>
          </div>
        </section>

        {page.highlights?.length ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 -mt-8 relative z-10">
            <div className="grid gap-6 md:grid-cols-3">
              {page.highlights.map((item) => {
                const Icon = iconMap[item.icon] || ShieldCheck;
                const valueContent = item.href ? (
                  <a
                    href={item.href}
                    className="transition-colors hover:text-primary underline decoration-primary/30 underline-offset-4"
                  >
                    {item.value}
                  </a>
                ) : (
                  item.value
                );

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-gray-100 bg-white/90 backdrop-blur-sm p-6 shadow-xl shadow-gray-100 transition-all hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-cyan-500/15 text-primary shadow-inner">
                      <Icon size={26} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-base font-semibold leading-7 text-gray-900">
                      {valueContent}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          <div className="grid gap-8">
            {page.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-10 shadow-sm transition-all hover:border-gray-200"
              >
                <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {section.title}
                </h2>

                {section.paragraphs?.length ? (
                  <div className="mt-5 space-y-4 text-base leading-relaxed text-gray-600 sm:text-lg">
                    {section.paragraphs.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {section.items?.length ? (
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {section.items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 p-4 text-base leading-6 text-gray-700 shadow-sm"
                      >
                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0 shadow-sm" />
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {page.faq?.length ? (
          <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {page.faq.map((item, idx) => (
                  <article
                    key={idx}
                    className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 transition-all hover:border-primary/50 hover:bg-white hover:shadow-md"
                  >
                    <h3 className="font-heading text-lg font-bold text-gray-900">
                      {item.question}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-gray-600">
                      {item.answer}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {page.cta ? (
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary to-cyan-700 px-6 py-12 text-white shadow-2xl sm:px-12 border border-white/10">
              <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-block mb-3 text-xs font-bold uppercase tracking-widest text-cyan-300">
                    Get Started Today
                  </span>
                  <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                    {page.cta.title}
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-gray-100/90">
                    {page.cta.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    to={page.cta.primaryHref}
                    className="rounded-full bg-white px-8 py-4 text-sm font-bold text-primary shadow-xl transition-all hover:-translate-y-0.5 hover:bg-cyan-50 hover:text-cyan-900"
                  >
                    {page.cta.primaryLabel}
                  </Link>
                  <Link
                    to={page.cta.secondaryHref}
                    className="rounded-full border-2 border-white/60 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/20 hover:border-white"
                  >
                    {page.cta.secondaryLabel}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </PublicLayout>
    </Suspense>
  );
};

export default PublicContentPage;
