import { Helmet } from "react-helmet-async";

const SEO = ({
  title = "Best Dental Clinic in Kolkata | Creadent Dental Clinic",
  description = "Creadent Dental Clinic is the best dental clinic in Kolkata offering advanced dental care, root canal, teeth whitening, implants & more. Book your appointment today!",
  keywords = "best dental clinic in Kolkata, dentist near me, root canal treatment Kolkata, teeth whitening, dental implants, Creadent Dental Clinic, dental clinic Kolkata, orthodontist Kolkata, pediatric dentist Kolkata, cosmetic dentistry",
  image = "/logo/logo.png",
  url = window.location.href,
  author = "Creadent Dental Clinic",
  type = "website",
  noindex = false,
  nofollow = false,
  canonical,
}) => {
  const baseUrl = import.meta.env.VITE_SITE_URL || "https://creadentsmiles.com";
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
  const canonicalUrl = canonical || fullUrl;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={`${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}`} />
      
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Creadent Dental Clinic" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;
