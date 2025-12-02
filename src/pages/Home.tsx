import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Truck, 
  ShieldCheck, 
  Clock, 
  Award, 
  TrendingUp, 
  Users,
  CheckCircle2,
  Star
} from "lucide-react";
import heroImage from "@/assets/hero-concrete.jpg";
import serviceConcrete from "@/assets/service-concrete-new.jpg";
import servicePumping from "@/assets/service-pumping.jpg";
import serviceQuality from "@/assets/service-quality.jpg";

const Home = () => {
  const [companyName, setCompanyName] = useState<string>("ConcrePlus");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("5511999999999");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["company_name", "whatsapp"]);

      if (data) {
        data.forEach((item) => {
          if (item.key === "company_name" && item.value) {
            setCompanyName(String(item.value));
          } else if (item.key === "whatsapp" && item.value) {
            let cleanValue = String(item.value).replace(/\D/g, '');
            if (cleanValue && !cleanValue.startsWith('55')) {
              cleanValue = '55' + cleanValue;
            }
            setWhatsappNumber(cleanValue);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };


  const services = [
    {
      icon: Truck,
      title: "Concreto Usinado",
      description: "Concreto de alta qualidade produzido em nossa usina com rigoroso controle tecnológico.",
      image: serviceConcrete,
    },
    {
      icon: TrendingUp,
      title: "Bombeamento",
      description: "Serviço de bombeamento de concreto para facilitar e agilizar sua obra.",
      image: servicePumping,
    },
    {
      icon: Award,
      title: "Controle de Qualidade",
      description: "Laboratório próprio e ensaios constantes garantindo a excelência do produto.",
      image: serviceQuality,
    },
  ];

  const differentials = [
    {
      icon: Clock,
      title: "Entrega Pontual",
      description: "Cumprimos rigorosamente os prazos combinados",
    },
    {
      icon: ShieldCheck,
      title: "Qualidade Garantida",
      description: "Certificações e controle técnico rigoroso",
    },
    {
      icon: Users,
      title: "Equipe Especializada",
      description: "Profissionais experientes e qualificados",
    },
    {
      icon: Award,
      title: "Preço Competitivo",
      description: "Melhor custo-benefício da região",
    },
  ];

  const testimonials = [
    {
      name: "João Silva",
      role: "Engenheiro Civil",
      content: `Trabalho com a ${companyName} há 5 anos. Nunca tive problemas com qualidade ou atrasos. Recomendo!`,
      rating: 5,
    },
    {
      name: "Maria Santos",
      role: "Construtora MSantos",
      content: "Profissionalismo e qualidade são os pontos fortes. O concreto chega sempre na hora certa e com excelente resistência.",
      rating: 5,
    },
    {
      name: "Pedro Oliveira",
      role: "Mestre de Obras",
      content: `Já fiz várias obras com o concreto da ${companyName}. Sempre pontual e com ótima qualidade. Confiança total!`,
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
            Concreto Forte Como a Sua Obra
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Pontualidade e resistência em cada entrega. A base sólida para o seu projeto começar certo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/cadastro">
                Solicitar Orçamento Grátis
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 backdrop-blur-sm border-white text-white hover:bg-white hover:text-foreground" asChild>
              <Link to="/servicos">Nossos Serviços</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Serviços em Destaque */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Nossos Serviços</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Soluções completas para sua obra com qualidade e eficiência
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/servicos">Saiba Mais</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Por Que Escolher */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Por Que Escolher a {companyName}?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diferenciais que fazem a diferença na sua obra
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentials.map((diff, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <diff.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{diff.title}</h3>
                  <p className="text-sm text-muted-foreground">{diff.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Pronto Para Iniciar Seu Projeto?
          </h2>
          <p className="text-lg text-secondary-foreground/80 mb-8 max-w-2xl mx-auto">
            Entre em contato agora e receba um orçamento personalizado sem compromisso
          </p>
          <Button variant="cta" size="lg" asChild>
            <Link to="/cadastro">
              Solicitar Orçamento Agora
            </Link>
          </Button>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">O Que Dizem Nossos Clientes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Confiança construída com cada entrega
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Como Funciona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Processo simples e transparente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Solicite Orçamento", desc: "Entre em contato via WhatsApp ou formulário" },
              { step: "2", title: "Receba a Proposta", desc: "Análise técnica e orçamento personalizado" },
              { step: "3", title: "Agende a Entrega", desc: "Definição de data e horário da concretagem" },
              { step: "4", title: "Receba o Concreto", desc: "Entrega pontual com qualidade garantida" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-black mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
