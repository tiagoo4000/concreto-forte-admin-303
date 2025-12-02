import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-border rounded-lg shadow-2xl p-6 max-w-xl w-full animate-scale-in">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">🍪 Política de Cookies</h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa{" "}
              <Link to="/politica-de-privacidade" className="underline hover:text-primary font-medium">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAccept} className="flex-1">
              Aceitar Cookies
            </Button>
            <Button onClick={handleReject} variant="outline" className="flex-1">
              Rejeitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
