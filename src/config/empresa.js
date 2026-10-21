// Configuración del negocio (cliente).
// Para adaptar el sistema a otro cliente, cambia solo este archivo y el logo en /public.

// TODO: completar con los datos reales de DistriDaniels
export const EMPRESA = {
  nombreCorto: 'DistriDaniels',
  nombreLegal: 'DISTRIDANIELS', // Nombre que sale en la factura / cuenta de cobro
  nit: '1023914575',
  // Líneas de contacto que se imprimen debajo del NIT en la factura
  contactos: [
    'Cel. 322 309 2094'
  ],
  logo: '/logo-empresa.png',
  // Ancho del papel de la impresora térmica de tickets (mm): 78 u 80, o 58 para las pequeñas
  anchoTicketMm: 78,
  // Medios de pago que se imprimen en el pie de la factura
  mediosPago: [
    { nombre: 'NEQUI Y DAVIPLATA', numero: '0000000000' },
    { nombre: 'BANCOLOMBIA AHORROS', numero: '00000000000' }
  ]
};

// Vendedores: nombre y número de WhatsApp (con indicativo 57, sin espacios).
export const VENDEDORES = [
  { nombre: 'Anderson Perez', whatsapp: '573223092094' },
  { nombre: 'Luisa Fernanda Martínez', whatsapp: '573105692662' },
  // TODO: quitar antes de entregar al cliente
  { nombre: 'Pruebas - Edwin', whatsapp: '573004583117' }
];

// Personas que aparecen al registrar gastos
export const EMPLEADOS_GASTOS = ['Anderson Perez', 'Otro'];

// Claves para acciones protegidas (eliminar productos, editar/eliminar abonos)
export const CLAVES_ADMIN = ['edwin', '777'];

// Usuarios con menú de acceso especial (ventas, facturas y rutas de cobro)
export const ACCESO_ESPECIAL = {
  ids: [2],
  usernames: ['alan diaz']
};

// Firma del desarrollador (se mantiene en todos los clientes)
export const DESARROLLADOR = {
  marca: 'e-business store (EBS)',
  nombre: 'Ing. Edwin Marín',
  telefono: '3004583117'
};
