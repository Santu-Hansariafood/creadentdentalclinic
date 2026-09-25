import { Link, Navigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
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
import { Suspense, useState } from "react";
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
  const [openFaq, setOpenFaq] = useState(0);

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
      page.schemaType ||
      (page.slug === "contact-us"
        ? "ContactPage"
        : page.slug === "home"
          ? "WebPage"
          : page.slug === "about-us"
            ? "AboutPage"
            : page.template === "doctor-profile"
              ? "MedicalWebPage"
              : "WebPage"),
    name: page.title,
    description: page.seo.description,
    keywords: page.seo.keywords,
    about: page.bio || page.heroDescription,
    url: `${site.website}${page.path}`,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.website,
    },
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

  const structuredData = [webPageSchema, breadcrumbSchema];
  if (faqSchema) structuredData.push(faqSchema);

  const renderCtaLink = (href, label, className) =>
    href.startsWith("http") ? (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    ) : (
      <Link to={href} className={className}>
        {label}
      </Link>
    );

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
        {page.template === "doctor-profile" ? (
          <>
            <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-700 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.25),transparent_30%)] pointer-events-none" />

              <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
                <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-sm">
                      <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                      {page.badge}
                    </span>

                    <h1 className="mt-6 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                      {page.title.replace(" | Dentist in Salt Lake, Kolkata", "")}
                    </h1>

                    <p className="mt-5 text-lg leading-relaxed text-slate-100 sm:text-xl">
                      {page.heroDescription}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {page.specialities?.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1.5 text-sm font-medium text-cyan-50"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      {renderCtaLink(
                        page.cta.primaryHref,
                        page.cta.primaryLabel,
                        "rounded-full bg-white px-6 py-3 text-center text-sm font-bold text-sky-900 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-sky-50",
                      )}
                      {renderCtaLink(
                        page.cta.secondaryHref,
                        page.cta.secondaryLabel,
                        "rounded-full border border-white/40 bg-white/5 px-6 py-3 text-center text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10",
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute -inset-6 rounded-[2rem] bg-cyan-300/20 blur-3xl" />
                    <div className="relative grid gap-4 sm:grid-cols-2">
                      {page.images?.map((image, idx) => (
                        <div
                          key={image.src}
                          className="overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/20 ring-1 ring-white/20"
                        >
                          <img
                            src={image.src}
                            alt={image.alt}
                            className="h-[360px] w-full object-cover transition duration-700 hover:scale-[1.03] motion-safe:animate-[pulse_6s_ease-in-out_infinite]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {page.stats?.length ? (
              <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 -mt-8 relative z-10">
                <div className="grid gap-6 md:grid-cols-3">
                  {page.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {stat.label}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  About the doctor
                </p>
                <h2 className="mt-4 font-heading text-3xl font-bold text-slate-900">
                  Dr. Sunita Agarwalla
                </h2>
                <div className="mt-5 space-y-5 text-lg leading-relaxed text-slate-600">
                  {(page.bioParagraphs?.length ? page.bioParagraphs : [page.bio]).map(
                    (paragraph, index) => (
                      <p key={`${page.slug}-bio-${index}`}>{paragraph}</p>
                    ),
                  )}
                </div>
              </div>
            </section>

            {page.images?.length ? (
              <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                        Dental care experience
                      </p>
                      <h2 className="mt-2 font-heading text-3xl font-bold text-slate-900">
                        Smile care and treatment environment
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {page.images.map((image, idx) => (
                      <div
                        key={`${image.src}-${idx}`}
                        className="overflow-hidden rounded-[1.5rem] shadow-lg shadow-slate-200 ring-1 ring-slate-200"
                      >
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="h-72 w-full object-cover transition duration-700 hover:scale-[1.03]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {page.sections?.length ? (
              <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                <div className="grid gap-8">
                  {page.sections.map((section) => (
                    <article
                      key={section.title}
                      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
                    >
                      <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {section.title}
                      </h2>

                      {section.paragraphs?.length ? (
                        <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                          {section.paragraphs.map((paragraph, idx) => (
                            <p key={`${section.title}-paragraph-${idx}`}>{paragraph}</p>
                          ))}
                        </div>
                      ) : null}

                      {section.items?.length ? (
                        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                          {section.items.map((item, idx) => (
                            <li
                              key={`${section.title}-item-${idx}`}
                              className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-base leading-6 text-slate-700"
                            >
                              <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {page.faq?.length ? (
              <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                    FAQs
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-bold text-slate-900">
                    Frequently asked questions
                  </h2>
                  <div className="mt-8 space-y-5">
                    {page.faq.map((item, idx) => {
                      const isOpen = openFaq === idx;

                      return (
                        <div
                          key={`${item.question}-${idx}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                            className="flex w-full items-center justify-between gap-4 p-5 text-left"
                          >
                            <h3 className="font-heading text-lg font-bold text-slate-900">
                              {item.question}
                            </h3>
                            <ChevronDown
                              size={20}
                              className={`shrink-0 text-slate-500 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isOpen ? (
                            <div className="border-t border-slate-200 px-5 pb-5 pt-4">
                              <p className="text-base leading-relaxed text-slate-600">
                                {item.answer}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <>
            <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-slate-900 via-primary/90 to-cyan-800 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />

              <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
                <div className="max-w-3xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/20 shadow-sm">
                    <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                    {page.badge}
                  </span>

                  <h1 className="mt-6 break-words font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {page.title}
                  </h1>

                  <div className="mt-4 max-w-full border-r-2 border-cyan-400 pr-2 font-mono text-xs text-cyan-200 sm:text-sm">
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

                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:w-auto">
                      {renderCtaLink(
                        page.cta.primaryHref,
                        page.cta.primaryLabel,
                        "w-full rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-primary shadow-xl transition-all hover:-translate-y-0.5 hover:bg-cyan-50 hover:text-cyan-900 sm:w-auto sm:px-8 sm:py-4",
                      )}
                      {renderCtaLink(
                        page.cta.secondaryHref,
                        page.cta.secondaryLabel,
                        "w-full rounded-full border-2 border-white/60 bg-white/5 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white sm:w-auto sm:px-8 sm:py-4",
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}
      </PublicLayout>
    </Suspense>
  );
};

export default PublicContentPage;
