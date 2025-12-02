import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload } from "lucide-react";

interface SiteSettings {
  company_name?: string;
  company_description?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsapp?: string;
  whatsapp_business_link?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  pdf_logo_url?: string;
  pix_key?: string;
  pix_name?: string;
  pix_city?: string;
  pdf_primary_color?: string;
  pdf_background_color?: string;
}

const SiteSettingsManager = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      console.log("Fetched site settings:", data);

      const settingsObj: SiteSettings = {};
      data?.forEach((item) => {
        // Parse the JSONB value - it might be a string or already parsed
        const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        settingsObj[item.key as keyof SiteSettings] = value.replace(/^"|"$/g, ''); // Remove quotes if present
      });

      console.log("Parsed settings object:", settingsObj);
      setSettings(settingsObj);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save each setting individually to ensure JSONB format is correct
      const savePromises = Object.entries(settings)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => 
          supabase
            .from("site_settings")
            .upsert({ 
              key, 
              value: value || '' 
            }, { 
              onConflict: "key" 
            })
        );

      const results = await Promise.all(savePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        console.error('Errors saving settings:', errors);
        throw new Error(errors[0].error?.message || 'Erro ao salvar configurações');
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
      
      // Refresh the settings after save
      await fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      setSettings((prev) => ({ ...prev, pdf_logo_url: publicUrl }));
      
      toast({
        title: "Sucesso",
        description: "Logo enviada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar logo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Configurações do Site</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={settings.company_name || ""}
                onChange={(e) => handleChange("company_name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="company_description">Descrição</Label>
              <Textarea
                id="company_description"
                value={settings.company_description || ""}
                onChange={(e) => handleChange("company_description", e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={settings.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="logo">Logo para PDF</Label>
              <div className="space-y-2">
                {settings.pdf_logo_url && (
                  <div className="relative w-32 h-32 border rounded overflow-hidden">
                    <img src={settings.pdf_logo_url} alt="Logo PDF" className="w-full h-full object-contain" />
                  </div>
                )}
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Imagem que aparece apenas no PDF (max 2MB)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="pdf_primary_color">Cor Principal do PDF</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="pdf_primary_color"
                  type="color"
                  value={settings.pdf_primary_color || "#1F4A7D"}
                  onChange={(e) => handleChange("pdf_primary_color", e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.pdf_primary_color || "#1F4A7D"}
                  onChange={(e) => handleChange("pdf_primary_color", e.target.value)}
                  placeholder="#1F4A7D"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cor usada para títulos e textos destacados no PDF
              </p>
            </div>

            <div>
              <Label htmlFor="pdf_background_color">Cor de Fundo do PDF</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="pdf_background_color"
                  type="color"
                  value={settings.pdf_background_color || "#1F4A7D"}
                  onChange={(e) => handleChange("pdf_background_color", e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.pdf_background_color || "#1F4A7D"}
                  onChange={(e) => handleChange("pdf_background_color", e.target.value)}
                  placeholder="#1F4A7D"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cor usada para fundos e elementos de destaque no PDF
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="text"
                inputMode="numeric"
                value={settings.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Ex: 11999999999 ou 08001234567"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp (Número)</Label>
              <Input
                id="whatsapp"
                value={settings.whatsapp || ""}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="5511912345678"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado como fallback caso o link direto não esteja configurado
              </p>
            </div>

            <div>
              <Label htmlFor="whatsapp_business_link">Link do WhatsApp Business</Label>
              <Input
                id="whatsapp_business_link"
                value={settings.whatsapp_business_link || ""}
                onChange={(e) => handleChange("whatsapp_business_link", e.target.value)}
                placeholder="https://wa.me/message/E6YPLU5OIQSSM1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link direto do WhatsApp Business (mostra foto e informações da empresa)
              </p>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={settings.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PIX - Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={settings.pix_key || ""}
                onChange={(e) => handleChange("pix_key", e.target.value)}
                placeholder="email@exemplo.com ou CPF/CNPJ"
              />
            </div>

            <div>
              <Label htmlFor="pix_name">Nome do Recebedor</Label>
              <Input
                id="pix_name"
                value={settings.pix_name || ""}
                onChange={(e) => handleChange("pix_name", e.target.value)}
                placeholder="Nome completo ou razão social"
              />
            </div>

            <div>
              <Label htmlFor="pix_city">Cidade</Label>
              <Input
                id="pix_city"
                value={settings.pix_city || ""}
                onChange={(e) => handleChange("pix_city", e.target.value)}
                placeholder="São Paulo"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={settings.facebook || ""}
                onChange={(e) => handleChange("facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={settings.instagram || ""}
                onChange={(e) => handleChange("instagram", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={settings.linkedin || ""}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
};

export default SiteSettingsManager;
