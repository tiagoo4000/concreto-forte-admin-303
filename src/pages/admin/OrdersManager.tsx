import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Settings, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { TestPixQRCode } from "./TestPixQRCode";

interface Order {
  id: string;
  customer_name: string;
  customer_document: string;
  customer_phone: string;
  customer_email: string;
  customer_cep: string | null;
  work_address: string;
  concrete_types: {
    name: string;
  };
  length: number | null;
  width: number | null;
  height: number | null;
  volume: number;
  price_per_m3: number;
  total_price: number;
  delivery_date: string;
  observations: string | null;
  status: string;
  created_at: string;
  includes_static_pump: boolean;
}

interface CompanySettings {
  company_name: string;
  pdf_logo_url: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_cnpj: string;
  company_state: string;
  company_cep: string;
  whatsapp?: string;
  pix_key: string;
  pix_name: string;
  pix_city: string;
  ted_bank_name: string;
  ted_account: string;
  ted_agency: string;
  ted_document: string;
  ted_beneficiary: string;
  pdf_primary_color: string;
  pdf_background_color: string;
  payment_method?: string;
}

export default function OrdersManager() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"pix" | "ted" | "boleto" | "credito">("pix");
  const [orderForPDF, setOrderForPDF] = useState<Order | null>(null);
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [installments, setInstallments] = useState<string>("1");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [customerNameFilter, setCustomerNameFilter] = useState<string>("");
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: "Mix Piraju Concretos",
    pdf_logo_url: "",
    company_address: "Rua Example, 123 - Piraju/SP",
    company_phone: "(14) 1234-5678",
    company_email: "contato@mixpiraju.com.br",
    company_cnpj: "00.000.000/0000-00",
    company_state: "SP",
    company_cep: "00000-000",
    pix_key: "",
    pix_name: "",
    pix_city: "",
    ted_bank_name: "",
    ted_account: "",
    ted_agency: "",
    ted_document: "",
    ted_beneficiary: "",
    pdf_primary_color: "#1F4A7D",
    pdf_background_color: "#1F4A7D",
  });

  useEffect(() => {
    fetchOrders();
    fetchCompanySettings();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        concrete_types (name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchCompanySettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["company_name", "pdf_logo_url", "company_address", "company_phone", "company_email", "company_cnpj", "company_state", "company_cep", "address", "phone", "email", "whatsapp", "pix_key", "pix_name", "pix_city", "ted_bank_name", "ted_account", "ted_agency", "ted_document", "ted_beneficiary", "pdf_primary_color", "pdf_background_color"]);

    if (data) {
      const settings: any = {};
      data.forEach((item) => {
        const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
        const cleanValue = value.replace(/^"|"$/g, '');
        
        // Map alternative keys
        if (item.key === 'address') {
          settings['company_address'] = cleanValue;
        } else if (item.key === 'phone') {
          settings['company_phone'] = cleanValue;
        } else if (item.key === 'email') {
          settings['company_email'] = cleanValue;
        } else {
          settings[item.key] = cleanValue;
        }
      });
      setCompanySettings((prev) => ({ ...prev, ...settings }));
    }
  };

  const saveCompanySettings = async () => {
    const updates = Object.entries(companySettings).map(([key, value]) => ({
      key,
      value,
    }));

    for (const update of updates) {
      await supabase
        .from("site_settings")
        .upsert({ key: update.key, value: update.value }, { onConflict: "key" });
    }

    toast({
      title: "Configurações salvas",
      description: "As informações da empresa foram atualizadas.",
    });
    setShowSettingsDialog(false);
  };

  const generateEMVCode = (key: string, name: string, city: string, amount: number): string => {
    console.log('Gerando PIX com:', { key, name, city, amount });
    
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
    
    console.log('Nome normalizado:', normalizedName);
    console.log('Cidade normalizada:', normalizedCity);
    
    // ID do Payload Format Indicator
    let payload = "000201"; // Payload Format Indicator
    
    // Point of Initiation Method (campo opcional, mas recomendado)
    payload += "010212"; // 01 = id, 02 = tamanho, 12 = valor (indica que é reutilizável)
    
    // Merchant Account Information (ID 26 - obrigatório para PIX)
    const gui = "BR.GOV.BCB.PIX";
    const pixKeyField = `01${String(formattedKey.length).padStart(2, '0')}${formattedKey}`;
    const guiField = `00${String(gui.length).padStart(2, '0')}${gui}`;
    const merchantAccount = guiField + pixKeyField;
    payload += `26${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}`;
    
    // Merchant Category Code (MCC)
    payload += "52040000"; // 0000 = não especificado
    
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
    
    // Additional Data Field Template (ID 62) - OBRIGATÓRIO
    const txId = "SUPERMIXCONCRETO";
    const additionalDataContent = `05${String(txId.length).padStart(2, '0')}${txId}`;
    payload += `62${String(additionalDataContent.length).padStart(2, '0')}${additionalDataContent}`;
    
    // CRC16 (DEVE SER O ÚLTIMO CAMPO)
    payload += "6304"; // ID + tamanho do CRC (sempre 4)
    
    // Calcular CRC16
    const crc = calculateCRC16CCITT(payload);
    payload += crc;
    
    console.log('Payload PIX gerado:', payload);
    console.log('Tamanho do payload:', payload.length);
    
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

  const updateOrderStatus = async (orderId: string, status: "pending" | "approved" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi alterado com sucesso.",
      });
      fetchOrders();
    }
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderToDelete.id);

    if (error) {
      toast({
        title: "Erro ao excluir pedido",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pedido excluído",
        description: "O pedido foi removido com sucesso.",
      });
      fetchOrders();
    }

    setShowDeleteDialog(false);
    setOrderToDelete(null);
  };

  const handleGeneratePDF = (order: Order) => {
    setOrderForPDF(order);
    setShowPaymentMethodDialog(true);
  };

  const confirmAction = async () => {
    if (orderForPDF) {
      const discount = parseFloat(discountValue) || 0;
      const installmentsCount = parseInt(installments) || 1;
      await generatePDF(orderForPDF, selectedPaymentMethod, discount, installmentsCount);
      setShowPaymentMethodDialog(false);
      setOrderForPDF(null);
      setDiscountValue("0");
      setInstallments("1");
    }
  };

  const generatePDF = async (order: Order, paymentMethod: "pix" | "ted" | "boleto" | "credito", discount: number = 0, installments: number = 1) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Função auxiliar para converter hex em RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return [r, g, b];
    };
    
    // Cores corporativas - agora configuráveis
    const primaryColor = hexToRgb(companySettings.pdf_primary_color || '#1F4A7D');
    const backgroundColor = hexToRgb(companySettings.pdf_background_color || '#1F4A7D');
    const lightGray: [number, number, number] = [245, 245, 245];
    const mediumGray: [number, number, number] = [180, 180, 180];
    const darkGray: [number, number, number] = [80, 80, 80];

    // Gerar ID único para a proposta
    const proposalId = `#${order.id.substring(0, 6).toUpperCase()}`;

    // ============= MARCA D'ÁGUA (Adicionar PRIMEIRO, no fundo) =============
    if (companySettings.pdf_logo_url) {
      try {
        console.log('Adicionando marca d\'água com logo:', companySettings.pdf_logo_url);
        
        // Cria um canvas temporário para aplicar opacidade
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Usa Promise para garantir que a imagem carregue
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const watermarkSize = 120;
            canvas.width = watermarkSize;
            canvas.height = watermarkSize;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Define a opacidade
              ctx.globalAlpha = 0.1;
              // Desenha a imagem com opacidade
              ctx.drawImage(img, 0, 0, watermarkSize, watermarkSize);
              
              // Converte para base64
              const watermarkedImage = canvas.toDataURL('image/png');
              
              // Adiciona ao PDF no centro
              const watermarkX = (pageWidth - watermarkSize) / 2;
              const watermarkY = (pageHeight - watermarkSize) / 2;
              
              doc.addImage(
                watermarkedImage,
                'PNG',
                watermarkX,
                watermarkY,
                watermarkSize,
                watermarkSize
              );
              
              console.log('Marca d\'água adicionada com sucesso');
            }
            resolve(true);
          };
          
          img.onerror = (err) => {
            console.error('Erro ao carregar imagem para marca d\'água:', err);
            reject(err);
          };
          
          img.src = companySettings.pdf_logo_url;
        });
      } catch (error) {
        console.error('Erro ao adicionar marca d\'água:', error);
        // Continua sem a marca d'água se houver erro
      }
    }

    // ============= CABEÇALHO =============
    // Fundo azul escuro no cabeçalho
    doc.setFillColor(backgroundColor[0], backgroundColor[1], backgroundColor[2]);
    doc.rect(0, 0, pageWidth, 30, "F");

    // Logo da empresa (esquerda)
    try {
      doc.addImage('/logo-pdf.png', 'PNG', 15, 5, 20, 20);
        
        // Nome e informações da empresa ao lado da logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(companySettings.company_name, 38, 10);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(companySettings.company_address, 38, 14);
        doc.text(`Estado: ${companySettings.company_state} | CEP: ${companySettings.company_cep}`, 38, 17);
        doc.text(`Tel: ${companySettings.company_phone}`, 38, 20);
        doc.text(`Email: ${companySettings.company_email} | CNPJ: ${companySettings.company_cnpj}`, 38, 23);
    } catch (error) {
      console.error('Erro ao adicionar logo:', error);
    }

    // Título PEDIDO (direita)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PEDIDO", pageWidth - 15, 12, { align: "right" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(proposalId, pageWidth - 15, 18, { align: "right" });
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth - 15, 23, { align: "right" });

    // Resetar cor do texto para preto
    doc.setTextColor(0, 0, 0);

    // ============= INFORMAÇÕES DO CLIENTE =============
    let currentY = 38;
    
    // Bloco com fundo cinza claro
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(15, currentY, pageWidth - 30, 33, 2, 2, "F");
    
    // Borda do bloco
    doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, currentY, pageWidth - 30, 33, 2, 2, "S");

    // Título da seção
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DADOS DO CLIENTE", 20, currentY + 6);

    // Dados do cliente
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text(`${order.customer_name}`, 20, currentY + 12);
    doc.text(`CPF/CNPJ: ${order.customer_document}`, 20, currentY + 17);
    doc.text(`Telefone: ${order.customer_phone} | Email: ${order.customer_email}`, 20, currentY + 22);
    if (order.customer_cep) {
      doc.text(`CEP: ${order.customer_cep}`, 20, currentY + 27);
    }
    
    // Endereço da obra
    const addressLines = doc.splitTextToSize(`Obra: ${order.work_address}`, pageWidth - 40);
    doc.text(addressLines[0], 20, currentY + 31);

    currentY += 40;

    // ============= TABELA DE ITENS =============
    // Título da seção
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("ESPECIFICAÇÃO DO FORNECIMENTO", 15, currentY);
    
    currentY += 3;


    // Descrição mais compacta
    const dimensionsText = order.length && order.width && order.height 
      ? `Dimensões: ${order.length}m x ${order.width}m x ${order.height}m | Volume: ${order.volume.toFixed(2)} m³`
      : `Volume: ${order.volume.toFixed(2)} m³`;
    
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = order.delivery_date.split('-');
    const localDeliveryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const descricao = `Fornecimento de concreto usinado ${order.concrete_types.name}.\n${dimensionsText}\nEntrega prevista: ${format(localDeliveryDate, "dd/MM/yyyy")}${order.observations ? ' | Obs: ' + order.observations : ''}`;

    // Calcular valores
    const STATIC_PUMP_PRICE = 750;
    const concretePrice = order.volume * order.price_per_m3;
    
    // Montar linhas da tabela
    const tableBody = [
      [
        descricao,
        `R$ ${order.price_per_m3.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${order.volume.toFixed(2)} m³`,
        `R$ ${concretePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]
    ];
    
    // Adicionar bomba se incluída
    if (order.includes_static_pump) {
      tableBody.push([
        'Bomba Estacionária / Lança\nServiço de bombeamento para concretagem',
        '-',
        '1 un',
        `R$ ${STATIC_PUMP_PRICE.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
    }

    // Tabela estilizada
    autoTable(doc, {
      startY: currentY,
      head: [['DESCRIÇÃO', 'PREÇO/M³', 'VOLUME', 'TOTAL']],
      body: tableBody,
      headStyles: {
        fillColor: backgroundColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 4,
        lineColor: mediumGray,
        lineWidth: 0.5
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', fontSize: 9 }
      },
      margin: { left: 15, right: 15 },
      theme: 'grid'
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ============= RESUMO FINANCEIRO =============
    const hasDiscount = discount > 0;
    const originalPrice = order.total_price;
    const finalPrice = order.total_price - discount;
    const discountPercentage = hasDiscount ? (discount / originalPrice) * 100 : 0;
    
    // Ajustar altura do bloco se houver desconto
    const blockHeight = hasDiscount ? 24 : 12;
    
    // Bloco com fundo azul claro
    doc.setFillColor(235, 241, 250);
    doc.roundedRect(pageWidth - 60, currentY, 45, blockHeight, 2, 2, "F");
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(pageWidth - 60, currentY, 45, blockHeight, 2, 2, "S");

    let yOffset = currentY + 4;

    // Se houver desconto, mostrar valor original
    if (hasDiscount) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text("VALOR ORIGINAL", pageWidth - 37.5, yOffset, { align: "center" });
      
      doc.setFontSize(8);
      doc.text(
        `R$ ${originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pageWidth - 37.5,
        yOffset + 3.5,
        { align: "center" }
      );
      
      yOffset += 7;
      
      // Linha de desconto
      doc.setFontSize(7);
      doc.setTextColor(220, 53, 69); // Vermelho para desconto
      doc.text(`DESCONTO (${discountPercentage.toFixed(1)}%)`, pageWidth - 37.5, yOffset, { align: "center" });
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(
        `- R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pageWidth - 37.5,
        yOffset + 3.5,
        { align: "center" }
      );
      
      yOffset += 6;
    }
    
    // Valor total final (com ou sem desconto)
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("VALOR TOTAL", pageWidth - 37.5, yOffset, { align: "center" });
    
    doc.setFontSize(11);
    doc.text(
      `R$ ${finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pageWidth - 37.5,
      yOffset + 4.5,
      { align: "center" }
    );

    currentY += blockHeight + 6;

    // ============= INFORMAÇÕES ADICIONAIS =============
    // Linha divisória
    doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    currentY += 5;

    // Layout em duas colunas
    const colWidth = (pageWidth - 40) / 2;
    
    // Coluna 1: Forma de Pagamento
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("FORMA DE PAGAMENTO", 15, currentY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    const paymentMethodText = paymentMethod === "pix" ? "PIX" : paymentMethod === "boleto" ? "Boleto Bancário" : paymentMethod === "credito" ? "Cartão de Crédito" : "TED/DOC";
    doc.text(paymentMethodText, 15, currentY + 5);

    currentY += 12;

    // ============= PAGAMENTO - PIX OU TED =============
    if (paymentMethod === "pix" && companySettings.pix_key && companySettings.pix_name && companySettings.pix_city) {
      try {
        // Linha divisória
        doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
        doc.line(15, currentY, pageWidth - 15, currentY);
        
        currentY += 5;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("PAGAMENTO VIA PIX", 15, currentY);
        
        currentY += 3;

        // Gerar código PIX EMV
        const pixCode = generateEMVCode(
          companySettings.pix_key,
          companySettings.pix_name,
          companySettings.pix_city,
          order.total_price
        );

        // Gerar QR Code
        const qrCodeDataUrl = await QRCode.toDataURL(pixCode, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Adicionar QR Code à direita
        const qrSize = 35;
        const qrX = pageWidth - 15 - qrSize;
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, currentY, qrSize, qrSize);

        // Informações do PIX à esquerda
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
        
        doc.text("Chave PIX:", 15, currentY + 5);
        doc.setFont("helvetica", "bold");
        doc.text(companySettings.pix_key, 15, currentY + 9);
        
        doc.setFont("helvetica", "normal");
        doc.text("Favorecido:", 15, currentY + 14);
        doc.setFont("helvetica", "bold");
        doc.text(companySettings.pix_name, 15, currentY + 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Escaneie o QR Code ou use a chave PIX acima", 15, currentY + 24);

        currentY += qrSize + 5;
      } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        currentY += 12;
      }
    } else if (paymentMethod === "ted" && companySettings.ted_bank_name && companySettings.ted_beneficiary) {
      // Linha divisória
      doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.line(15, currentY, pageWidth - 15, currentY);
      
      currentY += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PAGAMENTO VIA TED", 15, currentY);
      
      currentY += 5;

      // Informações do TED
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      
      doc.text("Banco:", 15, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.ted_bank_name, 15, currentY + 4);
      
      currentY += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text("Agência:", 15, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.ted_agency, 15, currentY + 4);
      
      doc.setFont("helvetica", "normal");
      doc.text("Conta:", pageWidth / 2, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.ted_account, pageWidth / 2, currentY + 4);
      
      currentY += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text("CPF/CNPJ:", 15, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.ted_document, 15, currentY + 4);
      
      currentY += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text("Favorecido:", 15, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(companySettings.ted_beneficiary, 15, currentY + 4);

      currentY += 10;
    } else if (paymentMethod === "boleto") {
      // Linha divisória
      doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.line(15, currentY, pageWidth - 15, currentY);
      
      currentY += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Boleto Bancário", 15, currentY);
      
      currentY += 7;

      // Informações sobre o boleto
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      
      const boletoText = [
        "O boleto bancário será enviado via WhatsApp.",
        "Aguarde o contato da nossa equipe para receber as informações de pagamento."
      ];
      
      boletoText.forEach((text, index) => {
        doc.text(text, 15, currentY + (index * 6));
      });

      currentY += 15;
    } else if (paymentMethod === "credito") {
      // Linha divisória
      doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
      doc.line(15, currentY, pageWidth - 15, currentY);
      
      currentY += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Cartão de Crédito", 15, currentY);
      
      currentY += 7;

      // Informações sobre parcelamento
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      
      const installmentValue = finalPrice / installments;
      
      const creditText = [
        `Parcelamento: ${installments}x de ${formatCurrency(installmentValue)}`,
        `Valor total: ${formatCurrency(finalPrice)}`,
        "",
        "Entre em contato para realizar o pagamento.",
        "Nossa equipe enviará o link de pagamento via WhatsApp."
      ];
      
      creditText.forEach((text, index) => {
        doc.text(text, 15, currentY + (index * 6));
      });

      currentY += 35;
    }


    // ============= TERMOS E CONDIÇÕES =============
    // Linha divisória
    doc.setDrawColor(mediumGray[0], mediumGray[1], mediumGray[2]);
    doc.line(15, currentY, pageWidth - 15, currentY);
    
    currentY += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("TERMOS E CONDIÇÕES", 15, currentY);
    
    currentY += 5;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    
    const termos = [
      "• O valor é estimativa baseada no volume calculado, sujeito a ajustes conforme volume fornecido.",
      "• Prazo de entrega sujeito à disponibilidade e condições climáticas.",
      "• Local de entrega deverá estar preparado com acesso adequado para caminhão betoneira.",
      "• Esta proposta não constitui contrato definitivo, servindo como base para negociação."
    ];

    termos.forEach((termo, index) => {
      const lines = doc.splitTextToSize(termo, pageWidth - 30);
      doc.text(lines, 15, currentY + (index * 5));
    });

    // ============= RODAPÉ =============
    const footerY = pageHeight - 25;
    
    // Linha divisória do rodapé
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(15, footerY, pageWidth - 15, footerY);

    // Informações da empresa
    doc.setFontSize(10);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFont("helvetica", "bold");
    doc.text(companySettings.company_name, pageWidth / 2, footerY + 4, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      companySettings.company_address,
      pageWidth / 2,
      footerY + 9,
      { align: "center" }
    );
    
    doc.text(
      `Tel: ${companySettings.company_phone} | Email: ${companySettings.company_email}`,
      pageWidth / 2,
      footerY + 13,
      { align: "center" }
    );
    
    doc.text(
      `CNPJ: ${companySettings.company_cnpj} | Estado: ${companySettings.company_state} | CEP: ${companySettings.company_cep}`,
      pageWidth / 2,
      footerY + 17,
      { align: "center" }
    );

    // Salvar PDF
    doc.save(`pedido-${order.customer_name.replace(/\s+/g, "-")}-${format(new Date(), "dd-MM-yyyy")}.pdf`);

    toast({
      title: "Pedido gerado com sucesso",
      description: "O PDF foi baixado para seu computador.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      completed: "outline",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filtrar pedidos por nome do cliente
  const filteredOrders = orders.filter((order) =>
    order.customer_name.toLowerCase().includes(customerNameFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground">Visualize e gerencie os pedidos de concreto</p>
        </div>
        <Button onClick={() => setShowSettingsDialog(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Dados da Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos Recebidos</CardTitle>
              <CardDescription>Lista de todos os pedidos cadastrados no sistema</CardDescription>
            </div>
            <div className="w-64">
              <Input
                placeholder="Filtrar por nome do cliente..."
                value={customerNameFilter}
                onChange={(e) => setCustomerNameFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando pedidos...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {customerNameFilter ? "Nenhum pedido encontrado com esse nome" : "Nenhum pedido encontrado"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo de Concreto</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.customer_name}</TableCell>
                      <TableCell>{order.customer_phone}</TableCell>
                      <TableCell>{order.concrete_types.name}</TableCell>
                      <TableCell>{order.volume.toFixed(2)} m³</TableCell>
                      <TableCell>{formatCurrency(order.total_price)}</TableCell>
                      <TableCell>{(() => {
                        const [year, month, day] = order.delivery_date.split('-');
                        return format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), "dd/MM/yyyy");
                      })()}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value as "pending" | "approved" | "completed" | "cancelled")}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleGeneratePDF(order)}>
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Configurações da Empresa */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Dados da Empresa</DialogTitle>
            <DialogDescription>
              Configure as informações que aparecerão no termo/contrato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={companySettings.company_name}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, company_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address">Endereço</Label>
              <Input
                id="company_address"
                value={companySettings.company_address}
                onChange={(e) =>
                  setCompanySettings({ ...companySettings, company_address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_phone">Telefone</Label>
                <Input
                  id="company_phone"
                  value={companySettings.company_phone}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, company_phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_email">E-mail</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={companySettings.company_email}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, company_email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_cnpj">CNPJ</Label>
                <Input
                  id="company_cnpj"
                  value={companySettings.company_cnpj}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, company_cnpj: e.target.value })
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_state">Estado</Label>
                <Input
                  id="company_state"
                  value={companySettings.company_state}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, company_state: e.target.value })
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_cep">CEP</Label>
                <Input
                  id="company_cep"
                  value={companySettings.company_cep}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, company_cep: e.target.value })
                  }
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Configuração PIX</h3>
              
              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  value={companySettings.pix_key}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, pix_key: e.target.value })
                  }
                  placeholder="email@exemplo.com, CPF/CNPJ, telefone ou chave aleatória"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_name">Nome do Recebedor</Label>
                <Input
                  id="pix_name"
                  value={companySettings.pix_name}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, pix_name: e.target.value })
                  }
                  placeholder="Nome completo ou razão social"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_city">Cidade</Label>
                <Input
                  id="pix_city"
                  value={companySettings.pix_city}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, pix_city: e.target.value })
                  }
                  placeholder="São Paulo"
                />
              </div>

              <TestPixQRCode 
                pixKey={companySettings.pix_key}
                pixName={companySettings.pix_name}
                pixCity={companySettings.pix_city}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Configuração TED</h3>
              
              <div className="space-y-2">
                <Label htmlFor="ted_bank_name">Nome do Banco</Label>
                <Input
                  id="ted_bank_name"
                  value={companySettings.ted_bank_name}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, ted_bank_name: e.target.value })
                  }
                  placeholder="Ex: Banco do Brasil"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ted_agency">Agência</Label>
                  <Input
                    id="ted_agency"
                    value={companySettings.ted_agency}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, ted_agency: e.target.value })
                    }
                    placeholder="0000-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ted_account">Conta</Label>
                  <Input
                    id="ted_account"
                    value={companySettings.ted_account}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, ted_account: e.target.value })
                    }
                    placeholder="00000-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ted_document">CPF ou CNPJ</Label>
                <Input
                  id="ted_document"
                  value={companySettings.ted_document}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, ted_document: e.target.value })
                  }
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ted_beneficiary">Nome do Beneficiário</Label>
                <Input
                  id="ted_beneficiary"
                  value={companySettings.ted_beneficiary}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, ted_beneficiary: e.target.value })
                  }
                  placeholder="Nome completo ou razão social"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Método de Pagamento</h3>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                <select
                  id="payment_method"
                  value={companySettings.payment_method || "pix_ted"}
                  onChange={(e) =>
                    setCompanySettings({ ...companySettings, payment_method: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="pix_ted">PIX e TED</option>
                  <option value="boleto">Boleto</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecione o método de pagamento a ser exibido no PDF
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold">Cores do PDF</h3>
              
              <div className="space-y-2">
                <Label htmlFor="pdf_primary_color">Cor Principal (Títulos e Textos)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="pdf_primary_color"
                    type="color"
                    value={companySettings.pdf_primary_color || "#1F4A7D"}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, pdf_primary_color: e.target.value })
                    }
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={companySettings.pdf_primary_color || "#1F4A7D"}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, pdf_primary_color: e.target.value })
                    }
                    placeholder="#1F4A7D"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cor usada para títulos e textos destacados no PDF
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf_background_color">Cor de Fundo (Cabeçalho e Tabelas)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="pdf_background_color"
                    type="color"
                    value={companySettings.pdf_background_color || "#1F4A7D"}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, pdf_background_color: e.target.value })
                    }
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={companySettings.pdf_background_color || "#1F4A7D"}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, pdf_background_color: e.target.value })
                    }
                    placeholder="#1F4A7D"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cor usada para fundos e elementos de destaque no PDF
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <Button onClick={saveCompanySettings} className="w-full">
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Seleção de Método de Pagamento */}
      <Dialog open={showPaymentMethodDialog} onOpenChange={setShowPaymentMethodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Método de Pagamento</DialogTitle>
            <DialogDescription>
              Escolha qual método de pagamento deve aparecer no PDF
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                variant={selectedPaymentMethod === "pix" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedPaymentMethod("pix")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">PIX</span>
                  <span className="text-sm text-muted-foreground">
                    QR Code e chave PIX
                  </span>
                </div>
              </Button>
              
              <Button
                variant={selectedPaymentMethod === "ted" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedPaymentMethod("ted")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">TED/DOC</span>
                  <span className="text-sm text-muted-foreground">
                    Dados bancários
                  </span>
                </div>
              </Button>
              
              <Button
                variant={selectedPaymentMethod === "boleto" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedPaymentMethod("boleto")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">BOLETO</span>
                  <span className="text-sm text-muted-foreground">
                    Boleto bancário via WhatsApp
                  </span>
                </div>
              </Button>
              
              <Button
                variant={selectedPaymentMethod === "credito" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedPaymentMethod("credito")}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">CARTÃO DE CRÉDITO</span>
                  <span className="text-sm text-muted-foreground">
                    Pagamento parcelado no cartão
                  </span>
                </div>
              </Button>
            </div>

            {selectedPaymentMethod === "credito" && (
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  max="12"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">
                  Quantidade de parcelas (1 a 12x)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Valor fixo em reais a ser descontado do total
              </p>
            </div>

            <Button onClick={confirmAction} className="w-full">
              Gerar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pedido de <strong>{orderToDelete?.customer_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
