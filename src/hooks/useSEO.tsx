import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSEO = () => {
  useEffect(() => {
    const updateMetaTags = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["company_name", "site_description", "og_image_url"]);

        if (data) {
          const settings: Record<string, string> = {};
          data.forEach((item) => {
            settings[item.key] = String(item.value);
          });

          const companyName = settings.company_name || "ConcrePlus";
          const description = settings.site_description || "Soluções completas em concreto usinado. Qualidade, pontualidade e confiança.";
          const ogImage = settings.og_image_url || "https://lovable.dev/opengraph-image-p98pqg.png";

          // Update page title
          document.title = `${companyName} - Concreto Usinado de Qualidade | Entrega Rápida`;

          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute("content", description);
          }

          // Update Open Graph title
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) {
            ogTitle.setAttribute("content", `${companyName} - Concreto Usinado de Qualidade`);
          }

          // Update Open Graph description
          const ogDescription = document.querySelector('meta[property="og:description"]');
          if (ogDescription) {
            ogDescription.setAttribute("content", description);
          }

          // Update Open Graph image
          const ogImageTag = document.querySelector('meta[property="og:image"]');
          if (ogImageTag) {
            ogImageTag.setAttribute("content", ogImage);
          }

          // Update Twitter image
          const twitterImage = document.querySelector('meta[name="twitter:image"]');
          if (twitterImage) {
            twitterImage.setAttribute("content", ogImage);
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar meta tags:", error);
      }
    };

    updateMetaTags();

    // Listen for changes in site_settings
    const channel = supabase
      .channel('seo_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=in.(company_name,site_description,og_image_url)'
        },
        () => {
          updateMetaTags();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
