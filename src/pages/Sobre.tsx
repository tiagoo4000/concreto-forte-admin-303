import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Shield, Users, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Sobre = () => {
  const [companyName, setCompanyName] = useState<string>("ConcrePlus");

  useEffect(() => {
    fetchCompanyName();
  }, []);

  const fetchCompanyName = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "company_name")
        .maybeSingle();

      if (data?.value) {
        setCompanyName(String(data.value));
      }
    } catch (error) {
      console.error("Error fetching company name:", error);
    }
  };

  const values = [
    {
      icon: Shield,
      title: "Qualidade",
      description: "Compromisso inabalável com a excelência em cada entrega",
    },
    {
      icon: Users,
      title: "Confiança",
      description: "Relacionamento transparente e duradouro com nossos clientes",
    },
    {
      icon: Award,
      title: "Excelência",
      description: "Busca constante pela melhoria contínua dos nossos processos",
    },
    {
      icon: Heart,
      title: "Sustentabilidade",
      description: "Práticas responsáveis que respeitam o meio ambiente",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-secondary text-secondary-foreground py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">Sobre a {companyName}</h1>
            <p className="text-xl text-secondary-foreground/80">
              Há mais de 15 anos construindo a base sólida para os sonhos dos nossos clientes
            </p>
          </div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-8 text-center">Nossa História</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                A {companyName} nasceu em 2008 com o objetivo de revolucionar o mercado de concreto usinado na região. 
                Fundada por engenheiros com vasta experiência no setor da construção civil, nossa empresa começou 
                com uma única usina e o compromisso inabalável com a qualidade e pontualidade.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Ao longo dos anos, crescemos não apenas em estrutura, mas principalmente em confiança e credibilidade. 
                Hoje, contamos com tecnologia de ponta, laboratório próprio e uma frota moderna que garante entregas 
                precisas e eficientes para obras de todos os portes.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nossa trajetória é marcada por milhares de metros cúbicos de concreto entregues, centenas de obras 
                concluídas com sucesso e a satisfação de clientes que confiam em nosso trabalho para materializar 
                seus projetos mais importantes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão, Valores */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-card">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black">Missão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Fornecer concreto de alta qualidade com pontualidade e excelência no atendimento, 
                  contribuindo para o sucesso das obras de nossos clientes e o desenvolvimento sustentável 
                  da construção civil.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black">Visão</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Ser referência nacional em fornecimento de concreto usinado, reconhecida pela qualidade 
                  de nossos produtos, inovação tecnológica e compromisso com a sustentabilidade e 
                  responsabilidade social.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Nossos Valores</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Princípios que guiam cada decisão e ação da {companyName}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais Técnicos */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">Nossos Diferenciais</h2>
            
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Controle Tecnológico</h3>
                  <p className="text-muted-foreground">
                    Laboratório próprio equipado com tecnologia de ponta para garantir que cada traço atenda 
                    rigorosamente às especificações técnicas da sua obra.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Frota Moderna</h3>
                  <p className="text-muted-foreground">
                    Caminhões betoneiras e bombas de última geração, mantidos em perfeito estado de conservação 
                    para garantir a qualidade do concreto até o destino final.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Equipe Qualificada</h3>
                  <p className="text-muted-foreground">
                    Profissionais experientes e constantemente treinados, preparados para oferecer suporte técnico 
                    e atender às necessidades específicas de cada projeto.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">Sustentabilidade</h3>
                  <p className="text-muted-foreground">
                    Práticas ambientalmente responsáveis em todo o processo produtivo, incluindo gestão de resíduos, 
                    uso eficiente de recursos naturais e compensação ambiental.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;
