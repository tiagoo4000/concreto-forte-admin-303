import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const WhatsAppButton = () => {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("5511999999999");
  const [whatsappBusinessLink, setWhatsappBusinessLink] = useState<string>("");

  useEffect(() => {
    fetchWhatsappConfig();
  }, []);

  const fetchWhatsappConfig = async () => {
    try {
      console.log("Fetching WhatsApp config...");
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["whatsapp", "whatsapp_business_link"]);

      console.log("WhatsApp config from DB:", data);
      console.log("WhatsApp error:", error);

      if (data) {
        data.forEach(item => {
          const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          const cleanValue = value.replace(/^"|"$/g, '');
          
          if (item.key === "whatsapp_business_link" && cleanValue) {
            console.log("Setting WhatsApp Business link to:", cleanValue);
            setWhatsappBusinessLink(cleanValue);
          } else if (item.key === "whatsapp" && cleanValue) {
            // Remove quotes and any non-numeric characters
            let cleanNumber = cleanValue.replace(/\D/g, '');
            
            // Add country code 55 if not present
            if (cleanNumber && !cleanNumber.startsWith('55')) {
              cleanNumber = '55' + cleanNumber;
            }
            
            console.log("Setting WhatsApp number to:", cleanNumber);
            if (cleanNumber) {
              setWhatsappNumber(cleanNumber);
            }
          }
        });
      } else {
        console.log("No WhatsApp data found, using default");
      }
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
    }
  };

  // Use WhatsApp Business link if available, otherwise use number
  const whatsappUrl = whatsappBusinessLink 
    ? whatsappBusinessLink 
    : `https://wa.me/${whatsappNumber}`;
  
  console.log("WhatsApp URL:", whatsappUrl);

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-pulse"
      aria-label="Contato via WhatsApp"
      onClick={(e) => {
        console.log("Clicking WhatsApp button with URL:", whatsappUrl);
      }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppButton;
