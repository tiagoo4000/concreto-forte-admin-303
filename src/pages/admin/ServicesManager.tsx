import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  image_url: string | null;
  order_index: number;
  active: boolean;
}

const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("order_index");

    if (error) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const serviceData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      order_index: parseInt(formData.get("order_index") as string),
      active: formData.get("active") === "on",
    };

    if (editing) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editing.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Serviço atualizado com sucesso!" });
    } else {
      const { error } = await supabase.from("services").insert(serviceData);

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Serviço criado com sucesso!" });
    }

    setEditing(null);
    loadServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Serviço excluído com sucesso!" });
      loadServices();
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-black">Gestão de Serviços</h1>
        </div>

        {editing ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editing.id ? "Editar Serviço" : "Novo Serviço"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editing.title}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editing.description}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ícone (nome do Lucide)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editing.icon}
                    placeholder="Truck"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="order_index">Ordem</Label>
                  <Input
                    id="order_index"
                    name="order_index"
                    type="number"
                    defaultValue={editing.order_index}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    defaultChecked={editing.active}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Salvar</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setEditing({} as Service)} className="mb-6">
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        )}

        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground mb-2">
                      {service.description}
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Ícone: {service.icon}</span>
                      <span>Ordem: {service.order_index}</span>
                      <span>Status: {service.active ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesManager;
