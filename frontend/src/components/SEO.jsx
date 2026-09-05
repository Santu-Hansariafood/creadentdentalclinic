import { Helmet } from "react-helmet-async";

const DEFAULT_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: "Creadent Dental Clinic",
  image: "https://creadentsmiles.com/logo/logo.png",
  "@id": "https://creadentsmiles.com",
  url: "https://creadentsmiles.com",
  telephone: "+91 62923 00343",
  email: "info@creadentdentalclinic.com",
  priceRange: "₹200-₹5000",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking, Wallet",
  medicalSpecialty: "Dentistry",
  address: {
    "@type": "PostalAddress",
    streetAddress: "BD-85, Salt Lake Rd, AD Block, Sector 1, Bidhannagar",
    addressLocality: "Kolkata",
    addressRegion: "West Bengal",
    postalCode: "700064",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 22.5855,
    longitude: 88.4017,
  },
  openingHoursSpecification: {
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
  sameAs: [
    "https://www.facebook.com/profile.php?id=100094304316835",
    "https://www.instagram.com/creadent_dentalclinic/",
    "https://www.google.com/search?sca_esv=eed109301477b38c&authuser=0&hl=en&gl=in&output=search&q=Creadent&ludocid=3495056172186083733&lsig=AB86z5XjgcXiZv-kwyUA9q8TFFnD&ved=1i%3A3%2Ct%3A109124%2Ce%3A2%2Cp%3AZDGJarOzI7SaseMPwN-jgAU%3A89",
  ],
  areaServed: ["Salt Lake", "Bidhannagar", "Kolkata", "West Bengal"],
};

const SEO = ({
  title = "Creadent Dental Clinic | Dentist in Salt Lake, Kolkata",
  description = "Creadent Dental Clinic in Salt Lake, Kolkata offers root canal treatment, dental implants, braces, teeth whitening, and family dental care.",
  keywords = "best dental clinic in Kolkata, dentist near me, root canal treatment Kolkata, teeth whitening, dental implants, Creadent Dental Clinic, dental clinic Kolkata, orthodontist Kolkata, pediatric dentist Kolkata, cosmetic dentistry",
  image = "/logo/logo.png",
  imageWidth = "512",
  imageHeight = "512",
  url,
  author = "Creadent Dental Clinic",
  type = "website",
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
  imageAlt,
  twitterSite,
  breadcrumbs,
  faqs,
  rating,
  medicalSpecialty,
  includeBusinessSchema = true,
}) => {
  const rawBaseUrl =
    import.meta.env.VITE_SITE_URL || "https://creadentsmiles.com";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";
  const resolvedUrl = url || currentUrl;
  const toAbsoluteUrl = (value) =>
    value && value.startsWith("http") ? value : `${baseUrl}${value || "/"}`;
  const fullUrl = toAbsoluteUrl(resolvedUrl);
  const canonicalUrl = toAbsoluteUrl(canonical || resolvedUrl.split("?")[0]);
  const imageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;
  const imageDescription = imageAlt || `${title} preview image`;

  const apiOrigin = (() => {
    try {
      return import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL).origin
        : null;
    } catch {
      return null;
    }
  })();

  const schemaList = [];

  if (includeBusinessSchema) {
    const businessSchema = { ...DEFAULT_BUSINESS_SCHEMA };
    if (medicalSpecialty) businessSchema.medicalSpecialty = medicalSpecialty;
    if (rating && rating.value && rating.count) {
      businessSchema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(rating.value),
        reviewCount: String(rating.count),
      };
    }
    schemaList.push(businessSchema);
  }

  schemaList.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Creadent Dental Clinic",
    url: baseUrl,
    inLanguage: "en-IN",
  });

  if (breadcrumbs && breadcrumbs.length) {
    schemaList.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: crumb.url.startsWith("http")
          ? crumb.url
          : `${baseUrl}${crumb.url}`,
      })),
    });
  }

  if (faqs && faqs.length) {
    schemaList.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  const extraSchema = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : [];

  const structuredDataList = [...schemaList, ...extraSchema];

  const robotsDirective = `${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}, max-snippet:-1, max-image-preview:large, max-video-preview:-1`;

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="application-name" content="Creadent Dental Clinic" />
      <meta name="theme-color" content="#007FAF" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta name="googlebot" content={robotsDirective} />
      <meta name="robots" content={robotsDirective} />
      <meta name="geo.region" content="IN-WB" />
      <meta name="geo.placename" content="Salt Lake, Kolkata" />
      <meta name="geo.position" content="22.5855;88.4017" />
      <meta name="ICBM" content="22.5855, 88.4017" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-title"
        content="Creadent Dental Clinic"
      />
      <meta name="mobile-web-app-capable" content="yes" />

      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en-IN" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <link
        rel="sitemap"
        type="application/xml"
        href={`${baseUrl}/sitemap.xml`}
      />
      <link rel="dns-prefetch" href={baseUrl} />
      <link rel="preconnect" href={baseUrl} />
      {apiOrigin ? <link rel="dns-prefetch" href={apiOrigin} /> : null}
      {apiOrigin ? (
        <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
      ) : null}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:width" content={imageWidth} />
      <meta property="og:image:height" content={imageHeight} />
      <meta property="og:image:alt" content={imageDescription} />
      <meta property="og:site_name" content="Creadent Dental Clinic" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageDescription} />
      {twitterSite ? <meta name="twitter:site" content={twitterSite} /> : null}

      {structuredDataList.map((item, index) => (
        <script key={`${title}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
