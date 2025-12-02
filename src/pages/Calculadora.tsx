import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FormattedInput } from "@/components/ui/formatted-input";
import { Checkbox } from "@/components/ui/checkbox";

interface ConcreteType {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

export default function Calculadora() {
  const [inputMode, setInputMode] = useState<"dimensions" | "volume">("dimensions");
  const [comprimento, setComprimento] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [volumeDireto, setVolumeDireto] = useState("");
  const [concreteType, setConcreteType] = useState("");
  const [concreteTypes, setConcreteTypes] = useState<ConcreteType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeStaticPump, setIncludeStaticPump] = useState(false);
  const STATIC_PUMP_PRICE = 750;
  const [result, setResult] = useState<{
    volume: number;
    pricePerM3: number;
    totalCost: number;
  } | null>(null);

  useEffect(() => {
    fetchConcreteTypes();

    // Listen for changes in concrete_types
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
        .select("id, name, price, description")
        .eq("active", true)
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

  const handleCalculate = () => {
    let volume = 0;

    if (inputMode === "dimensions") {
      const comp = parseFloat(comprimento.replace(',', '.'));
      const larg = parseFloat(largura.replace(',', '.'));
      const alt = parseFloat(altura.replace(',', '.'));

      if (!comp || !larg || !alt || !concreteType) {
        return;
      }
      volume = comp * larg * alt;
    } else {
      volume = parseFloat(volumeDireto.replace(',', '.'));
      if (!volume || !concreteType) {
        return;
      }
    }

    const selectedConcrete = concreteTypes.find((c) => c.id === concreteType);
    const pricePerM3 = selectedConcrete?.price || 0;
    let totalCost = volume * pricePerM3;
    
    if (includeStaticPump) {
      totalCost += STATIC_PUMP_PRICE;
    }

    setResult({
      volume,
      pricePerM3,
      totalCost,
    });
  };

  const handleReset = () => {
    setComprimento("");
    setLargura("");
    setAltura("");
    setVolumeDireto("");
    setConcreteType("");
    setIncludeStaticPump(false);
    setResult(null);
  };

  const toggleInputMode = () => {
    setInputMode(inputMode === "dimensions" ? "volume" : "dimensions");
    setComprimento("");
    setLargura("");
    setAltura("");
    setVolumeDireto("");
    setResult(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando tipos de concreto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Calculadora de Concreto</h1>
          <p className="text-muted-foreground">
            Calcule o volume e o custo estimado do concreto para sua obra
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              Medidas da Obra
            </CardTitle>
            <CardDescription>Preencha as dimensões ou informe o volume diretamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleInputMode}
                className="gap-2"
              >
                <ArrowLeftRight className="h-4 w-4" />
                {inputMode === "dimensions" ? "Trocar para m³" : "Usar dimensões"}
              </Button>
            </div>

            {inputMode === "dimensions" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comprimento">Comprimento (m)</Label>
                  <FormattedInput
                    id="comprimento"
                    placeholder="0,00"
                    value={comprimento}
                    onChange={setComprimento}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="largura">Largura (m)</Label>
                  <FormattedInput
                    id="largura"
                    placeholder="0,00"
                    value={largura}
                    onChange={setLargura}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altura">Altura / Espessura (m)</Label>
                  <FormattedInput
                    id="altura"
                    placeholder="0,00"
                    value={altura}
                    onChange={setAltura}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="volume">Volume (m³)</Label>
                <FormattedInput
                  id="volume"
                  placeholder="0,00"
                  value={volumeDireto}
                  onChange={setVolumeDireto}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="concrete-type">Tipo de Concreto</Label>
              <Select value={concreteType} onValueChange={setConcreteType}>
                <SelectTrigger id="concrete-type">
                  <SelectValue placeholder="Selecione o tipo de concreto" />
                </SelectTrigger>
                <SelectContent>
                  {concreteTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} — R$ {type.price.toFixed(2)}/m³
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
              <Checkbox
                id="static_pump_calc"
                checked={includeStaticPump}
                onCheckedChange={(checked) => setIncludeStaticPump(checked as boolean)}
              />
              <Label htmlFor="static_pump_calc" className="cursor-pointer">
                Bomba Estacionária / Lança (+R$ {STATIC_PUMP_PRICE.toFixed(2)})
              </Label>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCalculate} className="flex-1" size="lg">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg">
                Limpar
              </Button>
            </div>

            {result && (
              <div className="mt-6 p-6 bg-primary/10 rounded-lg border-2 border-primary/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Resultado:</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Volume total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {result.volume.toFixed(2)} m³
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Preço por m³:</span>
                    <span className="text-lg font-semibold text-foreground">
                      R$ {result.pricePerM3.toFixed(2)}
                    </span>
                  </div>
                  {includeStaticPump && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bomba Estacionária / Lança:</span>
                      <span className="text-lg font-semibold text-foreground">
                        R$ {STATIC_PUMP_PRICE.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-primary/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Custo total estimado:</span>
                      <span className="text-3xl font-bold text-primary">
                        R$ {result.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-background rounded-md border border-border">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Dica:</strong> adicione de 5 a 10% de sobra para compensar perdas e
                    acabamento.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
