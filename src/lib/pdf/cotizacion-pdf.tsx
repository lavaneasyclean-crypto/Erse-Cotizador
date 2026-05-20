import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { computeTotals, lineTotal, unitNet } from '@/lib/cotizaciones/totals';
import { formatCantidad, formatCLP, formatFecha } from '@/lib/format/format';

export type CotizacionPdfData = {
  numero: number;
  fecha: string;
  vencimiento: string;
  condicion_pago: string | null;
  notas: string | null;
  cliente: {
    rut: string;
    razon_social: string;
    persona: string | null;
    direccion_despacho: string | null;
    ciudad: string | null;
    contacto: string | null;
  };
  vendedor: string;
  items: {
    posicion: number;
    codigo_sku: string;
    descripcion: string;
    precio_unitario: number;
    cantidad: number;
    descuento_porcentaje: number;
  }[];
  /**
   * Optional buffer of the ERSE logo image. Passed in from the route handler
   * which reads `public/logo-erse.png` server-side. When null the PDF falls
   * back to the text brand "ERSE ELECTRIC SPA" so it never breaks if the file
   * is missing.
   */
  logo?: Buffer | string | null;
};

const COLORS = {
  text: '#0f172a',
  muted: '#475569',
  border: '#cbd5e1',
  tableHeaderBg: '#1e293b',
  tableHeaderFg: '#ffffff',
  brand: '#1e3a8a',
  brandBox: '#f59e0b',
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: COLORS.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  brandLogoBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  brandLogo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  brandBlock: {
    flexDirection: 'column',
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.brand,
  },
  brandLine: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 1,
  },
  quoteBox: {
    borderWidth: 1.5,
    borderColor: COLORS.brandBox,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 150,
  },
  quoteBoxRut: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
  quoteBoxTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginVertical: 1 },
  quoteBoxNumber: { fontSize: 11 },

  metaBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 10,
    rowGap: 3,
  },
  metaCol: { width: '50%', flexDirection: 'row', paddingRight: 8 },
  metaLabel: { fontFamily: 'Helvetica-Bold', marginRight: 4 },
  metaValue: { flex: 1 },

  table: { marginTop: 10, borderWidth: 0.5, borderColor: COLORS.border },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tableRowLast: { flexDirection: 'row' },
  tableHeader: {
    backgroundColor: COLORS.tableHeaderBg,
    color: COLORS.tableHeaderFg,
    fontFamily: 'Helvetica-Bold',
  },
  cellNum: { width: '5%', padding: 4, textAlign: 'center' },
  cellCode: { width: '15%', padding: 4 },
  cellDesc: { width: '50%', padding: 4 },
  cellQty: { width: '10%', padding: 4, textAlign: 'right' },
  cellPrice: { width: '10%', padding: 4, textAlign: 'right' },
  cellTotal: { width: '10%', padding: 4, textAlign: 'right' },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    columnGap: 12,
  },
  notesBlock: { flex: 1 },
  notesTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  notesBody: { color: COLORS.muted, marginBottom: 8 },
  bankBlock: {
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 6,
    fontSize: 8,
  },
  bankTitle: { fontFamily: 'Helvetica-Bold', marginBottom: 2 },

  totalsBlock: {
    width: 180,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalsLabel: { color: COLORS.muted },
  totalsFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },

  paymentFooter: {
    marginTop: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 6,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
});

// The customer-facing PDF hides the discount: PRECIO is the net unit price
// and TOTAL = PRECIO × Cantidad. Math is delegated to lib/cotizaciones/totals
// so PDF and platform stay in lockstep. See docs/ADR/003-discount-visibility.md.
function toQuoteLine(item: CotizacionPdfData['items'][number]) {
  return {
    precioUnitario: item.precio_unitario,
    cantidad: item.cantidad,
    descuentoPorcentaje: item.descuento_porcentaje,
  };
}

