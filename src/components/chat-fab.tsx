import { MessageCircle } from "lucide-react";

export function ChatFab() {
  return (
    <a
      href="https://wa.me/2348000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with customer service on WhatsApp"
      className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
