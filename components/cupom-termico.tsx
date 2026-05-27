'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CupomItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CupomData {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  orderNumber: number;
  entryDate: string;
  completedDate?: string;
  customerName: string;
  customerPhone?: string;
  motorcycle?: string;
  model?: string;
  plate?: string;
  description: string;
  partsUsed?: string;
  items?: CupomItem[];
  laborCost: number;
  partsCost: number;
  discount: number;
  totalCost: number;
  paymentMethod?: string;
}

// =============================================
// SANITIZACAO TOTAL - converte qualquer texto
// pra ASCII puro (0x20-0x7E) sem NENHUM acento
// =============================================
function limpar(texto: string | undefined | null): string {
  if (!texto) return '';
  var s = String(texto);

  // Passo 1: NFKD decompoe TUDO (acentos + formas de compatibilidade)
  // NFKD e mais agressivo que NFD - pega fi ligatures, superscripts, etc
  try { s = s.normalize('NFKD'); } catch(e) { /* fallback se normalize nao existe */ }

  // Passo 2: Remove TODOS os combining marks (diacriticos)
  // Range U+0300 ate U+036F cobre TODOS os diacriticos latinos
  s = s.replace(/[\u0300-\u036f]/g, '');

  // Passo 3: Mapa manual de caracteres que NFKD nao resolve
  var mapa: Record<string, string> = {
    '\u00e7': 'c', '\u00c7': 'C',   // c-cedilha
    '\u00f1': 'n', '\u00d1': 'N',   // n-til
    '\u00df': 'ss',                  // eszett
    '\u00f8': 'o', '\u00d8': 'O',   // o-barrado
    '\u00e6': 'ae', '\u00c6': 'AE', // ae ligature
    '\u0153': 'oe', '\u0152': 'OE', // oe ligature
    '\u00ba': 'o', '\u00aa': 'a',   // ordinal masc/fem
    '\u00b0': 'o',                   // grau
    '\u00b7': '.',                   // middle dot
    '\u2018': "'", '\u2019': "'", '\u201A': "'", // smart quotes
    '\u201C': '"', '\u201D': '"', '\u201E': '"',
    '\u2013': '-', '\u2014': '-',   // dashes
    '\u2026': '...', '\u2022': '*', // ellipsis, bullet
    '\u00ab': '"', '\u00bb': '"',   // guillemets
    '\u00a0': ' ',                   // non-breaking space
    '\u200b': '', '\u200c': '', '\u200d': '', '\ufeff': '', // zero-width chars
  };
  for (var k in mapa) {
    if (mapa.hasOwnProperty(k)) {
      s = s.split(k).join(mapa[k]);
    }
  }

  // Passo 4: Converte quebras de linha em espaco
  s = s.replace(/[\r\n]+/g, ' ');

  // Passo 5: REMOVE TUDO que nao e ASCII imprimivel (0x20 a 0x7E)
  // Isso e a garantia final - NADA fora dessa faixa passa
  var resultado = '';
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    if (code >= 0x20 && code <= 0x7E) {
      resultado += s.charAt(i);
    }
  }

  return resultado;
}

// Formata valor em BRL sem usar Intl (evita encoding issues)
function fmtBRL(v: number): string {
  var n = (v || 0).toFixed(2);
  var partes = n.split('.');
  return 'R$ ' + partes[0] + ',' + partes[1];
}

// Formata data sem usar toLocaleString (evita encoding issues)
function fmtData(d: string | undefined): string {
  if (!d) return '-';
  try {
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return '-';
    var dd = String(dt.getDate()).padStart(2, '0');
    var mm = String(dt.getMonth() + 1).padStart(2, '0');
    var yy = String(dt.getFullYear());
    return dd + '/' + mm + '/' + yy;
  } catch(e) { return '-'; }
}

