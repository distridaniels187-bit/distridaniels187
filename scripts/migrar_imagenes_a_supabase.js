// Migra las imágenes de productos de Cloudinary a Supabase Storage (bucket "productos"), en WebP.
//
// Uso (desde la carpeta scripts):
//   node migrar_imagenes_a_supabase.js --prueba            descarga y convierte, NO sube ni cambia nada
//   node migrar_imagenes_a_supabase.js --limite=5          migra solo 5 productos (para probar)
//   node migrar_imagenes_a_supabase.js                     migra todos
//   node migrar_imagenes_a_supabase.js --revertir=../backups/migracion-imagenes-....csv
//                                                          devuelve las URLs de Cloudinary guardadas en ese registro
//
// Requiere en scripts/.env (nunca en Vercel ni en git):
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (Supabase > Project Settings > API > service_role)
// y haber creado el bucket con sql/STORAGE_IMAGENES_PRODUCTOS.sql
//
// Se puede ejecutar varias veces: solo procesa productos cuya imagen sigue en Cloudinary.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(aqui, '.env') });
dotenv.config({ path: join(aqui, '..', '.env.local') }); // solo para SUPABASE_URL si falta

const BUCKET = 'productos';
const LADO_MAXIMO = 1000;
const CALIDAD_WEBP = 80;

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const PRUEBA = Boolean(args.prueba);
const LIMITE = args.limite ? Number(args.limite) : Infinity;
const CONCURRENCIA = args.concurrencia ? Number(args.concurrencia) : 4;

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;

const rolDeClave = (clave) => {
  try {
    return JSON.parse(Buffer.from(clave.split('.')[1], 'base64url').toString()).role;
  } catch {
    return null;
  }
};

if (!url || !claveServicio) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en scripts/.env');
  process.exit(1);
}
if (rolDeClave(claveServicio) !== 'service_role') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no es la clave service_role (es la anon u otra). Cópiala de Supabase > Project Settings > API.');
  process.exit(1);
}

const supabase = createClient(url, claveServicio, { auth: { persistSession: false } });

