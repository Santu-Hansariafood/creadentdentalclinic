import { Link, Navigate } from "react-router-dom";
import {
  Building2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import SEO from "../components/SEO";
import PublicLayout from "../components/PublicLayout";
import publicContent from "../data/publicPages.json";

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

  const contactSchema =
    page.slug === "contact-us"
      ? {
          "@context": "https://schema.org",
          "@type": "Dentist",
          name: site.name,
          url: site.website,
          telephone: site.phoneDisplay,
          email: site.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: site.addressLines[0],
            addressLocality: "Kolkata",
            addressRegion: "West Bengal",
            postalCode: "700064",
            addressCountry: "IN",
          },
          openingHours: "Mo-Su 09:00-20:00",
        }
      : null;

  const homeBusinessSchema =
    page.slug === "home"
      ? {
          "@context": "https://schema.org",
          "@type": "Dentist",
          name: site.name,
          url: site.website,
          image: `${site.website}/logo/logo.png`,
          telephone: site.phoneDisplay,
          email: site.email,
          priceRange: "₹200-₹5000",
          areaServed: ["Salt Lake", "Bidhannagar", "Kolkata", "West Bengal"],
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
          openingHours: "Mo-Su 09:00-20:00",
        }
      : null;

  const faqSchema =
    page.faq?.length
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
  if (contactSchema) structuredData.push(contactSchema);
  if (homeBusinessSchema) structuredData.push(homeBusinessSchema);
  if (faqSchema) structuredData.push(faqSchema);

  return (
    <>
      <SEO
        title={page.seo.title}
        description={page.seo.description}
        keywords={page.seo.keywords}
        url={page.path}
        canonical={`${site.website}${page.path}`}
        structuredData={structuredData}
      />

      <PublicLayout>
        <section className="border-b border-gray-200 bg-white/70">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <span className="badge badge-primary">{page.badge}</span>
              <h1 className="mt-5 font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
                {page.title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                {page.heroDescription}
              </p>
            </div>
          </div>
        </section>

        {page.highlights?.length ? (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {page.highlights.map((item) => {
                const Icon = iconMap[item.icon] || ShieldCheck;
                const valueContent = item.href ? (
                  <a
                    href={item.href}
                    className="transition-colors hover:text-primary"
                  >
                    {item.value}
                  </a>
                ) : (
                  item.value
                );

                return (
                  <div key={item.label} className="card-hover">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon size={22} />
                    </div>
                    <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
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

        <section className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8 lg:pb-16">
          <div className="grid gap-6">
            {page.sections.map((section) => (
              <article key={section.title} className="card">
                <h2 className="font-heading text-2xl font-semibold text-gray-900">
                  {section.title}
                </h2>

                {section.paragraphs?.length ? (
                  <div className="mt-4 space-y-4 text-base leading-7 text-gray-600">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {section.items?.length ? (
                  <ul className="mt-4 space-y-3 text-base leading-7 text-gray-600">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        {page.faq?.length ? (
          <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
            <div className="card">
              <h2 className="font-heading text-2xl font-semibold text-gray-900">
                Frequently asked questions
              </h2>
              <div className="mt-6 grid gap-4">
                {page.faq.map((item) => (
                  <article key={item.question} className="rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-heading text-lg font-semibold text-gray-900">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-gray-600">
                      {item.answer}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {page.cta ? (
          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-cyan-600 px-6 py-10 text-white shadow-lg sm:px-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className="font-heading text-3xl font-semibold">
                    {page.cta.title}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-white/85">
                    {page.cta.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to={page.cta.primaryHref}
                    className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5"
                  >
                    {page.cta.primaryLabel}
                  </Link>
                  <Link
                    to={page.cta.secondaryHref}
                    className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    {page.cta.secondaryLabel}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </PublicLayout>
    </>
  );
};

export default PublicContentPage;
