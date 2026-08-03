import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "Best Dental Clinic in Kolkata | Creadent Dental Clinic",
  description = "Creadent Dental Clinic is the best dental clinic in Kolkata offering advanced dental care, root canal, teeth whitening, implants & more. Book your appointment today!",
  keywords = "best dental clinic in Kolkata, dentist near me, root canal treatment Kolkata, teeth whitening, dental implants, Creadent Dental Clinic, dental clinic Kolkata, orthodontist Kolkata, pediatric dentist Kolkata, cosmetic dentistry",
  image = "/logo/logo.png",
  url,
  author = "Creadent Dental Clinic",
  type = "website",
  noindex = false,
  nofollow = false,
  canonical,
  structuredData,
  imageAlt,
}) => {
  const rawBaseUrl = import.meta.env.VITE_SITE_URL || "https://creadentsmiles.com";
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/";
  const resolvedUrl = url || currentUrl;
  const fullUrl = resolvedUrl.startsWith("http")
    ? resolvedUrl
    : `${baseUrl}${resolvedUrl}`;
  const canonicalUrl = canonical || fullUrl;
  const imageUrl = image.startsWith("http") ? image : `${baseUrl}${image}`;
  const imageDescription = imageAlt || `${title} preview image`;
  const structuredDataList = Array.isArray(structuredData)
    ? structuredData
    : structuredData
      ? [structuredData]
      : [];
  const apiOrigin = (() => {
    try {
      return import.meta.env.VITE_API_URL
        ? new URL(import.meta.env.VITE_API_URL).origin
        : null;
    } catch {
      return null;
    }
  })();

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
      <meta
        name="googlebot"
        content={`${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}, max-image-preview:large`}
      />
      <meta name="robots" content={`${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}`} />
      <meta name="geo.region" content="IN-WB" />
      <meta name="geo.placename" content="Salt Lake, Kolkata" />
      <meta name="geo.position" content="22.5855;88.4017" />
      <meta name="ICBM" content="22.5855, 88.4017" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="Creadent Dental Clinic" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en-in" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
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
      <meta property="og:image:alt" content={imageDescription} />
      <meta property="og:site_name" content="Creadent Dental Clinic" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageDescription} />

      {structuredDataList.map((item, index) => (
        <script key={`${title}-schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
