import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Truck, 
  TrendingUp, 
  Award, 
  Beaker, 
  Clock, 
  ShieldCheck,
  CheckCircle2 
} from "lucide-react";
import serviceConcrete from "@/assets/service-concrete-new.jpg";
import servicePumping from "@/assets/service-pumping.jpg";
import serviceQuality from "@/assets/service-quality.jpg";

const Servicos = () => {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("5511999999999");

  useEffect(() => {
    fetchWhatsapp();
  }, []);

  const fetchWhatsapp = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "whatsapp")
        .maybeSingle();

      if (data?.value) {
        let cleanValue = String(data.value).replace(/\D/g, '');
        if (cleanValue && !cleanValue.startsWith('55')) {
          cleanValue = '55' + cleanValue;
        }
        setWhatsappNumber(cleanValue);
      }
    } catch (error) {
      console.error("Error fetching whatsapp:", error);
    }
  };

  const services = [
    {
      icon: Truck,
      title: "Concreto Usinado",
      image: serviceConcrete,
      description: "Fornecimento de concreto produzido em central dosadora computadorizada, garantindo precisão e qualidade em cada traço.",
      features: [
        "Diversos tipos de resistência (FCK)",
        "Traços personalizados conforme projeto",
        "Aditivos especiais quando necessário",
        "Entregas programadas e pontuais",
        "Certificado de qualidade",
      ],
    },
    {
      icon: TrendingUp,
      title: "Bombeamento de Concreto",
      image: servicePumping,
      description: "Serviço de bombeamento com equipamentos modernos para facilitar a concretagem em locais de difícil acesso.",
      features: [
        "Bombas lança de diversos alcances",
        "Operadores experientes e qualificados",
        "Agilidade e economia de mão de obra",
        "Ideal para lajes, pilares e estruturas elevadas",
        "Atendimento 24 horas mediante agendamento",
      ],
    },
    {
      icon: Award,
      title: "Controle de Qualidade",
      image: serviceQuality,
      description: "Laboratório próprio e rigoroso controle tecnológico em todas as etapas do processo produtivo.",
      features: [
        "Ensaios de resistência à compressão",
        "Análise de slump e consistência",
        "Controle de temperatura do concreto",
        "Laudos técnicos detalhados",
        "Rastreabilidade completa",
      ],
    },
  ];

  const additionalServices = [
    {
      icon: Beaker,
      title: "Concreto Especial",
      description: "Concreto com características específicas para aplicações especiais.",
    },
    {
      icon: Clock,
      title: "Entrega Programada",
      description: "Logística planejada para atender seu cronograma de obra.",
    },
    {
      icon: ShieldCheck,
      title: "Assessoria Técnica",
      description: "Suporte técnico para especificação e aplicação do concreto.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">Nossos Serviços</h1>
            <p className="text-xl text-secondary-foreground/80">
              Soluções completas em concreto usinado para todas as necessidades da sua obra
            </p>
          </div>
        </div>
      </section>

      {/* Serviços Principais */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-16">
            {services.map((service, index) => (
              <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                <div className="flex-1">
                  <div className="rounded-lg overflow-hidden shadow-lg h-[400px]">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black">{service.title}</h2>
                  </div>
                  
                  <p className="text-lg text-muted-foreground mb-6">
                    {service.description}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="default" size="lg" asChild>
                    <Link to="/cadastro">
                      Solicitar Orçamento
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços Adicionais */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Serviços Complementares</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para garantir o sucesso da sua obra
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {additionalServices.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
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
            Precisa de Uma Solução Personalizada?
          </h2>
          <p className="text-lg text-secondary-foreground/80 mb-8 max-w-2xl mx-auto">
            Nossa equipe técnica está pronta para desenvolver o traço ideal para o seu projeto
          </p>
          <Button variant="cta" size="lg" asChild>
            <a href="/contato">Entre em Contato</a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Servicos;
