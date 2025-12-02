import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RichTextEditor from "@/components/RichTextEditor";

const LegalManager = () => {
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["privacy_policy", "terms_of_service"]);

      if (error) throw error;

      if (data) {
        data.forEach((setting) => {
          if (setting.key === "privacy_policy") {
            setPrivacyPolicy(setting.value as string || "");
          } else if (setting.key === "terms_of_service") {
            setTermsOfService(setting.value as string || "");
          }
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const updates = [
        { key: "privacy_policy", value: privacyPolicy },
        { key: "terms_of_service", value: termsOfService },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(update, { onConflict: "key" });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Política de Privacidade e Termos de Uso</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Política de Privacidade</label>
          <RichTextEditor
            value={privacyPolicy}
            onChange={setPrivacyPolicy}
            placeholder="Digite aqui a política de privacidade..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Termos de Uso</label>
          <RichTextEditor
            value={termsOfService}
            onChange={setTermsOfService}
            placeholder="Digite aqui os termos de uso..."
          />
        </div>

        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default LegalManager;
