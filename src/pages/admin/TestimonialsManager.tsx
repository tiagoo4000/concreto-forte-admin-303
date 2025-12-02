import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  active: boolean;
}

const TestimonialsManager = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar depoimentos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTestimonials(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const testimonialData = {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      content: formData.get("content") as string,
      rating: parseInt(formData.get("rating") as string),
      active: formData.get("active") === "on",
    };

    if (editing && editing.id) {
      const { error } = await supabase
        .from("testimonials")
        .update(testimonialData)
        .eq("id", editing.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Depoimento atualizado com sucesso!" });
    } else {
      const { error } = await supabase.from("testimonials").insert(testimonialData);

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Depoimento criado com sucesso!" });
    }

    setEditing(null);
    loadTestimonials();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este depoimento?")) return;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Depoimento excluído com sucesso!" });
      loadTestimonials();
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
          <h1 className="text-3xl font-black">Gestão de Depoimentos</h1>
        </div>

        {editing ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {editing.id ? "Editar Depoimento" : "Novo Depoimento"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editing.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Cargo/Empresa</Label>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={editing.role}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Depoimento</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editing.content}
                    required
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Avaliação (1-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={editing.rating || 5}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    defaultChecked={editing.active !== false}
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
          <Button onClick={() => setEditing({} as Testimonial)} className="mb-6">
            <Plus className="h-4 w-4 mr-2" />
            Novo Depoimento
          </Button>
        )}

        <div className="grid gap-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{testimonial.name}</h3>
                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {testimonial.role}
                    </p>
                    <p className="text-muted-foreground italic mb-2">
                      "{testimonial.content}"
                    </p>
                    <span className="text-sm text-muted-foreground">
                      Status: {testimonial.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(testimonial)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(testimonial.id)}
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

export default TestimonialsManager;
