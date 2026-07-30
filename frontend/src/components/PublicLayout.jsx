import { Link, useLocation } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import publicContent from "../data/publicPages.json";

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { site, pages } = publicContent;

  const dashboardPath = user ? `/${user.role}/dashboard` : "/login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/10">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <img
                  src="/logo/logo.png"
                  alt={`${site.name} logo`}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-gray-900">
                  {site.name}
                </p>
                <p className="text-sm text-gray-600">{site.tagline}</p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={site.phoneHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <Phone size={16} />
                {site.phoneDisplay}
              </a>

              {isAuthenticated ? (
                <Link to={dashboardPath} className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to={site.cta.secondaryHref} className="btn-secondary">
                    {site.cta.secondaryLabel}
                  </Link>
                  <Link to={site.cta.primaryHref} className="btn-primary">
                    {site.cta.primaryLabel}
                  </Link>
                </>
              )}
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {pages.map((page) => {
              const isActive = location.pathname === page.path;

              return (
                <Link
                  key={page.slug}
                  to={page.path}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {page.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <img
                  src="/logo/logo.png"
                  alt={`${site.name} logo`}
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-gray-900">
                  {site.name}
                </p>
                <p className="text-sm text-gray-600">{site.tagline}</p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-gray-600">
              {site.description}
            </p>
          </div>

          <div>
            <h2 className="font-heading text-base font-semibold text-gray-900">
              Quick links
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  to={page.path}
                  className="text-gray-600 transition-colors hover:text-primary"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-heading text-base font-semibold text-gray-900">
              Contact
            </h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <a
                href={site.phoneHref}
                className="flex items-start gap-3 transition-colors hover:text-primary"
              >
                <Phone className="mt-0.5 text-primary" size={16} />
                <span>{site.phoneDisplay}</span>
              </a>
              <a
                href={site.emailHref}
                className="flex items-start gap-3 break-all transition-colors hover:text-primary"
              >
                <Mail className="mt-0.5 text-primary" size={16} />
                <span>{site.email}</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-primary" size={16} />
                <span>{site.addressLines.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
