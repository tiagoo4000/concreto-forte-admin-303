import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QRCode from "qrcode";
import { Copy, CheckCircle2, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestPixQRCodeProps {
  pixKey: string;
  pixName: string;
  pixCity: string;
}

export const TestPixQRCode = ({ pixKey, pixName, pixCity }: TestPixQRCodeProps) => {
  const { toast } = useToast();
  const [valor, setValor] = useState<string>("10.00");
  const [pixCode, setPixCode] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const generateEMVCode = (key: string, name: string, city: string, amount: number): string => {
    console.log('🔍 Gerando PIX com:', { key, name, city, amount });
    
    // Formatar chave PIX se for telefone (apenas números com 10 ou 11 dígitos)
    let formattedKey = key;
    const onlyNumbers = key.replace(/\D/g, '');
    if (onlyNumbers.length === 10 || onlyNumbers.length === 11) {
      // É um telefone, adicionar +55 se não tiver
      if (!key.startsWith('+55')) {
        formattedKey = `+55${onlyNumbers}`;
      }
    }
    
    console.log('📱 Chave formatada:', formattedKey);
    
    // Normalizar o nome (sem acentos e máximo 25 caracteres)
    const normalizedName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9\s]/g, '')
      .substring(0, 25)
      .toUpperCase()
      .trim();
    
    const normalizedCity = city
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9\s]/g, '')
      .substring(0, 15)
      .toUpperCase()
      .trim();
    
    console.log('✅ Nome normalizado:', normalizedName);
    console.log('✅ Cidade normalizada:', normalizedCity);
    
    // ID do Payload Format Indicator
    let payload = "000201";
    
    // Point of Initiation Method
    payload += "010212";
    
    // Merchant Account Information (ID 26)
    const gui = "BR.GOV.BCB.PIX";
    const pixKeyField = `01${String(formattedKey.length).padStart(2, '0')}${formattedKey}`;
    const guiField = `00${String(gui.length).padStart(2, '0')}${gui}`;
    const merchantAccount = guiField + pixKeyField;
    payload += `26${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}`;
    
    // Merchant Category Code
    payload += "52040000";
    
    // Transaction Currency (986 = BRL)
    payload += "5303986";
    
    // Transaction Amount
    const amountStr = amount.toFixed(2);
    payload += `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;
    
    // Country Code
    payload += "5802BR";
    
    // Merchant Name
    payload += `59${String(normalizedName.length).padStart(2, '0')}${normalizedName}`;
    
    // Merchant City
    payload += `60${String(normalizedCity.length).padStart(2, '0')}${normalizedCity}`;
    
    // Additional Data Field Template
    const txId = "SUPERMIXCONCRETO";
    const additionalDataContent = `05${String(txId.length).padStart(2, '0')}${txId}`;
    payload += `62${String(additionalDataContent.length).padStart(2, '0')}${additionalDataContent}`;
    
    // CRC16
    payload += "6304";
    const crc = calculateCRC16CCITT(payload);
    payload += crc;
    
    console.log('📄 Payload PIX completo:', payload);
    console.log('📏 Tamanho do payload:', payload.length);
    console.log('🔐 CRC16:', crc);
    
    return payload;
  };

  const calculateCRC16CCITT = (str: string): string => {
    let crc = 0xFFFF;
    
    for (let i = 0; i < str.length; i++) {
      const byte = str.charCodeAt(i);
      crc ^= (byte << 8);
      
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    
    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const handleGenerate = async () => {
    if (!pixKey || !pixName || !pixCity) {
      toast({
        title: "Configuração incompleta",
        description: "Configure todos os campos do PIX antes de testar",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(valor);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor válido para teste",
        variant: "destructive",
      });
      return;
    }

    try {
      const code = generateEMVCode(pixKey, pixName, pixCity, amount);
      setPixCode(code);

      const qrUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(qrUrl);

      toast({
        title: "QR Code gerado!",
        description: "Verifique o console (F12) para ver os detalhes",
      });
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
      toast({
        title: "Erro ao gerar QR Code",
        description: "Verifique o console para mais detalhes",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para a área de transferência",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TestTube className="h-4 w-4 mr-2" />
          Testar QR Code PIX
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Testar QR Code PIX</DialogTitle>
          <DialogDescription>
            Gere um QR Code de teste para verificar se a configuração está correta.
            Abra o console (F12) para ver os detalhes técnicos.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Valor de Teste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerate} className="w-full">
              Gerar QR Code de Teste
            </Button>
          </CardContent>
        </Card>

        {qrCodeUrl && (
          <Card>
            <CardHeader>
              <CardTitle>QR Code Gerado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code PIX" className="border rounded" />
              </div>

              <div className="space-y-2">
                <Label>Código Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixCode}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm space-y-1 bg-muted p-3 rounded">
                <p className="font-semibold">📱 Como testar:</p>
                <p>1. Abra o app do seu banco</p>
                <p>2. Escolha PIX → Ler QR Code</p>
                <p>3. Escaneie o código acima</p>
                <p>4. Verifique se os dados aparecem corretamente</p>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Não confirme o pagamento se for apenas um teste!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
