const Preloader = () => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-primary/5 to-white"
    role="status"
    aria-live="polite"
    aria-label="Loading application"
  >
    <div className="text-center">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-primary/30 animate-pulse [animation-delay:150ms]" />
        <div className="absolute inset-8 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-full h-full rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin" />
        </div>
        <div className="absolute inset-10 flex items-center justify-center">
          <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center">
            <img
              src="/logo/logo.png"
              alt="Creadent Dental Clinic"
              className="w-10 h-10 object-contain"
              width={40}
              height={40}
              fetchPriority="high"
            />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Creadent</h1>
        <p className="text-sm text-gray-500">Dental Clinic</p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

export default Preloader;
