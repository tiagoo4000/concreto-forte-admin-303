import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "favicon_url")
          .maybeSingle();

        if (data?.value) {
          const faviconUrl = String(data.value);
          
          // Remove existing favicon links
          const existingLinks = document.querySelectorAll("link[rel*='icon']");
          existingLinks.forEach(link => link.remove());

          // Add new favicon link
          const link = document.createElement("link");
          link.rel = "icon";
          link.type = "image/png";
          link.href = faviconUrl;
          document.head.appendChild(link);
        }
      } catch (error) {
        console.error("Erro ao atualizar favicon:", error);
      }
    };

    updateFavicon();

    // Listen for changes in site_settings
    const channel = supabase
      .channel('favicon_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.favicon_url'
        },
        () => {
          updateFavicon();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
