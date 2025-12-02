import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    company_name: "ConcrePlus",
    address: "Av. Exemplo, 123 - São Paulo, SP",
    phone: "(11) 99999-9999",
    email: "contato@concreplus.com.br",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["company_name", "address", "phone", "email", "facebook", "instagram", "linkedin"]);

      if (data) {
        const settingsObj: SiteSettings = {};
        data.forEach((item) => {
          const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          settingsObj[item.key as keyof SiteSettings] = value.replace(/^"|"$/g, '');
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <span className="text-xl font-black text-primary-foreground">{settings.company_name?.charAt(0) || "C"}</span>
              </div>
              <span className="text-xl font-black">{settings.company_name}</span>
            </div>
            <p className="text-sm text-secondary-foreground/80">
              Soluções completas em concreto usinado para sua obra. Qualidade, pontualidade e confiança.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="/sobre" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="/servicos" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Serviços
                </a>
              </li>
              <li>
                <a href="/contato" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Contato
                </a>
              </li>
              <li>
                <a href="/politica-de-privacidade" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="/termos-de-uso" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">
                  Termos de Uso
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-secondary-foreground/80">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/80">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-secondary-foreground/80">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>{settings.email}</span>
              </li>
            </ul>
          </div>

          {/* Horário e Redes Sociais */}
          <div>
            <h3 className="text-lg font-bold mb-4">Horário</h3>
            <div className="flex items-start gap-2 text-sm text-secondary-foreground/80 mb-6">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>Segunda a Sexta: 7h às 18h</p>
                <p>Sábado: 7h às 12h</p>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-4">Redes Sociais</h3>
            <div className="flex gap-4">
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.linkedin && (
                <a href={settings.linkedin} target="_blank" rel="noopener noreferrer" className="text-secondary-foreground/80 hover:text-primary transition-colors" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center text-sm text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} {settings.company_name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
