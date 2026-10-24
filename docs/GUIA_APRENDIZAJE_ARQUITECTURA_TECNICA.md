# Guía de Aprendizaje: Documento de Arquitectura Técnica

## Cómo documentar la arquitectura de una aplicación web paso a paso

**Dirigida a:** estudiantes de desarrollo de software
**Docente:** Ing. Edwin Marín
**Modalidad:** individual o en parejas
**Duración sugerida:** 3 semanas (10 sesiones)
**Documento de referencia:** `02.5_Arquitectura_Tecnica.md` del Sistema EBS (un sistema real de facturación, inventario y cartera)

---

## 1. ¿Qué vas a aprender?

Un **documento de arquitectura técnica** explica *cómo está construido* un sistema: qué tecnologías usa, cómo se organizan sus partes, cómo se guardan los datos, cómo se protege y cómo se pone en línea. Es el mapa que usa cualquier desarrollador que llega nuevo a un proyecto.

Al terminar esta guía podrás:

- Explicar la arquitectura de una aplicación web moderna (SPA + Backend as a Service).
- Justificar la elección de cada tecnología, no solo nombrarla.
- Diseñar y documentar una base de datos relacional con tablas, relaciones, índices y triggers.
- Describir cómo se comunica el frontend con el backend (APIs).
- Identificar riesgos de seguridad y cómo se mitigan.
- Escribir tu propio documento de arquitectura para tu proyecto.

### Producto final

Vas a entregar **el documento de arquitectura técnica de tu propio proyecto**, siguiendo la misma estructura de 10 secciones del documento de referencia.

> **Tema del proyecto:** puedes usar el que trabajas en clase (inventario de farmacia, biblioteca, tienda escolar, gimnasio, etc.). Debe tener **mínimo 4 tablas relacionadas** y **al menos 2 tipos de usuario** (por ejemplo, administrador y vendedor).

---

## 2. Antes de empezar

### Conocimientos previos

| Tema | ¿Lo necesito? |
|------|---------------|
| HTML, CSS y JavaScript básico | Sí |
| React (componentes, `useState`, `useEffect`) | Sí |
| SQL básico (`SELECT`, `INSERT`, `JOIN`) | Sí |
| Git y GitHub | Sí |
| Supabase o PostgreSQL | Recomendado |

### Herramientas

