import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MessageCircle } from "lucide-react";

const waUrl = `https://wa.me/8801845202101?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি Canvas Pathsala সম্পর্কে জানতে চাই।")}`;

function WhatsAppFloat() {
  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid place-items-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}