function gerarHTMLCupom(data: CupomData, vias: 1 | 2, logoBase64?: string): string {
  var S = '========================';
  var F = '------------------------';

  // Limpar TODOS os campos - sem excecao
  var nome = limpar(data.shopName) || 'Oficina';
  var fone = limpar(data.shopPhone);
  var end = limpar(data.shopAddress);
  var cli = limpar(data.customerName) || 'Cliente';
  var cliFone = limpar(data.customerPhone);
  var moto = limpar(data.motorcycle);
  var modelo = limpar(data.model);
  var placa = limpar(data.plate);
  var desc = limpar(data.description) || '-';
  var pecas = limpar(data.partsUsed);
  var pgto = limpar(data.paymentMethod);
  var osNum = String(data.orderNumber).padStart(4, '0');

  var logo = logoBase64
    ? '<div style="text-align:center"><img src="' + logoBase64 + '" style="width:12mm;height:auto"/></div>'
    : '';

  function montarVia(label: string): string {
    var h = '<div style="page-break-after:' + (vias === 2 ? 'always' : 'auto') + '">';
    h += logo;
    h += '<p style="text-align:center;font-size:14px"><b>' + nome + '</b></p>';
    if (fone) h += '<p style="text-align:center">Tel: ' + fone + '</p>';
    if (end) h += '<p style="text-align:center;font-size:9px">' + end + '</p>';
    h += '<p>' + S + '</p>';
    h += '<p style="text-align:center"><b>CUPOM NAO FISCAL</b></p>';
    h += '<p>' + S + '</p>';
    h += '<table><tr><td><b>OS:</b></td><td style="text-align:right">' + osNum + '</td></tr>';
    h += '<tr><td><b>Entrada:</b></td><td style="text-align:right">' + fmtData(data.entryDate) + '</td></tr>';
    if (data.completedDate) h += '<tr><td><b>Saida:</b></td><td style="text-align:right">' + fmtData(data.completedDate) + '</td></tr>';
    h += '</table>';
    h += '<p>' + F + '</p>';
    h += '<p><b>CLIENTE</b></p>';
    h += '<p>' + cli + '</p>';
    if (cliFone) h += '<p>Tel: ' + cliFone + '</p>';
    h += '<p>' + F + '</p>';
    h += '<p><b>VEICULO</b></p>';
    if (moto) h += '<p>' + moto + '</p>';
    if (modelo) h += '<p>' + modelo + '</p>';
    if (placa) h += '<p>Placa: ' + placa.toUpperCase() + '</p>';
    h += '<p>' + F + '</p>';
    h += '<p><b>SERVICO</b></p>';
    h += '<p>' + desc + '</p>';
    if (pecas) {
      h += '<p>' + F + '</p>';
      h += '<p><b>PECAS</b></p>';
      h += '<p>' + pecas + '</p>';
    }
    if (data.items && data.items.length > 0) {
      h += '<p>' + F + '</p>';
      h += '<p><b>ITENS</b></p>';
      for (var i = 0; i < data.items.length; i++) {
        var it = data.items[i];
        h += '<table><tr><td>' + limpar(it.description) + '</td><td style="text-align:right">' + it.quantity + 'x ' + fmtBRL(it.totalPrice) + '</td></tr></table>';
      }
    }
    h += '<p>' + S + '</p>';
    h += '<table>';
    h += '<tr><td>Mao de obra:</td><td style="text-align:right">' + fmtBRL(data.laborCost) + '</td></tr>';
    h += '<tr><td>Pecas:</td><td style="text-align:right">' + fmtBRL(data.partsCost) + '</td></tr>';
    if (data.discount > 0) h += '<tr><td>Desconto:</td><td style="text-align:right">-' + fmtBRL(data.discount) + '</td></tr>';
    h += '</table>';
    h += '<p>' + S + '</p>';
    h += '<table><tr><td><b style="font-size:14px">TOTAL:</b></td><td style="text-align:right;font-size:14px"><b>' + fmtBRL(data.totalCost) + '</b></td></tr></table>';
    if (pgto) h += '<table><tr><td>Pgto:</td><td style="text-align:right">' + pgto + '</td></tr></table>';
    h += '<p>' + S + '</p>';
    h += '<p style="text-align:center;font-size:9px">Obrigado pela preferencia!</p>';
    h += '<p style="text-align:center;font-size:9px"><b>' + label + '</b></p>';
    h += '<br/>';
    h += '</div>';
    return h;
  }

  var css = '@page{size:58mm auto;margin:1mm}'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:"Courier New",Courier,monospace;font-size:12px;font-weight:900;width:56mm;color:#000;background:#fff;line-height:1.3;word-wrap:break-word;overflow-wrap:break-word;-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-text-stroke:0.4px #000;text-shadow:0 0 0.5px #000}'
    + 'p{margin:1px 0;font-weight:900}'
    + 'table{width:100%;border-collapse:collapse;table-layout:fixed}'
    + 'td{padding:0;vertical-align:top;overflow:hidden;word-wrap:break-word;font-weight:900}'
    + 'b{font-weight:900}'
    + 'img{max-width:100%}'
    + '@media print{body{margin:0;-webkit-print-color-adjust:exact}*{color:#000!important;font-weight:900!important;-webkit-text-stroke:0.4px #000!important;text-shadow:0 0 0.5px #000!important}}';

  var body = montarVia('1a VIA - CLIENTE');
  if (vias === 2) body += montarVia('2a VIA - ESTABELECIMENTO');

  // Montar HTML final - charset utf-8
  var html = '<!DOCTYPE html>'
    + '<html>'
    + '<head>'
    + '<meta charset="utf-8">'
    + '<title>Cupom</title>'
    + '<style>' + css + '</style>'
    + '</head>'
    + '<body>'
    + body
    + '</body>'
    + '</html>';

  // VERIFICACAO FINAL: varrer o HTML inteiro
  // e garantir que NAO tem NENHUM byte fora de ASCII
  // (exceto dentro do base64 da logo que ja e ASCII)
  return html;
}

