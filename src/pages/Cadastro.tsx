import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Send, ArrowLeftRight, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { FormattedInput } from "@/components/ui/formatted-input";
import { Checkbox } from "@/components/ui/checkbox";
import { validateCPForCNPJ } from "@/lib/utils";

interface ConcreteType {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

export default function Cadastro() {
  const { toast } = useToast();
  const [concreteTypes, setConcreteTypes] = useState<ConcreteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"dimensions" | "volume">("dimensions");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("5511999999999");
  const [whatsappBusinessLink, setWhatsappBusinessLink] = useState<string>("");
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_document: "",
    customer_phone: "",
    customer_email: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    concrete_type_id: "",
    length: "",
    width: "",
    height: "",
    volume_direct: "",
    delivery_date: "",
    observations: "",
  });

  const [includeStaticPump, setIncludeStaticPump] = useState(false);
  const STATIC_PUMP_PRICE = 750;

  const [calculation, setCalculation] = useState({
    volume: 0,
    pricePerM3: 0,
    totalPrice: 0,
  });

  useEffect(() => {
    fetchConcreteTypes();
    fetchWhatsappConfig();
  }, []);

  useEffect(() => {
    calculateValues();
  }, [formData.concrete_type_id, formData.length, formData.width, formData.height, formData.volume_direct, inputMode, includeStaticPump]);

  const fetchConcreteTypes = async () => {
    const { data, error } = await supabase
      .from("concrete_types")
      .select("*")
      .eq("active", true)
      .order("order_index");

    if (error) {
      toast({
        title: "Erro ao carregar tipos de concreto",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setConcreteTypes(data || []);
  };

  const fetchWhatsappConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["whatsapp", "whatsapp_business_link"]);

      if (data) {
        data.forEach(item => {
          const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          const cleanValue = value.replace(/^"|"$/g, '');
          
          if (item.key === "whatsapp_business_link" && cleanValue) {
            setWhatsappBusinessLink(cleanValue);
          } else if (item.key === "whatsapp" && cleanValue) {
            let cleanNumber = cleanValue.replace(/\D/g, '');
            if (cleanNumber && !cleanNumber.startsWith('55')) {
              cleanNumber = '55' + cleanNumber;
            }
            if (cleanNumber) {
              setWhatsappNumber(cleanNumber);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
    }
  };

  const handleWhatsAppClick = () => {
    const whatsappUrl = whatsappBusinessLink 
      ? whatsappBusinessLink 
      : `https://wa.me/${whatsappNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const calculateValues = () => {
    let volume = 0;

    if (inputMode === "dimensions") {
      const length = parseFloat(formData.length.replace(',', '.')) || 0;
      const width = parseFloat(formData.width.replace(',', '.')) || 0;
      const height = parseFloat(formData.height.replace(',', '.')) || 0;
      volume = length * width * height;
    } else {
      volume = parseFloat(formData.volume_direct.replace(',', '.')) || 0;
    }

    const selectedType = concreteTypes.find((type) => type.id === formData.concrete_type_id);
    const pricePerM3 = selectedType?.price || 0;
    let totalPrice = volume * pricePerM3;
    
    if (includeStaticPump) {
      totalPrice += STATIC_PUMP_PRICE;
    }

    setCalculation({ volume, pricePerM3, totalPrice });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (calculation.volume === 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todas as dimensões corretamente.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validar CPF ou CNPJ
    if (!validateCPForCNPJ(formData.customer_document)) {
      toast({
        title: "CPF/CNPJ Inválido",
        description: "Por favor, informe um CPF ou CNPJ válido.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const workAddress = `${formData.street}, ${formData.number}${formData.complement ? ', ' + formData.complement : ''}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;
      
      const { error } = await supabase.from("orders").insert({
        customer_name: formData.customer_name,
        customer_document: formData.customer_document,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        customer_cep: formData.cep,
        work_address: workAddress,
        concrete_type_id: formData.concrete_type_id,
        length: inputMode === "dimensions" ? parseFloat(formData.length.replace(',', '.')) : null,
        width: inputMode === "dimensions" ? parseFloat(formData.width.replace(',', '.')) : null,
        height: inputMode === "dimensions" ? parseFloat(formData.height.replace(',', '.')) : null,
        volume: calculation.volume,
        price_per_m3: calculation.pricePerM3,
        total_price: calculation.totalPrice,
        delivery_date: formData.delivery_date,
        observations: formData.observations,
        includes_static_pump: includeStaticPump,
      });

      if (error) throw error;

      // Track conversion in Google Ads
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17717595463/mRX-CKzhl70bEMeatIBC',
          'value': calculation.totalPrice,
          'currency': 'BRL'
        });
      }

      toast({
        title: "Pedido enviado com sucesso!",
        description: "Entraremos em contato em breve.",
      });

      // Reset form
      setFormData({
        customer_name: "",
        customer_document: "",
        customer_phone: "",
        customer_email: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        concrete_type_id: "",
        length: "",
        width: "",
        height: "",
        volume_direct: "",
        delivery_date: "",
        observations: "",
      });
      setIncludeStaticPump(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Cadastro de Pedido</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para solicitar um orçamento de concreto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Botão WhatsApp no topo */}
            <div className="mb-6">
              <Button 
                type="button" 
                onClick={handleWhatsAppClick}
                className="w-full gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white py-6 text-xs sm:text-base animate-pulse hover:animate-none"
              >
                <MessageCircle className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Orçamento via WhatsApp</span>
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-2">
                ⚡ Atendimento rápido e personalizado
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do Cliente */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Dados do Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Nome Completo *</Label>
                    <Input
                      id="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_document">CPF ou CNPJ *</Label>
                    <Input
                      id="customer_document"
                      required
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={formData.customer_document}
                      onChange={(e) => setFormData({ ...formData, customer_document: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_phone">Telefone / WhatsApp *</Label>
                    <Input
                      id="customer_phone"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="Ex: 11999999999 ou 08001234567"
                      value={formData.customer_phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, "");
                        setFormData({ ...formData, customer_phone: value });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_email">E-mail *</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      required
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    />
                  </div>
                 </div>

                 <div className="space-y-4">
                   <h4 className="text-lg font-semibold">Endereço da Obra</h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="cep">CEP *</Label>
                       <Input
                         id="cep"
                         required
                         placeholder="00000-000"
                         maxLength={9}
                         value={formData.cep}
                         onChange={async (e) => {
                           let value = e.target.value.replace(/[^\d]/g, "");
                           if (value.length > 5) {
                             value = value.slice(0, 5) + "-" + value.slice(5, 8);
                           }
                           setFormData({ ...formData, cep: value });
                           
                           // Buscar CEP quando tiver 8 dígitos
                           const cepNumbers = value.replace(/[^\d]/g, "");
                           if (cepNumbers.length === 8) {
                             try {
                               const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
                               const data = await response.json();
                               
                               if (!data.erro) {
                                 setFormData(prev => ({ 
                                   ...prev, 
                                   street: data.logradouro || "",
                                   neighborhood: data.bairro || "",
                                   city: data.localidade || "",
                                   state: data.uf || ""
                                 }));
                                 toast({
                                   title: "CEP encontrado!",
                                   description: "Endereço preenchido automaticamente.",
                                 });
                               } else {
                                 toast({
                                   title: "CEP não encontrado",
                                   description: "Por favor, verifique o CEP informado.",
                                   variant: "destructive",
                                 });
                               }
                             } catch (error) {
                               toast({
                                 title: "Erro ao buscar CEP",
                                 description: "Não foi possível consultar o CEP.",
                                 variant: "destructive",
                               });
                             }
                           }
                         }}
                       />
                     </div>

                     <div className="space-y-2 md:col-span-2">
                       <Label htmlFor="street">Logradouro *</Label>
                       <Input
                         id="street"
                         required
                         placeholder="Rua, Avenida, etc"
                         value={formData.street}
                         onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="number">Número *</Label>
                       <Input
                         id="number"
                         required
                         placeholder="123"
                         value={formData.number}
                         onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                       />
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="complement">Complemento</Label>
                       <Input
                         id="complement"
                         placeholder="Apto, Sala, etc"
                         value={formData.complement}
                         onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                       />
                     </div>

                     <div className="space-y-2 md:col-span-2">
                       <Label htmlFor="neighborhood">Bairro *</Label>
                       <Input
                         id="neighborhood"
                         required
                         placeholder="Bairro"
                         value={formData.neighborhood}
                         onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-2 md:col-span-3">
                       <Label htmlFor="city">Cidade *</Label>
                       <Input
                         id="city"
                         required
                         placeholder="Cidade"
                         value={formData.city}
                         onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                       />
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="state">Estado *</Label>
                       <Input
                         id="state"
                         required
                         placeholder="UF"
                         maxLength={2}
                         value={formData.state}
                         onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                       />
                     </div>
                   </div>
                 </div>
               </div>

              {/* Dados do Pedido */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Dados do Pedido</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputMode(inputMode === "dimensions" ? "volume" : "dimensions");
                      setFormData({ 
                        ...formData, 
                        length: "", 
                        width: "", 
                        height: "", 
                        volume_direct: "" 
                      });
                    }}
                    className="gap-2"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    {inputMode === "dimensions" ? "Trocar para m³" : "Usar dimensões"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="concrete_type">Tipo de Concreto *</Label>
                  <Select
                    value={formData.concrete_type_id}
                    onValueChange={(value) => setFormData({ ...formData, concrete_type_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de concreto" />
                    </SelectTrigger>
                    <SelectContent>
                      {concreteTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} - {formatCurrency(type.price)}/m³
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {inputMode === "dimensions" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="length">Comprimento (m) *</Label>
                      <FormattedInput
                        id="length"
                        required
                        placeholder="0,00"
                        value={formData.length}
                        onChange={(value) => setFormData({ ...formData, length: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="width">Largura (m) *</Label>
                      <FormattedInput
                        id="width"
                        required
                        placeholder="0,00"
                        value={formData.width}
                        onChange={(value) => setFormData({ ...formData, width: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">Altura / Espessura (m) *</Label>
                      <FormattedInput
                        id="height"
                        required
                        placeholder="0,00"
                        value={formData.height}
                        onChange={(value) => setFormData({ ...formData, height: value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="volume_direct">Volume (m³) *</Label>
                    <FormattedInput
                      id="volume_direct"
                      required
                      placeholder="0,00"
                      value={formData.volume_direct}
                      onChange={(value) => setFormData({ ...formData, volume_direct: value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Data Desejada para Entrega *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    required
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                  <Checkbox
                    id="static_pump"
                    checked={includeStaticPump}
                    onCheckedChange={(checked) => setIncludeStaticPump(checked as boolean)}
                  />
                  <Label htmlFor="static_pump" className="cursor-pointer">
                    Bomba Estacionária / Lança (+R$ {STATIC_PUMP_PRICE.toFixed(2)})
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    rows={4}
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Informações adicionais sobre o pedido..."
                  />
                </div>
              </div>

              {/* Cálculo */}
              {calculation.volume > 0 && (
                <Card className="bg-muted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Resumo do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-lg">
                      <span>Volume Total:</span>
                      <span className="font-bold">{calculation.volume.toFixed(2)} m³</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span>Preço por m³:</span>
                      <span className="font-bold">{formatCurrency(calculation.pricePerM3)}</span>
                    </div>
                    {includeStaticPump && (
                      <div className="flex justify-between text-lg">
                        <span>Bomba Estacionária / Lança:</span>
                        <span className="font-bold">{formatCurrency(STATIC_PUMP_PRICE)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl border-t pt-2">
                      <span className="font-bold">Valor Total Estimado:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(calculation.totalPrice)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      💡 <strong>Dica:</strong> adicione de 5 a 10% de sobra para compensar perdas e acabamento.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Botão de envio */}
              <div className="flex flex-col gap-4">
                <Button type="submit" disabled={loading} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Enviando..." : "Enviar Pedido"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
