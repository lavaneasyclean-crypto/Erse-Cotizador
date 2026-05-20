import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { formatFecha } from '@/lib/format/format';

const COLORS = {
  text: '#0f172a',
  muted: '#475569',
  border: '#cbd5e1',
  bg: '#f8fafc',
  brand: '#1d4ed8',
  brandLight: '#dbeafe',
  brandSoft: '#eff6ff',
  numberCircle: '#1d4ed8',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
    color: COLORS.text,
  },

  // Cover
  cover: {
    padding: 48,
    fontFamily: 'Helvetica',
    color: COLORS.text,
    flexDirection: 'column',
    height: '100%',
  },
  coverLogo: { width: 140, height: 70, objectFit: 'contain', marginBottom: 36 },
  coverTitle: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: COLORS.brand, marginBottom: 8 },
  coverSubtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 24 },
  coverDivider: { width: 80, height: 3, backgroundColor: COLORS.brand, marginBottom: 24 },
  coverDescription: { fontSize: 11, lineHeight: 1.6, color: COLORS.muted, maxWidth: '80%' },
  coverFooter: {
    marginTop: 'auto',
    fontSize: 9,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },

  // Header on each content page
  pageHeader: {
    position: 'absolute',
    top: 18,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    fontSize: 8,
    color: COLORS.muted,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 18,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
  },

  sectionNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.brand,
  },

  paragraph: { marginBottom: 8, color: COLORS.text },
  emphasis: { fontFamily: 'Helvetica-Bold' },

  stepList: { marginVertical: 6, marginLeft: 6 },
  step: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  stepNumber: { fontFamily: 'Helvetica-Bold', color: COLORS.brand, minWidth: 14 },
  stepBody: { flex: 1 },

  tipBox: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: COLORS.brandSoft,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.brand,
    borderRadius: 3,
  },
  tipLabel: { fontFamily: 'Helvetica-Bold', color: COLORS.brand, marginBottom: 2 },

  warnBox: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    borderRadius: 3,
  },
  warnLabel: { fontFamily: 'Helvetica-Bold', color: '#92400e', marginBottom: 2 },

  // Index / TOC
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    borderStyle: 'dotted',
  },
  tocChapter: { fontFamily: 'Helvetica-Bold', flex: 1 },
  tocPage: { color: COLORS.muted, marginLeft: 8 },

  estadoChip: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 9,
    marginRight: 4,
  },
});

type SectionItem =
  | { kind: 'p'; text: React.ReactNode }
  | { kind: 'steps'; items: React.ReactNode[] }
  | { kind: 'tip'; title: string; body: React.ReactNode }
  | { kind: 'warn'; title: string; body: React.ReactNode };

type Section = {
  number: number;
  title: string;
  items: SectionItem[];
};

