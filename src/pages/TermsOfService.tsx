import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TermsOfService = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "terms_of_service")
        .maybeSingle();

      if (error) throw error;
      setContent(data?.value as string || "Termos de Uso em construção.");
    } catch (error) {
      console.error("Erro ao carregar termos de uso:", error);
      setContent("Erro ao carregar conteúdo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="mb-8 text-4xl font-bold">Termos de Uso</h1>
      <div 
        className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground" 
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default TermsOfService;