export function CotizacionPdf({ data }: { data: CotizacionPdfData }) {
  const totals = computeTotals(data.items.map(toQuoteLine));

  return (
    <Document
      title={`Cotización N° ${data.numero}`}
      author="ERSE ELECTRIC SPA"
      subject={`Cotización para ${data.cliente.razon_social}`}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandLogoBlock}>
            {data.logo ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image, not HTML <img>; PDF images don't have alt text.
              <Image src={data.logo} style={styles.brandLogo} />
            ) : null}
            <View style={styles.brandBlock}>
              {data.logo ? null : (
                <Text style={styles.brandName}>ERSE ELECTRIC SPA</Text>
              )}
              <Text style={styles.brandLine}>RUT: 77.638.085-7</Text>
              <Text style={styles.brandLine}>Email: ventas@erse.cl</Text>
              <Text style={styles.brandLine}>Web: www.erse.cl</Text>
              <Text style={styles.brandLine}>
                Teléfono / WhatsApp: +56 9 4805 4581
              </Text>
            </View>
          </View>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteBoxRut}>R.U.T.: 77.638.085-7</Text>
            <Text style={styles.quoteBoxTitle}>COTIZACIÓN</Text>
            <Text style={styles.quoteBoxNumber}>Nº {data.numero}</Text>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>SEÑOR(ES):</Text>
            <Text style={styles.metaValue}>{data.cliente.razon_social}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>FECHA:</Text>
            <Text style={styles.metaValue}>{formatFecha(data.fecha)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>R.U.T.:</Text>
            <Text style={styles.metaValue}>{data.cliente.rut}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>VENCIMIENTO:</Text>
            <Text style={styles.metaValue}>{data.vencimiento}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>DIRECCIÓN DESPACHO:</Text>
            <Text style={styles.metaValue}>{data.cliente.direccion_despacho ?? '—'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CONDICIÓN DE PAGO:</Text>
            <Text style={styles.metaValue}>{data.condicion_pago ?? '—'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CIUDAD:</Text>
            <Text style={styles.metaValue}>{data.cliente.ciudad ?? '—'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>VENDEDOR(a):</Text>
            <Text style={styles.metaValue}>{data.vendedor}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>CONTACTO:</Text>
            <Text style={styles.metaValue}>
              {[data.cliente.persona, data.cliente.contacto].filter(Boolean).join(', ') || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cellNum}>#</Text>
            <Text style={styles.cellCode}>CÓDIGO</Text>
            <Text style={styles.cellDesc}>DETALLE</Text>
            <Text style={styles.cellQty}>Cantidad</Text>
            <Text style={styles.cellPrice}>PRECIO</Text>
            <Text style={styles.cellTotal}>TOTAL</Text>
          </View>
          {data.items.map((item, index) => (
            <View
              key={item.posicion}
              style={index === data.items.length - 1 ? styles.tableRowLast : styles.tableRow}
            >
              <Text style={styles.cellNum}>{item.posicion}</Text>
              <Text style={styles.cellCode}>{item.codigo_sku}</Text>
              <Text style={styles.cellDesc}>{item.descripcion}</Text>
              <Text style={styles.cellQty}>{formatCantidad(item.cantidad)}</Text>
              <Text style={styles.cellPrice}>{formatCLP(unitNet(toQuoteLine(item)))}</Text>
              <Text style={styles.cellTotal}>{formatCLP(lineTotal(toQuoteLine(item)))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.notesBlock}>
            <Text style={styles.notesTitle}>Notas / Observaciones</Text>
            <Text style={styles.notesBody}>{data.notas || ' '}</Text>
            <View style={styles.bankBlock}>
              <Text style={styles.bankTitle}>Datos Bancarios</Text>
              <Text>Razón Social: ERSE ELECTRIC SPA   RUT: 77.638.085-7</Text>
              <Text>Cta Cte: 88413903   Banco: Santander   Correo: ventas@erse.cl</Text>
            </View>
          </View>

          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text>${formatCLP(totals.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>IVA (19%):</Text>
              <Text>${formatCLP(totals.iva)}</Text>
            </View>
            <View style={styles.totalsFinal}>
              <Text>Total:</Text>
              <Text>${formatCLP(totals.total)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.paymentFooter}>
          Forma de Pago: Contado, Transferencia Bancaria, Link de pago, Tarjeta de Crédito
        </Text>
      </Page>
    </Document>
  );
}