const SECTIONS: Section[] = [
  {
    number: 1,
    title: 'Iniciar sesión',
    items: [
      {
        kind: 'p',
        text: (
          <>
            La aplicación requiere una cuenta de usuario que un{' '}
            <Text style={styles.emphasis}>administrador</Text> debe crear primero. Si no
            tienes cuenta, contacta al administrador de la plataforma de tu empresa.
          </>
        ),
      },
      {
        kind: 'steps',
        items: [
          'Abre la URL de la aplicación en tu navegador.',
          'Ingresa tu email y la contraseña que te entregaron.',
          'Click en "Ingresar". Si los datos son correctos llegarás al Dashboard.',
        ],
      },
      {
        kind: 'tip',
        title: 'Primera vez que entras',
        body: 'Ve a "Mi perfil" (esquina inferior izquierda) y revisa que tu nombre completo esté correcto — es el que aparecerá como VENDEDOR(a) en los PDF de las cotizaciones que crees.',
      },
    ],
  },
  {
    number: 2,
    title: 'Dashboard',
    items: [
      {
        kind: 'p',
        text: 'Al iniciar sesión llegas al Dashboard, un resumen de tu actividad y la del equipo.',
      },
      {
        kind: 'steps',
        items: [
          'Cuatro tarjetas (KPIs) arriba: total histórico, tus borradores pendientes, aprobadas del mes y total cotizado del mes.',
          'Pipeline por estado: barras con el % de cotizaciones en cada estado.',
          'Cotizaciones recientes: las últimas 5 con acceso directo al detalle.',
          'Accesos rápidos abajo para crear cotización, ir a clientes o productos.',
        ],
      },
    ],
  },
  {
    number: 3,
    title: 'Crear una cotización',
    items: [
      {
        kind: 'p',
        text: (
          <>
            Hay tres caminos para empezar una cotización: el botón{' '}
            <Text style={styles.emphasis}>“Nueva cotización”</Text> del dashboard, el del
            listado, o “Usar como referencia” desde una cotización existente (ver
            Sección 5).
          </>
        ),
      },
      {
        kind: 'steps',
        items: [
          'Selecciona el cliente con el buscador (puedes buscar por razón social o RUT).',
          'La condición de pago se autocompleta desde el cliente — puedes editarla si quieres para esta cotización en particular.',
          'Ajusta el vencimiento (por defecto "2 días hábiles").',
          'Agrega items con el botón "+ Agregar item" y el buscador de productos (por código SKU o descripción).',
          'En cada línea ajusta la cantidad. Si necesitas un descuento por línea, escríbelo en la columna Dcto %.',
          'Para aplicar el mismo descuento a todas las líneas, pon el % en "Dcto global" y click "Aplicar a todos". Después puedes ajustar líneas individuales.',
          'Los totales (subtotal, IVA 19%, total) se calculan en vivo a medida que editas.',
          'Escribe notas u observaciones si corresponde.',
          'Click "Guardar cotización". Se asigna un número correlativo automáticamente y te lleva al detalle.',
        ],
      },
      {
        kind: 'tip',
        title: 'El descuento no aparece en el PDF',
        body: 'En el PDF que el cliente recibe, la columna PRECIO ya viene con el descuento aplicado — el cliente no ve la columna "Dcto %". En la plataforma sí se ve para que el vendedor controle su margen.',
      },
    ],
  },
  {
    number: 4,
    title: 'Estados de una cotización',
    items: [
      {
        kind: 'p',
        text: 'Cada cotización tiene un estado que refleja en qué punto del proceso comercial está. El flujo natural es:',
      },
      {
        kind: 'p',
        text: (
          <>
            <Text style={styles.emphasis}>Borrador</Text> → en edición, todavía no se la
            mandaste al cliente.{'\n'}
            <Text style={styles.emphasis}>Enviada</Text> → la enviaste, estás esperando
            respuesta.{'\n'}
            <Text style={styles.emphasis}>Aprobada</Text> → el cliente confirmó la compra.
            {'\n'}
            <Text style={styles.emphasis}>Rechazada</Text> → el cliente no quiere proceder.
          </>
        ),
      },
      {
        kind: 'steps',
        items: [
          'En el listado o en el detalle, click sobre el badge del estado actual.',
          'Aparece un menú con las 4 opciones. Click en el nuevo estado.',
          'El cambio es inmediato. El dashboard y los reportes se actualizan automáticamente.',
        ],
      },
      {
        kind: 'tip',
        title: '¿Quién puede cambiar el estado?',
        body: 'El vendedor que creó la cotización, o cualquier administrador. Otros vendedores ven el badge pero no pueden cambiarlo.',
      },
    ],
  },
  {
    number: 5,
    title: 'Usar una cotización como referencia',
    items: [
      {
        kind: 'p',
        text: 'Para cotizaciones similares a una previa (mismo cliente, productos parecidos), no las edites — créalas usando la anterior como base.',
      },
      {
        kind: 'steps',
        items: [
          'Abre la cotización que quieres usar como base.',
          'Click en "Usar como referencia" en la esquina superior derecha. Te lleva al formulario "Nueva cotización" con todos los datos precargados.',
          'Ajusta lo que cambia (productos, cantidades, cliente).',
          'Guarda. Se crea una cotización NUEVA con un correlativo nuevo.',
        ],
      },
      {
        kind: 'warn',
        title: 'La original nunca se modifica',
        body: 'A propósito no permitimos editar cotizaciones existentes — el historial es sagrado. Si un cliente acepta una cotización vieja, la cotización original es el documento legal. Usar como referencia siempre crea una nueva.',
      },
      {
        kind: 'p',
        text: 'También puedes acceder al picker desde el formulario "Nueva cotización": botón "Basar en una cotización anterior" arriba a la derecha, con buscador.',
      },
    ],
  },
  {
    number: 6,
    title: 'Descargar el PDF y enviarlo al cliente',
    items: [
      {
        kind: 'p',
        text: 'Cada cotización tiene un PDF profesional con el logo de ERSE, los datos bancarios y el detalle del cliente — listo para enviar.',
      },
      {
        kind: 'steps',
        items: [
          'Entra al detalle de la cotización.',
          'Click "Descargar PDF" arriba a la derecha. Se abre en una pestaña nueva.',
          'Desde el navegador puedes guardarlo (Ctrl+S) o imprimirlo (Ctrl+P).',
          'Adjúntalo al email/WhatsApp que envíes al cliente.',
        ],
      },
      {
        kind: 'tip',
        title: 'El número de la cotización en el archivo',
        body: 'El nombre del archivo PDF incluye el número correlativo y la razón social del cliente, así no se te mezclan: "Cotizacion_5527_RAZON_SOCIAL.pdf".',
      },
    ],
  },
  {
    number: 7,
    title: 'Filtrar y buscar cotizaciones',
    items: [
      {
        kind: 'p',
        text: 'En el listado de Cotizaciones tienes una barra de filtros arriba.',
      },
      {
        kind: 'steps',
        items: [
          'Buscar: escribe el número correlativo (ej. 5530) o parte de la razón social (ej. "ABM").',
          'Desde / Hasta: filtra por rango de fechas.',
          'Pills de estado: click para activar/desactivar cada estado. Puedes combinar varios.',
          '"Limpiar" aparece cuando hay filtros activos.',
        ],
      },
      {
        kind: 'tip',
        title: 'Los filtros viven en la URL',
        body: 'Si compartes el link con un compañero, verá exactamente el mismo filtro. Puedes guardar la URL como favorito para una vista que uses seguido.',
      },
    ],
  },
  {
    number: 8,
    title: 'Clientes',
    items: [
      {
        kind: 'p',
        text: 'En "Clientes" administras la cartera completa: agregar nuevos, editar datos de los existentes, buscar.',
      },
      {
        kind: 'steps',
        items: [
          'Click "Nuevo cliente" para agregar uno: RUT y razón social son obligatorios; el resto es opcional pero recomendado (dirección, contacto, email, condición de pago default).',
          'El RUT se valida automáticamente con dígito verificador. Funciona para empresas y personas naturales.',
          'Click "Editar" en cualquier fila para modificar — el RUT no se puede cambiar porque es la llave única.',
          'Buscador arriba: filtra por razón social, RUT, contacto, ciudad o email.',
          'Las columnas son redimensionables: arrastra el borde derecho del encabezado.',
        ],
      },
    ],
  },
  {
    number: 9,
    title: 'Productos',
    items: [
      {
        kind: 'p',
        text: 'El catálogo de productos disponibles al cotizar.',
      },
      {
        kind: 'steps',
        items: [
          'Buscador por código SKU o descripción.',
          '"Nuevo producto": código SKU, descripción y precio neto (sin IVA).',
          '"Editar" en cualquier fila para modificar descripción o precio. El código SKU no se puede cambiar.',
        ],
      },
      {
        kind: 'warn',
        title: 'Cambiar el precio NO afecta cotizaciones viejas',
        body: 'Cada cotización guarda una "foto" del precio al momento de emitirse. Si actualizas el precio de un producto hoy, las cotizaciones de ayer siguen mostrando el precio anterior — eso es correcto.',
      },
    ],
  },
  {
    number: 10,
    title: 'Mi perfil',
    items: [
      {
        kind: 'p',
        text: 'Click sobre tu nombre en la esquina inferior izquierda de la barra lateral.',
      },
      {
        kind: 'steps',
        items: [
          'Cambia tu nombre completo — así apareces como VENDEDOR(a) en los PDF.',
          'El email no se cambia desde aquí (es la llave de tu cuenta); pide a un administrador si necesitas otro.',
          'Click "Guardar cambios".',
        ],
      },
    ],
  },
  {
    number: 11,
    title: 'Administración de usuarios (sólo administradores)',
    items: [
      {
        kind: 'p',
        text: 'Si tu cuenta tiene el rol "Admin", verás "Usuarios" en la barra lateral bajo Administración.',
      },
      {
        kind: 'steps',
        items: [
          'Crear usuario: email + nombre completo + contraseña temporal. Comparte la contraseña con la persona por un canal seguro.',
          'Marca "Es administrador" si quieres que tenga el mismo nivel de acceso.',
          'En la tabla puedes editar cualquier usuario o resetearle la contraseña.',
          'Eliminar usuario es definitivo. No puedes eliminarte a ti mismo.',
        ],
      },
      {
        kind: 'warn',
        title: 'Cuidado con quitar el rol admin',
        body: 'No puedes quitarte el rol admin a ti mismo desde la app (para evitar quedarte fuera). Si necesitas cambiar permisos críticos, hazlo desde otra cuenta admin.',
      },
    ],
  },
  {
    number: 12,
    title: 'Dudas y soporte',
    items: [
      {
        kind: 'p',
        text: 'Si tienes problemas técnicos, una funcionalidad no aparece como esperas o necesitas un usuario nuevo, contacta al administrador de la plataforma de tu empresa.',
      },
      {
        kind: 'p',
        text: 'Este manual está versionado con la aplicación: cada vez que la app cambia, este PDF se regenera automáticamente.',
      },
    ],
  },
];

