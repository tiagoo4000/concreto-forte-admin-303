import { NavLink } from "./NavLink";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "/favicon.png";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("ConcrePlus");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("5511999999999");

  useEffect(() => {
    fetchBranding();

    // Listen for changes in site_settings
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=in.(logo_url,company_name,whatsapp)'
        },
        () => {
          fetchBranding();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBranding = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["logo_url", "company_name", "whatsapp"]);

      if (data) {
        data.forEach((item) => {
          if (item.key === "logo_url" && item.value) {
            setLogoUrl(String(item.value));
          } else if (item.key === "company_name" && item.value) {
            setCompanyName(String(item.value));
          } else if (item.key === "whatsapp" && item.value) {
            let cleanValue = String(item.value).replace(/\D/g, '');
            if (cleanValue && !cleanValue.startsWith('55')) {
              cleanValue = '55' + cleanValue;
            }
            setWhatsappNumber(cleanValue);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching branding:", error);
    }
  };

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/sobre", label: "Sobre" },
    { to: "/servicos", label: "Serviços" },
    { to: "/calculadora", label: "Calculadora" },
    { to: "/contato", label: "Contato" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-24 md:h-28 items-center justify-between">
          <NavLink to="/" className="flex items-center space-x-2">
            <img 
              src={logoUrl || defaultLogo} 
              alt={`${companyName} Logo`}
              className="h-16 md:h-20 object-contain" 
            />
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
                activeClassName="text-primary"
              >
                {link.label}
              </NavLink>
            ))}
            <Button variant="hero" size="sm" asChild>
              <Link to="/cadastro">
                Solicitar Orçamento
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-3 border-t">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="block py-2 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
                activeClassName="text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Button variant="hero" size="sm" className="w-full" asChild>
              <Link to="/cadastro">
                Solicitar Orçamento
              </Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
