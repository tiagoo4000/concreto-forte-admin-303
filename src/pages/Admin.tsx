import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Image, FileText, Users, Palette, Layout, LogOut, Calculator, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  const adminSections = [
    {
      icon: FileText,
      title: "Serviços",
      description: "Gerenciar serviços oferecidos",
      href: "/admin/services",
      enabled: true,
    },
    {
      icon: Calculator,
      title: "Tipos de Concreto",
      description: "Gerenciar tipos e preços de concreto",
      href: "/admin/concrete-types",
      enabled: true,
    },
    {
      icon: FileText,
      title: "Pedidos de Concreto",
      description: "Visualizar e gerenciar pedidos dos clientes",
      href: "/admin/orders",
      enabled: true,
    },
    {
      icon: Users,
      title: "Depoimentos",
      description: "Gerenciar depoimentos de clientes",
      href: "/admin/testimonials",
      enabled: true,
    },
    {
      icon: Palette,
      title: "Identidade Visual",
      description: "Configurar logo, cores e aparência do site",
      href: "/admin/branding",
      enabled: true,
    },
    {
      icon: Image,
      title: "Banners e Imagens",
      description: "Gerenciar banners e galeria de imagens",
      href: "/admin/banners",
      enabled: true,
    },
    {
      icon: Settings,
      title: "Configurações Gerais",
      description: "Gerenciar informações da empresa, contatos e configurações do site",
      href: "/admin/settings",
      enabled: true,
    },
    {
      icon: Shield,
      title: "Política e Termos",
      description: "Gerenciar Política de Privacidade e Termos de Uso",
      href: "/admin/legal",
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-4">Painel Administrativo</h1>
              <p className="text-lg text-secondary-foreground/80">
                Bem-vindo, {user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="bg-transparent border-white text-white hover:bg-white hover:text-secondary">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Status */}
            <Card className="mb-8 bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-2">✅ Sistema Completo</h3>
                <p className="text-muted-foreground">
                  Todas as funcionalidades do painel administrativo estão prontas! 
                  Você já pode gerenciar todos os aspectos do site.
                </p>
              </CardContent>
            </Card>

            {/* Seções do Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <section.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold">{section.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled={!section.enabled}
                      asChild={section.enabled}
                    >
                      {section.enabled ? (
                        <a href={section.href}>Acessar</a>
                      ) : (
                        <span>Em breve</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Próximos Passos */}
            <Card className="mt-8">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Funcionalidades Disponíveis</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    ✅ <strong>Gestão de Serviços:</strong> Crie, edite e remova os serviços oferecidos pela empresa.
                  </p>
                  <p>
                    ✅ <strong>Tipos de Concreto:</strong> Configure os tipos e preços de concreto para a calculadora.
                  </p>
                  <p>
                    ✅ <strong>Gestão de Depoimentos:</strong> Gerencie depoimentos de clientes com avaliações.
                  </p>
                  <p>
                    ✅ <strong>Identidade Visual:</strong> Configure logo, favicon e paleta de cores do site.
                  </p>
                  <p>
                    ✅ <strong>Banners e Imagens:</strong> Gerencie banners da página inicial e outras seções.
                  </p>
                  <p>
                    ✅ <strong>Informações da Empresa:</strong> Atualize contatos, endereço e redes sociais.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;
