import { ReactNode, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import CookieConsent from "./CookieConsent";
import { useCompanyName } from "@/hooks/useCompanyName";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const companyName = useCompanyName();

  useEffect(() => {
    document.title = `${companyName} - Concreto Usinado de Qualidade | Entrega Rápida`;
    
    // Update OG meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', `${companyName} - Concreto Usinado de Qualidade`);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', `${companyName} - Soluções completas em concreto usinado. Qualidade, pontualidade e confiança.`);
    }
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${companyName} - Concreto usinado de alta qualidade para sua obra. Entrega pontual, controle tecnológico e preço competitivo.`);
    }
  }, [companyName]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CookieConsent />
    </div>
  );
};

export default Layout;
