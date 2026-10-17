# Configuración de Roles en el Sistema EBS

## 📋 Roles Disponibles

### 1. **SUPERADMIN** 🔐
**El rol más privilegiado del sistema**

**Acceso:**
- ✅ Todas las funcionalidades de Admin
- ✅ **Reporte Exclusivo: "Clientes por Producto"** (solo superadmin)
- ✅ Reportes avanzados
- ✅ Auditoría completa
- ✅ Dashboard de ventas
- ✅ Gestión de gastos
- ✅ Dashboard de contabilidad

**Menú especial:** "Reportes Exclusivos" con acceso a:
- Clientes por Producto
- Auditoría de Productos
- Historial de Movimientos
- Dashboard de Ventas

---

### 2. **ADMIN** 👨‍💼
**Administrador general del sistema**

**Acceso:**
- ✅ Crear facturas
- ✅ Ver facturas guardadas
- ✅ Gestión de clientes
- ✅ Auditoría de productos
- ✅ Reportes de cobros
- ✅ Gestión de gastos
- ✅ Gestión de inventario
- ❌ Reporte "Clientes por Producto" (solo para superadmin)

---

### 3. **CONTABILIDAD** 💰
**Gestión contable y financiera**

**Acceso:**
- ✅ Ver facturas guardadas
- ✅ Reportes de cobros
- ✅ Gestión de gastos
- ✅ Dashboard de contabilidad
- ✅ Rutas de cobro
- ✅ Gestión de pedidos
- ✅ Dashboard de ventas
- ✅ Catálogo (lectura)
- ❌ Crear facturas
- ❌ Reporte "Clientes por Producto"

---

### 4. **INVENTARIO** (inv) 📦
**Gestión de bodega y stock**

**Acceso:**
- ✅ Gestión de inventario
- ✅ Gestión de pedidos
- ✅ Catálogo productos (completo)
- ✅ Auditoría de productos
- ❌ Crear/editar facturas (solo lectura)
- ❌ Gestión de clientes
- ❌ Reportes

---

### 5. **VENDEDOR** 🏪
**Ventas y atención al cliente**

**Acceso:**
- ✅ Crear facturas
- ✅ Ver facturas propias
- ✅ Catálogo (lectura)
- ✅ Reportes de cobros
- ✅ Gestión de pedidos
- ✅ Gestión de gastos
- ❌ Auditoría
- ❌ Gestión de inventario

---

### 6. **CLIENTE** 👥
**Cliente final del sistema (acceso limitado)**

**Acceso:**
- ✅ Ver catálogo de productos
- ❌ Crear facturas
- ❌ Acceso administrativo

---

## 🔧 Crear una cuenta y asignar un rol

1. En Supabase, abre **Authentication → Users** y crea una cuenta con el correo de la persona. Mantén deshabilitado el registro público si solo el equipo debe iniciar sesión.
2. En **SQL Editor**, asigna el rol en `raw_app_meta_data`, que solo debe ser modificada por un administrador del proyecto. Reemplaza el correo y el rol:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'vendedor')
WHERE email = 'usuario@empresa.com';
```

Para asignar el rol `admin` a las dos cuentas indicadas para este proyecto, crea ambas cuentas primero en **Authentication → Users** y ejecuta:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
WHERE lower(email) IN (
  'john-820917@hotmail.com',
  'magalyandrea.gutierrezalmeciga@gmail.com'
)
RETURNING email, raw_app_meta_data ->> 'role' AS role;
```

Comprueba que el resultado devuelva los dos correos con `admin`. Si una cuenta aún no existe en **Authentication → Users**, créala y vuelve a ejecutar la consulta. Los usuarios deben cerrar sesión e iniciarla de nuevo para recibir el rol actualizado.

Para asignar el rol `vendedor` a la cuenta de ventas, créala primero en **Authentication → Users** y ejecuta:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'vendedor')
WHERE lower(email) = 'diazgutierrezalansteve2506@gmail.com'
RETURNING email, raw_app_meta_data ->> 'role' AS role;
```

Confirma que el resultado muestre el correo con el rol `vendedor`. Si la cuenta aún no existe, créala y vuelve a ejecutar la consulta. La persona debe cerrar sesión e iniciarla de nuevo para recibir el rol actualizado.

Para asignar el rol `superadmin` a la cuenta principal, créala primero en **Authentication → Users** y ejecuta:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'superadmin')
WHERE lower(email) = 'ewinma@gmail.com'
RETURNING email, raw_app_meta_data ->> 'role' AS role;
```

