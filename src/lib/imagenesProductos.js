import { supabase } from '../components/supabaseClient';

// Imágenes de productos en Supabase Storage (bucket público "productos"), convertidas a WebP.
// El bucket y sus permisos se crean con sql/STORAGE_IMAGENES_PRODUCTOS.sql
export const BUCKET_PRODUCTOS = 'productos';

const LADO_MAXIMO = 1000; // px: suficiente para el catálogo y la vista ampliada
const CALIDAD_WEBP = 0.8;
export const TAMANO_MAXIMO_ORIGINAL = 15 * 1024 * 1024; // se acepta grande porque se comprime antes de subir

const cargarImagen = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    resolve(img);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('No se pudo leer la imagen. Prueba con un archivo JPG o PNG.'));
  };
  img.src = url;
});

const canvasABlob = (canvas, tipo, calidad) => new Promise((resolve) => {
  canvas.toBlob(resolve, tipo, calidad);
});

// Redimensiona y convierte a WebP. Los navegadores que no generan WebP
// (Safari antiguo) devuelven otro formato: en ese caso se usa JPEG.
export const convertirImagenAWebp = async (file) => {
  const img = await cargarImagen(file);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
  const ancho = Math.round(img.naturalWidth * escala);
  const alto = Math.round(img.naturalHeight * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  // Fondo blanco para PNG transparentes (si cae a JPEG no quedan en negro)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(img, 0, 0, ancho, alto);

  let blob = await canvasABlob(canvas, 'image/webp', CALIDAD_WEBP);
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasABlob(canvas, 'image/jpeg', 0.82);
  }
  if (!blob) {
    throw new Error('No se pudo procesar la imagen.');
  }
  return blob;
};

const nombreArchivo = (extension) => {
  const aleatorio = Math.random().toString(36).slice(2, 10);
  return `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${aleatorio}.${extension}`;
};

// Convierte y sube la imagen. Devuelve la URL pública y la ruta dentro del bucket
// (la ruta se guarda en imagen_public_id para poder borrarla después).
export const subirImagenProducto = async (file) => {
  const blob = await convertirImagenAWebp(file);
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const ruta = nombreArchivo(extension);

  const { error } = await supabase.storage
    .from(BUCKET_PRODUCTOS)
    .upload(ruta, blob, {
      contentType: blob.type,
      cacheControl: '31536000', // las rutas son únicas, el navegador puede guardarla un año
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(BUCKET_PRODUCTOS).getPublicUrl(ruta);
  return {
    imagenUrl: data.publicUrl,
    imagenPublicId: ruta,
    tamanoOriginal: file.size,
    tamanoFinal: blob.size
  };
};

// Ruta dentro del bucket a partir de la URL pública (sin el ?v= de la migración).
// Devuelve null si la imagen no está en nuestro bucket (por ejemplo, Cloudinary).
export const rutaEnBucket = (imagenUrl) => {
  const marca = `/storage/v1/object/public/${BUCKET_PRODUCTOS}/`;
  const url = (imagenUrl || '').trim();
  const posicion = url.indexOf(marca);
  if (posicion === -1) return null;
  return decodeURIComponent(url.slice(posicion + marca.length).split('?')[0]);
};

// Borra del Storage la imagen de un producto, solo si es de nuestro bucket
// y ningún otro producto usa el mismo archivo. Nunca lanza error: si falla,
// el archivo queda huérfano pero el producto ya se borró o actualizó.
export const eliminarImagenProducto = async (imagenUrl, idProductoExcluido = null) => {
  const ruta = rutaEnBucket(imagenUrl);
  if (!ruta) return { eliminada: false, motivo: 'no-esta-en-supabase' };

  try {
    let consulta = supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .like('imagen_url', `%/${BUCKET_PRODUCTOS}/${ruta}%`);
    if (idProductoExcluido !== null) consulta = consulta.neq('id', idProductoExcluido);
    const { count, error: errorConteo } = await consulta;
    if (errorConteo) throw errorConteo;
    if (count > 0) return { eliminada: false, motivo: 'la-usa-otro-producto' };

    const { error } = await supabase.storage.from(BUCKET_PRODUCTOS).remove([ruta]);
    if (error) throw error;
    return { eliminada: true };
  } catch (error) {
    console.warn('No se pudo borrar la imagen del Storage:', ruta, error);
    return { eliminada: false, motivo: 'error' };
  }
};

export const formatearTamano = (bytes) => (
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
);
