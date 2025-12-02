import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload } from "lucide-react";

interface BrandingSettings {
  logo_url?: string;
  favicon_url?: string;
  company_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  button_color?: string;
  site_description?: string;
  og_image_url?: string;
}

const BrandingManager = () => {
  const [settings, setSettings] = useState<BrandingSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["logo_url", "favicon_url", "company_name", "primary_color", "secondary_color", "accent_color", "button_color", "site_description", "og_image_url"]);

      if (error) throw error;

      const settingsObj: BrandingSettings = {};
      data?.forEach((item) => {
        settingsObj[item.key as keyof BrandingSettings] = String(item.value);
      });

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
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(update, { onConflict: "key" });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Identidade visual atualizada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof BrandingSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'og_image') => {
    try {
      setUploading(type);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      const keyMap = {
        'logo': 'logo_url',
        'favicon': 'favicon_url',
        'og_image': 'og_image_url'
      };
      
      const key = keyMap[type];
      setSettings((prev) => ({ ...prev, [key]: publicUrl }));

      toast({
        title: "Upload realizado",
        description: `${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : 'Imagem de compartilhamento'} enviado com sucesso!`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
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
        <h1 className="text-3xl font-bold">Identidade Visual</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={settings.company_name || ""}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>
            <div>
              <Label htmlFor="site_description">Descrição (para redes sociais)</Label>
              <Input
                id="site_description"
                value={settings.site_description || ""}
                onChange={(e) => handleChange("site_description", e.target.value)}
                placeholder="Descrição que aparece ao compartilhar no WhatsApp, Facebook, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logotipos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'logo');
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo'}
              >
                {uploading === 'logo' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Logo
                  </>
                )}
              </Button>
              {settings.logo_url && (
                <div className="mt-2">
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="h-16 object-contain"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="favicon">Favicon</Label>
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'favicon');
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading === 'favicon'}
              >
                {uploading === 'favicon' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Favicon
                  </>
                )}
              </Button>
              {settings.favicon_url && (
                <div className="mt-2">
                  <img
                    src={settings.favicon_url}
                    alt="Favicon"
                    className="h-8 object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem de Compartilhamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="og_image">Imagem Open Graph (WhatsApp, Facebook, etc.)</Label>
              <input
                ref={ogImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'og_image');
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => ogImageInputRef.current?.click()}
                disabled={uploading === 'og_image'}
              >
                {uploading === 'og_image' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Escolher Imagem
                  </>
                )}
              </Button>
              {settings.og_image_url && (
                <div className="mt-2">
                  <img
                    src={settings.og_image_url}
                    alt="Open Graph"
                    className="h-32 object-contain"
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Essa imagem aparecerá quando seu site for compartilhado no WhatsApp, Facebook e outras redes sociais. Tamanho recomendado: 1200x630px
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_color">Cor Primária (Hexadecimal)</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  value={settings.primary_color || "#000000"}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  placeholder="Ex: #FF0000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
                <Input
                  type="color"
                  value={settings.primary_color || "#000000"}
                  onChange={(e) => handleChange("primary_color", e.target.value)}
                  className="w-20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="secondary_color">Cor Secundária (Hexadecimal)</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  value={settings.secondary_color || "#666666"}
                  onChange={(e) => handleChange("secondary_color", e.target.value)}
                  placeholder="Ex: #666666"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
                <Input
                  type="color"
                  value={settings.secondary_color || "#666666"}
                  onChange={(e) => handleChange("secondary_color", e.target.value)}
                  className="w-20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accent_color">Cor de Destaque (Hexadecimal)</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  value={settings.accent_color || "#ff6b35"}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  placeholder="Ex: #FF6B35"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
                <Input
                  type="color"
                  value={settings.accent_color || "#ff6b35"}
                  onChange={(e) => handleChange("accent_color", e.target.value)}
                  className="w-20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="button_color">Cor dos Botões (Hexadecimal)</Label>
              <div className="flex gap-2">
                <Input
                  id="button_color"
                  value={settings.button_color || "#ff6b35"}
                  onChange={(e) => handleChange("button_color", e.target.value)}
                  placeholder="Ex: #FF6B35"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
                <Input
                  type="color"
                  value={settings.button_color || "#ff6b35"}
                  onChange={(e) => handleChange("button_color", e.target.value)}
                  className="w-20"
                />
              </div>
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
            "Salvar Alterações"
          )}
        </Button>
      </div>
    </div>
  );
};

export default BrandingManager;
