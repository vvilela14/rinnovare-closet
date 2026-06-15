export function WhatsAppButton() {
  const phone = "5511973583378";
  const message = encodeURIComponent("Olá, eu gostaria de agendar uma visita");
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Agendar visita pelo WhatsApp"
      className="group fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-[#25D366] py-3 pl-3 pr-5 text-sm font-medium text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.6)] transition hover:scale-[1.03] hover:bg-[#1ebe5b]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M19.11 17.21c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01a1.1 1.1 0 0 0-.8.37c-.27.3-1.05 1.02-1.05 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.12 3.24 5.15 4.55.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/>
          <path d="M26.78 5.22A14.86 14.86 0 0 0 16.05.8C7.88.8 1.27 7.41 1.27 15.58c0 2.6.68 5.13 1.97 7.35L1.16 30.4l7.66-2.01a14.78 14.78 0 0 0 7.23 1.84h.01c8.16 0 14.78-6.61 14.78-14.78 0-3.95-1.54-7.66-4.06-10.23zm-10.73 22.7h-.01a12.3 12.3 0 0 1-6.27-1.72l-.45-.27-4.55 1.19 1.22-4.43-.29-.46a12.27 12.27 0 0 1-1.88-6.55c0-6.79 5.53-12.31 12.32-12.31 3.29 0 6.38 1.28 8.7 3.61a12.23 12.23 0 0 1 3.6 8.71c0 6.79-5.52 12.31-12.31 12.31z"/>
        </svg>
      </span>
      <span className="hidden sm:inline">Agendar Visita</span>
    </a>
  );
}
