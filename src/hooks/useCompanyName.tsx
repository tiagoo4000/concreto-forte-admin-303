import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCompanyName = () => {
  const [companyName, setCompanyName] = useState<string>("ConcrePlus");

  useEffect(() => {
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
        console.error("Erro ao buscar nome da empresa:", error);
      }
    };

    fetchCompanyName();

    // Listen for changes in site_settings
    const channel = supabase
      .channel('company_name_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.company_name'
        },
        () => {
          fetchCompanyName();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return companyName;
};
