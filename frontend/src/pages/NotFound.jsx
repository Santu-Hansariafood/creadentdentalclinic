import { Link } from "react-router-dom";
import { Home, CalendarDays, Stethoscope } from "lucide-react";
import SEO from "../components/SEO";
import publicContent from "../data/publicPages.json";

const NotFound = () => {
  const { site, pages } = publicContent;
  const quickLinks = pages
    .filter((page) =>
      ["/", "/about-us", "/contact-us", "/google-reviews"].includes(page.path),
    )
    .map((page) => ({ label: page.label, path: page.path }));

  return (
    <>
      <SEO
        title="Page Not Found (404) | Creadent Dental Clinic"
        description="The page you are looking for could not be found. Explore our dental services, contact Creadent Dental Clinic, or return to the homepage."
        url="/404"
        noindex
        nofollow
        includeBusinessSchema={false}
      />

      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl text-center">
          <p className="font-heading text-7xl font-extrabold tracking-tight text-primary sm:text-9xl">
            404
          </p>

          <h1 className="mt-4 font-heading text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
            We couldn&apos;t find that page
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-gray-600 dark:text-gray-400">
            The link may be broken, or the page may have been moved. Let&apos;s
            get you back on track with {site.name}.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90"
            >
              <Home size={18} />
              Back to Home
            </Link>
            <Link
              to="/contact-us"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <CalendarDays size={18} />
              Book Appointment
            </Link>
            <Link
              to="/doctor/sunita-agarwalla"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-bold text-gray-800 dark:text-gray-200 transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <Stethoscope size={18} />
              Our Doctor
            </Link>
          </div>

          <div className="mt-10 border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Popular pages
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