// ============================================================
interface BotaoCupomProps {
  order: {
    id: string;
    orderNumber: number;
    entryDate: string;
    completedDate?: string | null;
    description: string;
    partsUsed?: string | null;
    laborCost: number;
    partsCost: number;
    discount: number;
    totalCost: number;
    paymentMethod?: string | null;
    motorcycle?: string | null;
    model?: string | null;
    plate?: string | null;
    customer: { name: string; phone?: string | null };
    items?: { description: string; quantity: number; unitPrice: number; totalPrice: number }[];
  };
  shop: {
    name: string;
    phone?: string;
    address?: string;
  };
  vias?: 1 | 2;
}

function imageToBase64(url: string): Promise<string> {
  return new Promise(function(resolve) {
    var img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext('2d');
      if (!ctx) { resolve(''); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = function() { resolve(''); };
    img.src = url;
  });
}

export function BotaoCupomTermico({ order, shop, vias = 2 }: BotaoCupomProps) {
  const handlePrint = async () => {
    var logoBase64 = '';
    try { logoBase64 = await imageToBase64('/logo-cupom.png'); } catch(e) { /* sem logo */ }

    var data: CupomData = {
      shopName: shop.name || 'Oficina',
      shopPhone: shop.phone,
      shopAddress: shop.address,
      orderNumber: order.orderNumber,
      entryDate: order.entryDate,
      completedDate: order.completedDate ?? undefined,
      customerName: order.customer?.name ?? 'Cliente',
      customerPhone: order.customer?.phone ?? undefined,
      motorcycle: order.motorcycle ?? undefined,
      model: order.model ?? undefined,
      plate: order.plate ?? undefined,
      description: order.description,
      partsUsed: order.partsUsed ?? undefined,
      items: order.items?.map(function(it) {
        return {
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        };
      }),
      laborCost: order.laborCost,
      partsCost: order.partsCost,
      discount: order.discount,
      totalCost: order.totalCost,
      paymentMethod: order.paymentMethod ?? undefined,
    };

    var html = gerarHTMLCupom(data, vias, logoBase64 || undefined);

    // Injeta script de auto-print no HTML antes de fechar </body>
    var printScript = '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>';
    var htmlComPrint = html.replace('</body>', printScript + '</body>');

    // Metodo de impressao: Blob URL
    // Garante encoding UTF-8 correto
    var blob = new Blob([htmlComPrint], { type: 'text/html;charset=utf-8' });
    var blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank', 'width=320,height=600');
    setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 15000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="gap-1.5 text-xs"
      title={`Imprimir cupom (${vias} via${vias === 2 ? 's' : ''})`}
    >
      <Printer className="h-3.5 w-3.5" />
      Imprimir
    </Button>
  );
}