- Editor de código (VS Code).
- Cuenta en GitHub.
- Cuenta gratuita en Supabase.
- Para diagramas: [draw.io](https://app.diagrams.net) o diagramas en texto dentro de bloques de código, como en el documento de referencia.

### Estructura del documento que vas a construir

```
1. Resumen Ejecutivo
2. Stack Tecnológico
3. Arquitectura de la Aplicación
4. Base de Datos
5. APIs y Endpoints
6. Seguridad
7. Rendimiento y Optimización
8. Integraciones Externas
9. Configuración y Despliegue
10. Monitoreo y Logs
11. Anexos (dependencias, comandos, glosario)
```

Cada sección de esta guía tiene la misma forma:

- 🎯 **Objetivo**: para qué sirve esa sección.
- 📚 **Conceptos clave**: lo que debes entender.
- 🔍 **Analiza el ejemplo**: qué observar en el documento de referencia.
- ✍️ **Tu turno**: lo que debes escribir para tu proyecto.
- ✅ **Lista de chequeo**: para revisar antes de pasar a la siguiente sección.

---

## 3. Encabezado del documento

Todo documento técnico empieza identificándose. Copia y completa:

```markdown
# 🏗️ ARQUITECTURA TÉCNICA Y ESPECIFICACIONES
## [Nombre de tu sistema] - Documentación Técnica

**Fecha:** [fecha]
**Versión:** 1.0
**Autor(es):** [tu nombre]
**Estado:** Borrador | En revisión | Aprobado
```

**¿Por qué la versión y el estado?** Porque un documento técnico cambia con el proyecto. Quien lo lea debe saber si está viendo la última versión y si ya fue aprobado.

---

## Sección 1. Resumen Ejecutivo

🎯 **Objetivo:** que alguien entienda *qué tipo de sistema es* en menos de un minuto.

📚 **Conceptos clave**

| Concepto | Qué significa |
|----------|---------------|
| **SPA** (Single Page Application) | La aplicación carga una sola página HTML y cambia el contenido con JavaScript, sin recargar. |
| **JAMstack** | JavaScript + APIs + Markup: el frontend es estático y los datos llegan por APIs. |
| **Serverless** | No administras servidores propios; usas servicios en la nube que escalan solos. |
| **Cloud-Native** | Diseñado desde el inicio para funcionar en la nube. |
| **Separation of Concerns** | Cada capa tiene una sola responsabilidad: interfaz, lógica y datos separados. |

🔍 **Analiza el ejemplo**

El documento EBS resume su sistema así:

```
Paradigma: SPA (Single Page Application)
Arquitectura: JAMstack + Serverless
Tipo: Cloud-Native Web Application
Escalabilidad: Horizontal automática
```

Luego lista características (tiempo real, responsive, segura...) y **principios de diseño** (API First, Security by Design, Performance First).

> **Pregunta para pensar:** ¿cuál es la diferencia entre una *característica* ("es responsive") y un *principio de diseño* ("Security by Design")?

✍️ **Tu turno**

1. Escribe un párrafo de 3 a 5 líneas: qué hace tu sistema, para quién y con qué tipo de arquitectura.
2. Completa el bloque de paradigma / arquitectura / tipo / escalabilidad.
3. Lista 4 a 6 características principales **que tu sistema realmente tenga**.
4. Elige 3 principios de diseño y explica en una línea cómo los aplicas.

✅ **Lista de chequeo**
- [ ] Alguien que no conoce el proyecto entiende qué hace.
- [ ] No prometí características que mi sistema no tiene.
- [ ] Cada principio de diseño tiene una explicación concreta.

---

## Sección 2. Stack Tecnológico

🎯 **Objetivo:** listar las tecnologías usadas **y justificar por qué se eligieron**.

📚 **Conceptos clave**

| Capa | Ejemplo en EBS | Para qué sirve |
|------|----------------|----------------|
| Frontend | React + Vite | Construir la interfaz y empaquetar el código |
| Backend as a Service (BaaS) | Supabase | Base de datos, autenticación y API sin programar un servidor |
| Almacenamiento de archivos | Cloudinary | Guardar y optimizar imágenes |
| Hosting | Vercel | Publicar la app en internet |
| Control de versiones | Git + GitHub | Guardar el historial del código |

🔍 **Analiza el ejemplo**

Observa que el documento EBS no solo dice "usamos React". Responde **¿Por qué React?** y compara **Vite vs Webpack** en una tabla. Una decisión técnica sin justificación no sirve de mucho a quien tenga que mantener el sistema.

```
Vite:                  Webpack:
├─ Inicio: 0.5s       ├─ Inicio: 5-10s
├─ HMR: < 100ms       ├─ HMR: 1-3s
└─ Config: 20 líneas  └─ Config: 100+ líneas
```

> ⚠️ **Ojo con las versiones.** El documento de referencia dice "Vite 4.4.5" en un lugar y "vite ^5.0.8" en los anexos. Las versiones deben coincidir con tu `package.json`. Revísalo con `npm list vite react`.

✍️ **Tu turno**

1. Haz una tabla con cada capa de tu sistema: tecnología, versión (sacada de tu `package.json`) y para qué la usas.
2. Para **dos** tecnologías escribe "¿Por qué X?" con 3 razones.
3. Haz **una** comparación con una alternativa (por ejemplo, Supabase vs Firebase, o Vercel vs Netlify).
4. Indica el plan y costo de cada servicio en la nube (gratis, de pago, cuánto).
5. Describe tu estrategia de ramas en Git (`main`, `develop`, `feature/...`).

✅ **Lista de chequeo**
- [ ] Las versiones coinciden con mi `package.json`.
- [ ] Justifiqué al menos dos decisiones.
- [ ] Incluí los costos de los servicios.

---

## Sección 3. Arquitectura de la Aplicación

🎯 **Objetivo:** mostrar **cómo se conectan las partes** del sistema y cómo viajan los datos.

📚 **Conceptos clave**

- **Diagrama de arquitectura:** cajas (componentes) y flechas (comunicación).
- **Estructura de carpetas:** cómo está organizado el código.
- **Flujo de datos unidireccional:** usuario → componente → API → base de datos → estado → pantalla.
- **Estado global (Context API):** datos que comparten muchos componentes, como el usuario que inició sesión.
- **Ruta protegida:** página que solo se ve si el usuario inició sesión.

🔍 **Analiza el ejemplo**

El diagrama EBS tiene 4 niveles:

```
USUARIO (navegador)
   ↓ HTTPS
CDN (Vercel) → archivos estáticos
   ↓
APLICACIÓN REACT → Components → Context → Services
   ↓
SUPABASE (BD, Auth, API)  +  CLOUDINARY (imágenes)
```

El ejemplo "Crear Producto" sigue un dato desde el clic del usuario hasta que aparece en pantalla, numerando cada paso del 1 al 7. Esa es la mejor forma de explicar un flujo.

> **Actividad de análisis:** compara la estructura de carpetas del documento (`pages/`, `context/`, `hooks/`, `services`) con un proyecto real. ¿Coinciden? Un documento de arquitectura debe describir **lo que existe**, no lo ideal. Si tu proyecto no usa una carpeta `context/`, no la pongas.

✍️ **Tu turno**

1. Dibuja el diagrama de arquitectura de tu sistema (texto o imagen).
2. Copia la estructura **real** de tus carpetas con un comentario por carpeta. En Mac o Linux puedes generarla con `tree -L 3 -I node_modules`.
3. Elige **una funcionalidad** de tu sistema (por ejemplo, "registrar un préstamo") y describe su flujo de datos en pasos numerados, con el código relevante.
4. Explica cómo manejas el estado global y el inicio de sesión.
5. Lista tus rutas y marca cuáles son públicas y cuáles protegidas.

✅ **Lista de chequeo**
- [ ] El diagrama muestra todos los servicios externos que uso.
- [ ] La estructura de carpetas es la real.
- [ ] Hay al menos un flujo explicado paso a paso.

---

## Sección 4. Base de Datos

🎯 **Objetivo:** documentar **cómo se guardan los datos**. Es la sección más importante: si los datos están mal diseñados, todo el sistema falla.

📚 **Conceptos clave**

| Concepto | Qué significa | Ejemplo en EBS |
|----------|---------------|----------------|
| **Llave primaria (PK)** | Identifica cada fila de forma única | `id UUID PRIMARY KEY` |
| **Llave foránea (FK)** | Conecta una tabla con otra | `cliente_id UUID REFERENCES clientes(id)` |
| **Relación 1:N** | Un registro tiene muchos de otra tabla | Un cliente tiene muchas facturas |
| **ON DELETE RESTRICT** | No deja borrar si hay datos relacionados | No se borra un cliente con facturas |
| **ON DELETE CASCADE** | Al borrar el padre, borra los hijos | Al borrar una factura se borran sus detalles |
| **Índice** | Acelera las búsquedas por una columna | `idx_facturas_fecha` |
| **Trigger** | Código que se ejecuta solo ante un evento | Al vender, descuenta el stock |
| **Función SQL** | Cálculo reutilizable dentro de la BD | `obtener_saldo_factura()` |
| **Soft delete** | "Borrar" marcando `activo = false` en vez de eliminar | Productos inactivos |

🔍 **Analiza el ejemplo**

El documento EBS tiene 7 tablas: `productos`, `clientes`, `facturas`, `detalles_factura`, `abonos`, `movimientos_inventario` y `pedidos`.

Observa el patrón **cabecera / detalle**:

```
facturas (1) ────< (N) detalles_factura >──── (1) productos
```

Una factura no guarda los productos directamente. Usa una tabla intermedia (`detalles_factura`) con cantidad y precio de cada línea. Así se resuelve una relación **muchos a muchos**.

> **Pregunta para pensar:** ¿por qué `detalles_factura` guarda el `precio_unitario` si el producto ya tiene `precio_venta`? *(Pista: ¿qué pasa con las facturas viejas si mañana cambia el precio?)*

> **Pregunta para pensar:** ¿por qué `facturas` usa `ON DELETE RESTRICT` con clientes, pero `detalles_factura` usa `ON DELETE CASCADE` con facturas?

✍️ **Tu turno**

1. Escribe el `CREATE TABLE` de **todas** tus tablas (mínimo 4), con tipos de dato, `NOT NULL`, `DEFAULT`, PK y FK.
2. Dibuja las relaciones (1:N, N:M) en texto o como diagrama entidad-relación.
3. Crea al menos **3 índices** y explica qué búsqueda acelera cada uno.
4. Crea al menos **1 trigger**: por ejemplo, actualizar `updated_at` automáticamente.
5. Crea al menos **1 función SQL** útil para tu negocio y muestra cómo se usa.
6. **Pruébalo:** ejecuta tu SQL en Supabase (SQL Editor) e inserta datos de prueba. Un esquema que no se ha ejecutado no está terminado.

✅ **Lista de chequeo**
- [ ] Todas las tablas tienen llave primaria.
- [ ] Cada FK tiene una regla `ON DELETE` pensada.
- [ ] Mi SQL corre sin errores en Supabase.
- [ ] Expliqué el porqué de cada índice.

---

## Sección 5. APIs y Endpoints

🎯 **Objetivo:** explicar **cómo el frontend pide y envía datos** al backend.

📚 **Conceptos clave**

| Método HTTP | Acción | Equivalente SQL |
|-------------|--------|-----------------|
| `GET` | Consultar | `SELECT` |
| `POST` | Crear | `INSERT` |
| `PATCH` | Actualizar | `UPDATE` |
| `DELETE` | Eliminar | `DELETE` |

- **REST API autogenerada:** Supabase crea un endpoint por cada tabla automáticamente.
- **Filtros:** `.eq()` igual, `.gt()` mayor que, `.ilike()` búsqueda sin importar mayúsculas, `.order()`, `.range()` para paginar.
- **Realtime:** escuchar cambios de la base de datos en vivo (WebSockets).

🔍 **Analiza el ejemplo**

El documento muestra la misma operación de dos formas:

```javascript
// Como URL REST
GET /clientes?saldo_actual=gt.0

// Como código JavaScript con el cliente de Supabase
supabase.from('clientes').select('*').gt('saldo_actual', 0)
```

### 🕵️ Actividad: encuentra el error

Los documentos técnicos también tienen errores, y aprender a detectarlos es parte del oficio. Estos dos ejemplos del documento de referencia **no funcionan tal como están escritos**. Investiga en la documentación oficial de Supabase por qué:

1. ```
   GET /productos?stock_actual=lt.stock_minimo
   ```
   *(Pista: ¿el filtro compara contra otra columna o contra el texto "stock_minimo"?)*

2. ```javascript
   saldo_actual: supabase.raw(`saldo_actual + ${invoiceData.total}`)
   ```
   *(Pista: busca si `supabase.raw` existe en `supabase-js`. ¿Qué alternativa hay? Investiga las funciones RPC.)*

3. **Reto extra:** en "Crear Factura Completa" se hacen 3 operaciones separadas. ¿Qué pasa si la segunda falla? ¿Es de verdad una *transacción*?

✍️ **Tu turno**

1. Para cada tabla principal documenta sus operaciones CRUD (formato URL **y** formato JavaScript).
2. Incluye al menos **2 consultas con JOIN**, por ejemplo una factura con los datos del cliente.
3. Escribe **1 hook de React** completo que consulte datos con paginación, con estados `loading` y `error`.
4. Prueba cada ejemplo antes de documentarlo.

✅ **Lista de chequeo**
- [ ] Cada ejemplo de código fue probado y funciona.
- [ ] Documenté cómo se manejan los errores.
- [ ] Respondí la actividad "encuentra el error".

---

## Sección 6. Seguridad

🎯 **Objetivo:** demostrar que los datos están protegidos **en cada capa**.

📚 **Conceptos clave**

| Concepto | Qué protege |
|----------|-------------|
| **Autenticación** | Verifica *quién eres* (usuario y contraseña) |
| **Autorización / Roles** | Define *qué puedes hacer* (admin, vendedor, bodeguero) |
| **RLS** (Row Level Security) | Reglas en la base de datos que filtran qué filas ve o modifica cada usuario |
| **Variables de entorno** | Mantienen las claves fuera del código fuente |
| **XSS** | Evita que alguien inyecte código malicioso en la página |
| **Inyección SQL** | Evita que un texto del usuario se ejecute como SQL |
| **Headers de seguridad** | Instrucciones al navegador para bloquear ataques comunes |

🔍 **Analiza el ejemplo**

La idea más importante del documento EBS es: **la seguridad real está en la base de datos (RLS), no en el frontend.** Ocultar un botón en React no impide que alguien llame a la API directamente.

```sql
-- Nadie puede eliminar físicamente productos: se usa soft delete
CREATE POLICY "Nadie puede eliminar productos"
  ON productos FOR DELETE
  USING (false);
```

> ⚠️ **Regla de oro:** la `anon key` de Supabase puede ir en el frontend porque RLS la protege. La `service_role key` **jamás** va en el frontend ni en GitHub.

> **Pregunta para pensar:** el documento usa `auth.jwt() ->> 'role' = 'admin'` en las políticas, pero guarda el rol en `user_metadata`. Investiga: ¿en qué parte del JWT queda realmente `user_metadata`? ¿Funcionaría esa política tal cual? *(Pista: busca "custom claims" en Supabase.)*

✍️ **Tu turno**

1. Define los roles de tu sistema y haz una tabla de **qué puede hacer cada rol** en cada tabla (leer, crear, editar, borrar).
2. Escribe las políticas RLS de al menos **2 tablas** y pruébalas con dos usuarios de distinto rol.
3. Documenta tus variables de entorno con valores **de ejemplo**, nunca los reales.
4. Escribe una función de validación de un formulario de tu sistema.
5. Verifica que tu archivo `.env` está en `.gitignore`.

✅ **Lista de chequeo**
- [ ] RLS está activado en todas mis tablas.
- [ ] Probé que un usuario sin permiso **no puede** hacer la acción.
- [ ] No hay ninguna clave real en el documento ni en GitHub.

---

## Sección 7. Rendimiento y Optimización

🎯 **Objetivo:** explicar qué se hizo para que la app **cargue rápido** y no haga trabajo innecesario.

📚 **Conceptos clave**

| Técnica | Problema que resuelve |
|---------|-----------------------|
| **Code splitting / Lazy loading** | No descargar el código de todas las páginas al inicio |
| **Optimización de imágenes** | Imágenes pesadas que tardan en cargar |
| **Paginación** | Traer 10.000 registros de una vez |
| **Debounce** | Hacer una consulta por cada letra que el usuario escribe |
| **Caché** | Pedir los mismos datos una y otra vez |
| **Core Web Vitals** (LCP, CLS...) | Medir qué tan rápida se siente la página |

🔍 **Analiza el ejemplo**

El **debounce** del documento espera 300 ms después de la última tecla antes de buscar. Si el usuario escribe "acetaminofén" (12 letras), en vez de 12 consultas se hace **1**.

> **Actividad:** abre tu app en Chrome → DevTools → pestaña **Lighthouse** → "Analyze page load". Anota tu puntaje de Performance y los valores de LCP y CLS. Ese será tu punto de partida real.

✍️ **Tu turno**

1. Implementa y documenta al menos **2 técnicas** de la tabla en tu proyecto.
2. Incluye tu reporte de Lighthouse **antes y después** de optimizar.
3. Ejecuta `npm run build` y anota el tamaño de los archivos generados.

✅ **Lista de chequeo**
- [ ] Las métricas son medidas reales, no copiadas.
- [ ] Expliqué qué problema resuelve cada técnica en **mi** sistema.

---

## Sección 8. Integraciones Externas

🎯 **Objetivo:** documentar **los servicios de terceros** con los que se conecta el sistema.

📚 **Conceptos clave**

- **Integración actual vs futura:** separa lo que ya funciona de lo que está planeado (*roadmap*).
- **Upload preset sin firma (unsigned):** permite subir imágenes desde el frontend sin exponer la clave secreta.
- **Por qué algunas acciones necesitan backend:** borrar una imagen en Cloudinary requiere la clave secreta, que nunca debe estar en el navegador.

🔍 **Analiza el ejemplo**

El documento EBS marca claramente qué es **(Futuro)**: email, WhatsApp Business API, PDF. Eso es honesto con el lector. Mezclar lo implementado con lo planeado es un error común en la documentación.

✍️ **Tu turno**

1. Lista cada servicio externo que usas: para qué, cómo te conectas y qué clave necesitas.
2. Documenta **una** integración con su código completo.
3. Agrega una sección "Roadmap" con 2 o 3 integraciones futuras, marcadas como tales.

✅ **Lista de chequeo**
- [ ] Separé lo implementado de lo futuro.
- [ ] Ninguna clave secreta queda expuesta en el frontend.

---

## Sección 9. Configuración y Despliegue

🎯 **Objetivo:** que **otra persona pueda instalar y publicar** tu sistema solo leyendo esta sección.

📚 **Conceptos clave**

- **Entorno de desarrollo vs producción:** variables distintas para cada uno.
- **Build:** convertir tu código React en archivos optimizados (`dist/`).
- **Deploy:** publicar esos archivos en un servidor (Vercel).
- **CI/CD:** automatizar pruebas y despliegue con cada `git push`.
- **Rewrites en una SPA:** todas las rutas deben devolver `index.html` para que React Router funcione al recargar.

🔍 **Analiza el ejemplo**

```json
"rewrites": [
  { "source": "/(.*)", "destination": "/index.html" }
]
```

> **Pregunta para pensar:** si quitas esta regla, abres `tusitio.vercel.app/productos` y recargas la página, ¿qué pasa y por qué?

### 🧪 Prueba de fuego

Entrega tu documento a un compañero o compañera. Debe clonar tu repositorio e instalar el proyecto **siguiendo solo tus instrucciones**. Anota cada paso donde se haya trabado y corrige el documento.

✍️ **Tu turno**

1. Escribe los pasos de instalación desde cero: clonar, `npm install`, crear `.env`, `npm run dev`.
2. Documenta tus scripts de `package.json`.
3. Publica tu app en Vercel y documenta los pasos, incluyendo dónde se configuran las variables de entorno.
4. (Opcional) Crea un workflow de GitHub Actions que ejecute el linter y el build.

✅ **Lista de chequeo**
- [ ] Un compañero instaló el proyecto solo con mis instrucciones.
- [ ] Mi app está publicada y anoté la URL.

---

## Sección 10. Monitoreo y Logs

🎯 **Objetivo:** explicar **cómo te enteras** de que algo falló en producción.

📚 **Conceptos clave**

| Herramienta | Para qué |
|-------------|----------|
| **Logger** | Mensajes ordenados por nivel (info, warn, error) que se apagan en producción |
| **Error Boundary** | Evita que un error en un componente deje toda la pantalla en blanco |
| **Logs de Supabase** | Ver consultas y errores de la base de datos |
| **Vercel Analytics** | Ver visitas y velocidad real |
| **Sentry** | Recibir alertas con el detalle de cada error de los usuarios |

✍️ **Tu turno**

1. Implementa un `ErrorBoundary` en tu app y documenta cómo lo probaste (provoca un error a propósito).
2. Explica dónde revisas los logs de tu base de datos y de tu hosting.
3. Describe qué harías si un usuario reporta "la app no carga".

✅ **Lista de chequeo**
- [ ] Mi app no queda en blanco si un componente falla.
- [ ] Sé dónde buscar los errores de cada servicio.

---

## Sección 11. Anexos y cierre

Incluye al final de tu documento:

1. **Dependencias:** copia la sección `dependencies` de tu `package.json`.
2. **Comandos útiles:** desarrollo, Git, despliegue.
3. **Glosario:** mínimo 15 términos técnicos usados en tu documento, explicados con tus palabras.
4. **Tabla de aprobación:** con quién elaboró, quién revisó y la fecha.

```markdown
| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Autor | [tu nombre] | ________ | __/__/____ |
| Revisor (compañero) | [nombre] | ________ | __/__/____ |
| Docente | Ing. Edwin Marín | ________ | __/__/____ |
```

---

## 4. Cronograma sugerido (3 semanas)

| Sesión | Tema | Entregable |
|--------|------|------------|
| 1 | Introducción + lectura del documento de referencia | Encabezado + Sección 1 |
| 2 | Stack tecnológico | Sección 2 |
| 3 | Arquitectura y flujo de datos | Sección 3 |
| 4 | Base de datos I: tablas y relaciones | Sección 4.1 y 4.2 |
| 5 | Base de datos II: índices, triggers y funciones | Sección 4 completa |
| 6 | APIs + actividad "encuentra el error" | Sección 5 |
| 7 | Seguridad y RLS | Sección 6 |
| 8 | Rendimiento + integraciones | Secciones 7 y 8 |
| 9 | Despliegue + prueba de fuego con un compañero | Secciones 9 y 10 |
| 10 | Anexos, revisión final y sustentación | Documento completo |

---

## 5. Rúbrica de evaluación

| Criterio | Peso | Excelente (5) | Aceptable (3) | Insuficiente (1) |
|----------|------|---------------|---------------|------------------|
| **Base de datos** | 20% | SQL ejecutado, relaciones correctas, índices y triggers justificados | Tablas correctas sin índices ni triggers | Tablas sin relaciones o SQL con errores |
| **Arquitectura y flujo** | 15% | Diagrama completo y flujo paso a paso con código real | Diagrama sin flujo de datos | Sin diagrama o copiado del ejemplo |
| **Justificación técnica** | 15% | Cada decisión tiene un "por qué" y una comparación | Algunas decisiones justificadas | Solo lista tecnologías |
| **Seguridad** | 15% | RLS probado con dos roles, sin claves expuestas | RLS escrito pero no probado | Sin RLS o con claves reales expuestas |
| **APIs y código** | 10% | Ejemplos probados, con manejo de errores | Ejemplos sin manejo de errores | Código que no funciona |
| **Despliegue** | 10% | App publicada e instalada por un compañero | App publicada sin prueba de instalación | No publicada |
| **Pensamiento crítico** | 10% | Resolvió las preguntas y la actividad "encuentra el error" | Resolvió algunas | No las resolvió |
| **Presentación** | 5% | Ortografía, formato Markdown y glosario completos | Formato correcto con errores menores | Desordenado |

**Importante:** copiar secciones del documento de referencia sin adaptarlas a tu proyecto se califica con 1 en ese criterio. El documento debe describir **tu** sistema.

---

## 6. Consejos finales

- **Documenta lo que existe, no lo que te gustaría tener.** Si algo es futuro, márcalo como "(Futuro)".
- **Prueba cada bloque de código antes de pegarlo.** Un ejemplo que no funciona confunde más que ayudar.
- **Escribe para alguien que llega nuevo al proyecto.** Si tú no estuvieras, ¿podría entenderlo y continuar?
- **Un diagrama vale más que tres párrafos.** Úsalos en arquitectura, base de datos y flujos.
- **Versiona tu documento en Git** igual que tu código: haz commits cada vez que completes una sección.

### Recursos

- React: https://react.dev/learn
- Vite: https://vitejs.dev/guide/
- Supabase (base de datos, Auth, RLS): https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Markdown: https://www.markdownguide.org/basic-syntax/
