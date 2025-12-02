import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConcreteType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  order_index: number;
  active: boolean;
}

export default function ConcreteTypesManager() {
  const navigate = useNavigate();
  const [concreteTypes, setConcreteTypes] = useState<ConcreteType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    order_index: 0,
  });

  useEffect(() => {
    fetchConcreteTypes();

    const channel = supabase
      .channel("concrete_types_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "concrete_types",
        },
        () => {
          fetchConcreteTypes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConcreteTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("concrete_types")
        .select("*")
        .order("order_index");

      if (error) throw error;
      setConcreteTypes(data || []);
    } catch (error) {
      console.error("Error fetching concrete types:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de concreto",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        order_index: formData.order_index,
      };

      if (editingId) {
        const { error } = await supabase
          .from("concrete_types")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Tipo de concreto atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from("concrete_types")
          .insert([dataToSave]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Tipo de concreto criado com sucesso",
        });
      }

      resetForm();
      fetchConcreteTypes();
    } catch (error) {
      console.error("Error saving concrete type:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o tipo de concreto",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (type: ConcreteType) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      description: type.description || "",
      price: type.price.toString(),
      order_index: type.order_index,
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("concrete_types")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de concreto excluído com sucesso",
      });

      fetchConcreteTypes();
    } catch (error) {
      console.error("Error deleting concrete type:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o tipo de concreto",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("concrete_types")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Tipo de concreto ${!currentStatus ? "ativado" : "desativado"} com sucesso`,
      });

      fetchConcreteTypes();
    } catch (error) {
      console.error("Error toggling concrete type:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      order_index: concreteTypes.length,
    });
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Concreto</h1>
          <p className="text-muted-foreground">Gerencie os tipos e preços de concreto</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar" : "Adicionar"} Tipo de Concreto</CardTitle>
          <CardDescription>
            {editingId ? "Edite as informações" : "Preencha os dados do novo tipo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Concreto estrutural (FCK 25)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço por m³ (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva as características deste tipo de concreto"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Ordem de exibição</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </>
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Preço/m³</TableHead>
                <TableHead className="text-center">Ordem</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concreteTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">R$ {type.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">{type.order_index}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant={type.active ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleActive(type.id, type.active)}
                    >
                      {type.active ? "Ativo" : "Inativo"}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(type)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de concreto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
