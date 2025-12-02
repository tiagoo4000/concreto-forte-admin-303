import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Trash2, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  position: string;
  order_index: number;
  active: boolean;
}

const BannersManager = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar banners",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from("banners")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Banner atualizado com sucesso!" });
      } else {
        if (!formData.title || !formData.image_url) {
          toast({
            title: "Campos obrigatórios",
            description: "Título e URL da imagem são obrigatórios",
            variant: "destructive",
          });
          return;
        }
        
        const { error } = await supabase
          .from("banners")
          .insert([{ 
            title: formData.title,
            image_url: formData.image_url,
            description: formData.description,
            position: formData.position || "hero",
            active: formData.active ?? true,
            order_index: banners.length 
          }]);

        if (error) throw error;
        toast({ title: "Banner criado com sucesso!" });
      }

      setEditingId(null);
      setFormData({});
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este banner?")) return;

    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Banner excluído com sucesso!" });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData(banner);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Banners</h1>
        </div>
        <Button onClick={() => setEditingId("")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Banner
        </Button>
      </div>

      {(editingId !== null) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Banner" : "Novo Banner"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={formData.image_url || ""}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="position">Posição</Label>
              <Input
                id="position"
                value={formData.position || "hero"}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="hero"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <h3 className="font-semibold">{banner.title}</h3>
                <p className="text-sm text-muted-foreground">{banner.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Posição: {banner.position} | {banner.active ? "Ativo" : "Inativo"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannersManager;