const esCloudinary = (u) => /^https?:\/\/res\.cloudinary\.com\//i.test((u || '').trim());
const kb = (bytes) => Math.round(bytes / 1024);
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const descargar = async (direccion, intentos = 3) => {
  for (let i = 1; i <= intentos; i += 1) {
    try {
      const respuesta = await fetch(direccion, { signal: AbortSignal.timeout(30000) });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return Buffer.from(await respuesta.arrayBuffer());
    } catch (error) {
      if (i === intentos) throw error;
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
  return null;
};

const convertir = (buffer) => sharp(buffer)
  .rotate() // respeta la orientación de fotos de celular
  .resize({ width: LADO_MAXIMO, height: LADO_MAXIMO, fit: 'inside', withoutEnlargement: true })
  .webp({ quality: CALIDAD_WEBP })
  .toBuffer();

const traerProductos = async () => {
  const todos = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, imagen_url')
      .order('id')
      .range(desde, desde + 999);
    if (error) throw new Error(`No se pudieron leer los productos: ${error.message}`);
    todos.push(...data);
    if (data.length < 1000) break;
  }
  return todos;
};

const actualizarProducto = async (id, campos) => {
  const { error } = await supabase.from('productos').update(campos).eq('id', id);
  if (error && /imagen_public_id/.test(error.message)) {
    // La tabla no tiene la columna imagen_public_id: se guarda solo la URL
    const { error: error2 } = await supabase.from('productos').update({ imagen_url: campos.imagen_url }).eq('id', id);
    if (error2) throw new Error(error2.message);
    return;
  }
  if (error) throw new Error(error.message);
};

const revertir = async (archivo) => {
  const lineas = readFileSync(archivo, 'utf8').trim().split('\n').slice(1);
  let devueltos = 0;
  for (const linea of lineas) {
    const [id, , urlAnterior, , , , estado] = linea.split('","').map((c) => c.replace(/^"|"$/g, ''));
    if (estado !== 'migrado') continue;
    await actualizarProducto(Number(id), { imagen_url: urlAnterior, imagen_public_id: null });
    devueltos += 1;
  }
  console.log(`↩️  ${devueltos} productos devueltos a sus URLs de Cloudinary.`);
};

const main = async () => {
  if (args.revertir) {
    await revertir(args.revertir);
    return;
  }

  const { data: bucket, error: errorBucket } = await supabase.storage.getBucket(BUCKET);
  if (errorBucket || !bucket) {
    console.error(`❌ El bucket "${BUCKET}" no existe. Ejecuta primero sql/STORAGE_IMAGENES_PRODUCTOS.sql en Supabase.`);
    process.exit(1);
  }

  const productos = (await traerProductos()).filter((p) => esCloudinary(p.imagen_url)).slice(0, LIMITE);
  console.log(`${PRUEBA ? '🧪 MODO PRUEBA (no sube ni cambia nada). ' : ''}Productos con imagen en Cloudinary a procesar: ${productos.length}`);
  if (productos.length === 0) return;

  const carpetaRegistro = join(aqui, '..', 'backups');
  mkdirSync(carpetaRegistro, { recursive: true });
  const sello = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const registro = join(carpetaRegistro, `migracion-imagenes-${sello}${PRUEBA ? '-prueba' : ''}.csv`);
  writeFileSync(registro, 'id,nombre,url_anterior,url_nueva,kb_original,kb_webp,estado,detalle\n');

  let hechos = 0;
  let fallidos = 0;
  let totalOriginal = 0;
  let totalWebp = 0;
  const cola = [...productos];

  const trabajador = async () => {
    while (cola.length) {
      const p = cola.shift();
      const ruta = `migrados/${p.id}.webp`;
      try {
        const original = await descargar(p.imagen_url.trim());
        const webp = await convertir(original);
        let urlNueva = '';

        if (!PRUEBA) {
          const { error } = await supabase.storage.from(BUCKET).upload(ruta, webp, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: true
          });
          if (error) throw new Error(`subida: ${error.message}`);
          // ?v= evita que el navegador muestre una versión vieja si se vuelve a migrar
          urlNueva = `${supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl}?v=${Date.now()}`;
          await actualizarProducto(p.id, { imagen_url: urlNueva, imagen_public_id: ruta });
        }

        hechos += 1;
        totalOriginal += original.length;
        totalWebp += webp.length;
        appendFileSync(registro, [p.id, p.nombre, p.imagen_url, urlNueva, kb(original.length), kb(webp.length), PRUEBA ? 'prueba' : 'migrado', ''].map(csv).join(',') + '\n');
        console.log(`✅ [${hechos + fallidos}/${productos.length}] #${p.id} ${kb(original.length)} KB → ${kb(webp.length)} KB`);
      } catch (error) {
        fallidos += 1;
        appendFileSync(registro, [p.id, p.nombre, p.imagen_url, '', '', '', 'error', error.message].map(csv).join(',') + '\n');
        console.log(`❌ [${hechos + fallidos}/${productos.length}] #${p.id} ${p.nombre}: ${error.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));

  console.log('\n──────── Resumen ────────');
  console.log(`${PRUEBA ? 'Procesados (prueba)' : 'Migrados'}: ${hechos}   Con error: ${fallidos}`);
  console.log(`Tamaño original: ${(totalOriginal / 1048576).toFixed(1)} MB → WebP: ${(totalWebp / 1048576).toFixed(1)} MB`);
  console.log(`Registro: ${registro}`);
  if (fallidos) console.log('Los productos con error conservan su imagen de Cloudinary. Puedes volver a ejecutar el script para reintentarlos.');
};

main().catch((error) => {
  console.error('❌', error.message);
  process.exit(1);
});
