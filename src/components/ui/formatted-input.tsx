import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

interface FormattedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
}

export const FormattedInput = forwardRef<HTMLInputElement, FormattedInputProps>(
  ({ value, onChange, decimals = 2, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove tudo exceto números e vírgula
      inputValue = inputValue.replace(/[^\d,]/g, '');
      
      // Permite apenas uma vírgula
      const parts = inputValue.split(',');
      if (parts.length > 2) {
        inputValue = parts[0] + ',' + parts.slice(1).join('');
      }
      
      // Limita casas decimais
      if (parts.length === 2 && parts[1].length > decimals) {
        parts[1] = parts[1].substring(0, decimals);
        inputValue = parts.join(',');
      }
      
      onChange(inputValue);
    };

    const handleBlur = () => {
      if (!value) return;
      
      // Formata o valor no blur
      const numValue = parseFloat(value.replace(',', '.'));
      if (!isNaN(numValue)) {
        const formatted = numValue.toFixed(decimals).replace('.', ',');
        onChange(formatted);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    );
  }
);

FormattedInput.displayName = "FormattedInput";
