import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contato = () => {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState<string>("ConcrePlus");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    fetchSettings();

    // Listen for changes in site_settings
    const channel = supabase
      .channel('contact_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=in.(company_name,address,phone,whatsapp,email)'
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["company_name", "address", "phone", "whatsapp", "email"]);

      if (data) {
        data.forEach((item) => {
          const value = String(item.value);
          switch (item.key) {
            case "company_name":
              setCompanyName(value);
              break;
            case "address":
              setAddress(value);
              break;
            case "phone":
              setPhone(value);
              break;
            case "whatsapp":
              setWhatsapp(value);
              break;
            case "email":
              setEmail(value);
              break;
          }
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    // Aqui você pode integrar com um backend ou API de email
    toast({
      title: "Mensagem enviada!",
      description: "Entraremos em contato em breve.",
    });

    // Limpar formulário
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const getMapUrl = () => {
    if (!address) {
      return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0976220279147!2d-46.65844368502208!3d-23.56138098467879!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1234567890123";
    }
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Endereço",
      content: address || "Av. Exemplo, 123 - Bairro Industrial\nSão Paulo, SP - CEP 01234-567",
    },
    {
      icon: Phone,
      title: "Telefone",
      content: phone || "(11) 99999-9999\n(11) 3333-3333",
    },
    {
      icon: Mail,
      title: "E-mail",
      content: email || "contato@concreplus.com.br\norcamento@concreplus.com.br",
    },
    {
      icon: Clock,
      title: "Horário de Atendimento",
      content: "Segunda a Sexta: 7h às 18h\nSábado: 7h às 12h",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">Entre em Contato</h1>
            <p className="text-xl text-secondary-foreground/80">
              Estamos prontos para atender sua obra. Fale conosco agora!
            </p>
          </div>
        </div>
      </section>

      {/* Contato Rápido */}
      <section className="py-8 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Button variant="cta" size="lg" className="w-full md:w-auto" asChild>
              <a href={`https://wa.me/${whatsapp || '5511999999999'}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar no WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full md:w-auto" asChild>
              <a href={`tel:+${phone?.replace(/\D/g, '') || '5511999999999'}`}>
                <Phone className="mr-2 h-5 w-5" />
                Ligar Agora
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Formulário e Informações */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Formulário */}
            <div>
              <h2 className="text-3xl font-black mb-6">Envie sua Mensagem</h2>
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem *</Label>
                      <Textarea
                        id="message"
                        placeholder="Conte-nos sobre seu projeto..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Informações de Contato */}
            <div>
              <h2 className="text-3xl font-black mb-6">Informações de Contato</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 h-fit">
                          <info.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">{info.title}</h3>
                          <p className="text-muted-foreground whitespace-pre-line">{info.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black mb-8 text-center">Nossa Localização</h2>
          <div className="rounded-lg overflow-hidden shadow-lg h-[450px]">
            <iframe
              src={getMapUrl()}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Localização ${companyName}`}
              key={address}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contato;
