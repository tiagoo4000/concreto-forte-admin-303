import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useBranding = () => {
  useEffect(() => {
    const fetchAndApplyBranding = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["primary_color", "secondary_color", "accent_color", "button_color"]);

        if (error) throw error;

        const settings: Record<string, string> = {};
        data?.forEach((item) => {
          settings[item.key] = String(item.value);
        });

        // Convert hex to HSL and apply to CSS variables
        const root = document.documentElement;

        if (settings.primary_color) {
          const hsl = hexToHSL(settings.primary_color);
          root.style.setProperty("--primary", hsl);
        }

        if (settings.secondary_color) {
          const hsl = hexToHSL(settings.secondary_color);
          root.style.setProperty("--secondary", hsl);
        }

        if (settings.accent_color) {
          const hsl = hexToHSL(settings.accent_color);
          root.style.setProperty("--accent", hsl);
        }

        if (settings.button_color) {
          const hsl = hexToHSL(settings.button_color);
          root.style.setProperty("--primary", hsl);
        }
      } catch (error) {
        console.error("Error loading branding:", error);
      }
    };

    fetchAndApplyBranding();
  }, []);
};

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove the # if present
  hex = hex.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}
