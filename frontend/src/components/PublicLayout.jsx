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
            <Link to="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12">
                <img
                  src="/logo/logo.png"
                  alt={`${site.name} logo`}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold text-gray-900 sm:text-lg">
                  {site.name}
                </p>
                <p className="truncate text-xs text-gray-600 sm:text-sm">{site.tagline}</p>
              </div>
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <a
                href={site.phoneHref}
                className="inline-flex min-w-0 items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15 sm:text-sm"
              >
                <Phone size={16} />
                <span className="truncate">{site.phoneDisplay}</span>
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

          <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {pages.map((page) => {
              const isActive = location.pathname === page.path;

              return (
                <Link
                  key={page.slug}
                  to={page.path}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
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

      <footer className="border-t border-gray-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12 lg:px-8 lg:py-10">
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <img
                  src="/logo/logo.png"
                  alt={`${site.name} logo`}
                  className="h-7 w-7 object-contain"
                />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-white">
                  {site.name}
                </p>
                <p className="text-sm text-slate-300">{site.tagline}</p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-slate-300">
              {site.description}
            </p>
          </div>

          <div>
            <h2 className="font-heading text-base font-semibold text-white">
              Quick links
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  to={page.path}
                  className="truncate text-slate-300 transition-colors hover:text-cyan-300"
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-heading text-base font-semibold text-white">
              Contact
            </h2>
            <div className="mt-4 space-y-2.5 text-sm text-slate-300">
              <a
                href={site.phoneHref}
                className="flex items-start gap-3 transition-colors hover:text-cyan-300"
              >
                <Phone className="mt-0.5 shrink-0 text-cyan-300" size={16} />
                <span>{site.phoneDisplay}</span>
              </a>
              <a
                href={site.emailHref}
                className="flex items-start gap-3 break-all transition-colors hover:text-cyan-300"
              >
                <Mail className="mt-0.5 shrink-0 text-cyan-300" size={16} />
                <span>{site.email}</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 shrink-0 text-cyan-300" size={16} />
                <span>{site.addressLines.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8 lg:text-left">
            © {new Date().getFullYear()} {site.name} · Trusted dental care in Salt Lake, Kolkata · All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