Confirma que el resultado muestre el correo con el rol `superadmin`. Si la cuenta aún no existe, créala y vuelve a ejecutar la consulta. La persona debe cerrar sesión e iniciarla de nuevo para recibir el rol actualizado.

Roles aceptados: `superadmin`, `admin`, `contabilidad`, `inventario`, `vendedor` y `cliente`. Usa el rol mínimo que necesita cada cuenta. El cambio se reflejará cuando el usuario inicie sesión de nuevo.

La lista de usuarios del proyecto mostrada en Supabase debe contener una cuenta por persona autorizada. Si se migran cuentas desde la versión anterior, crea cada cuenta aquí con su correo y una contraseña nueva; no reutilices las contraseñas que estaban incluidas en el código.

**Importante:** las contraseñas de la versión anterior se publicaban en archivos del frontend y deben considerarse comprometidas. Cambia esas contraseñas y cualquier otra que se haya reutilizado antes de desplegar esta versión. Borrar las claves del código actual no las elimina de versiones desplegadas ni del historial de Git.

No guardes contraseñas ni roles en el código del frontend, en `user_metadata` o en una tabla pública accesible sin políticas. El acceso con el cliente público de Supabase es normal; nunca pongas una clave `service_role` o una contraseña de base de datos en variables `VITE_*`.

### Recuperación de contraseña

El inicio de sesión incluye una opción **¿Olvidaste tu contraseña?** que envía por Supabase Auth un enlace de recuperación al correo ingresado. Para que el enlace abra la pantalla de cambio de contraseña, en Supabase ve a **Authentication → URL Configuration** y agrega a **Redirect URLs** las direcciones exactas de los entornos utilizados, por ejemplo:

- `https://tu-dominio.com/restablecer-contrasena`
- `http://localhost:5173/restablecer-contrasena` (desarrollo local)

Reemplaza `https://tu-dominio.com` por el dominio real de producción. La pantalla permite guardar una contraseña nueva de al menos 8 caracteres; el enlace es de un solo uso y Supabase controla su vencimiento.

La autenticación no reemplaza la seguridad de la base de datos. Verifica en Supabase que RLS esté habilitado para cada tabla con datos privados y que las políticas permitan solo las operaciones y filas que correspondan. Las restricciones de rutas del navegador son únicamente de interfaz: RLS es lo que protege los datos frente a llamadas directas a la API.

---

## 📊 Matriz de Acceso por Rol

| Funcionalidad | Superadmin | Admin | Contabilidad | Inventario | Vendedor | Cliente |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Nueva Factura | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Facturas Guardadas | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Clientes por Producto** | **✅** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Auditoría Productos | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Reportes de Cobros | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Gestión de Gastos | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Gestión de Inventario | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Dashboard Ventas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dashboard Contabilidad | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Catálogo Completo | ✅ | ✅ | ✅ (lectura) | ✅ | ✅ (lectura) | ✅ (lectura) |
| Gestión Clientes | ✅ | ✅ | ✅ (lectura) | ❌ | ✅ (limitado) | ❌ |

---

## 🚀 Próximos Pasos

Para expandir funcionalidades exclusivas de Superadmin:

1. **Agregar más reportes analíticos** (análisis de ventas, tendencias, etc.)
2. **Panel de control de usuarios** (gestionar roles desde la interfaz)
3. **Auditoría de accesos** (quién accedió, cuándo, qué vio)
4. **Reportes de rentabilidad** por producto/cliente
5. **Análisis predictivos** de demanda
6. **Control de permisos granulares** por módulo

---

## 📝 Notas Importantes

- El rol se lee de `app_metadata` de Supabase Auth y no debe provenir de `user_metadata`, porque el usuario puede modificar sus propios metadatos.
- Las cuentas sin un rol válido no podrán entrar a las rutas protegidas.
- Los cambios de rol se aplican cuando Supabase emite un token actualizado; pide al usuario cerrar sesión y volver a entrar.
- Superadmin es el único que puede ver "Clientes por Producto"
- Se recomienda tener máximo 1-2 cuentas de Superadmin por empresa
- Todos los cambios de rol deben ser registrados para auditoría

---

**Última actualización:** 10 de febrero de 2026