export type ManualPdfData = {
  generatedAt: string;
  logo?: Buffer | string | null;
};

export function ManualPdf({ data }: { data: ManualPdfData }) {
  return (
    <Document
      title="Manual de uso — ERSE Cotizaciones"
      author="ERSE ELECTRIC SPA"
      subject="Manual de uso para vendedores y administradores"
    >
      {/* Cover */}
      <Page size="LETTER" style={styles.cover}>
        {data.logo ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
          <Image src={data.logo} style={styles.coverLogo} />
        ) : (
          <Text style={[styles.coverTitle, { fontSize: 22 }]}>ERSE ELECTRIC SPA</Text>
        )}
        <Text style={styles.coverTitle}>Manual de uso</Text>
        <Text style={styles.coverSubtitle}>Plataforma de cotizaciones</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverDescription}>
          Esta guía explica paso a paso cómo utilizar la plataforma de cotizaciones de ERSE
          Electric: iniciar sesión, crear y enviar cotizaciones, gestionar clientes y
          productos, controlar estados, y administrar usuarios.
        </Text>
        <View style={styles.coverFooter}>
          <Text>ERSE Electric SPA · RUT 77.638.085-7 · ventas@erse.cl</Text>
          <Text>Generado el {formatFecha(data.generatedAt)}</Text>
        </View>
      </Page>

      {/* Index */}
      <Page size="LETTER" style={styles.page}>
        <PageChrome generatedAt={data.generatedAt} />
        <View style={styles.sectionNumberRow}>
          <Text style={[styles.sectionTitle, { color: COLORS.brand }]}>Índice</Text>
        </View>
        <View>
          {SECTIONS.map((section) => (
            <View key={section.number} style={styles.tocItem}>
              <Text style={styles.tocChapter}>
                {section.number}. {section.title}
              </Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <Page key={section.number} size="LETTER" style={styles.page} wrap>
          <PageChrome generatedAt={data.generatedAt} />
          <View style={styles.sectionNumberRow}>
            <Text style={styles.sectionNumber}>{section.number}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {section.items.map((item, index) => (
            <SectionItemRenderer key={index} item={item} />
          ))}
        </Page>
      ))}
    </Document>
  );
}

function PageChrome({ generatedAt }: { generatedAt: string }) {
  return (
    <>
      <View style={styles.pageHeader} fixed>
        <Text>ERSE Cotizaciones · Manual de uso</Text>
        <Text>{formatFecha(generatedAt)}</Text>
      </View>
      <Text
        style={styles.pageFooter}
        fixed
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </>
  );
}

function SectionItemRenderer({ item }: { item: SectionItem }) {
  if (item.kind === 'p') {
    return <Text style={styles.paragraph}>{item.text}</Text>;
  }
  if (item.kind === 'steps') {
    return (
      <View style={styles.stepList}>
        {item.items.map((text, index) => (
          <View key={index} style={styles.step}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.stepBody}>{text}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (item.kind === 'tip') {
    return (
      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>💡 {item.title}</Text>
        <Text>{item.body}</Text>
      </View>
    );
  }
  return (
    <View style={styles.warnBox}>
      <Text style={styles.warnLabel}>⚠ {item.title}</Text>
      <Text>{item.body}</Text>
    </View>
  );
}
