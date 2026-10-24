# Guía de Aprendizaje: Plan de Respaldo y Recuperación de Datos

## Cómo proteger la información de un sistema y recuperarla cuando algo sale mal

**Dirigida a:** estudiantes de desarrollo de software
**Docente:** Ing. Edwin Marín
**Modalidad:** individual o en parejas
**Duración sugerida:** 3 semanas (9 sesiones)
**Documento de referencia:** `02.6_Plan_Respaldo_Datos.md` del Sistema EBS (un sistema real de facturación, inventario y cartera)

---

## 1. ¿Qué vas a aprender?

Un **plan de respaldo y recuperación** responde tres preguntas:

1. **¿Qué datos** debemos proteger y qué tan importantes son?
2. **¿Cómo y cada cuánto** sacamos copias de seguridad?
3. **¿Qué hacemos, paso a paso,** cuando se pierde o daña la información?

> 💡 **Idea central de esta guía:** un backup que nunca se ha restaurado **no es un backup, es una esperanza**. Por eso aquí no solo vas a escribir el plan: vas a sacar una copia real de tu base de datos, borrarla a propósito y recuperarla.

Al terminar esta guía podrás:

- Explicar RPO, RTO, la regla 3-2-1 y los tipos de backup.
- Clasificar los datos de un sistema según su criticidad.
- Sacar un backup real de una base de datos PostgreSQL / Supabase.
- Restaurar ese backup y medir cuánto tardaste.
- Escribir procedimientos de recuperación que otra persona pueda seguir bajo presión.
- Diseñar un plan ante desastres con roles, comunicación y pruebas.

### Producto final

Vas a entregar **dos cosas**:

1. **El plan de respaldo y recuperación de tu propio proyecto**, con la estructura de 12 secciones del documento de referencia.
2. **La evidencia de un simulacro real**: capturas, comandos ejecutados y el tiempo que tardaste en recuperar tu base de datos.

> **Tema del proyecto:** usa el mismo sistema que trabajas en clase (debe tener base de datos con **mínimo 4 tablas** y datos de prueba).

---

## 2. Antes de empezar

### Conocimientos previos

| Tema | ¿Lo necesito? |
|------|---------------|
| SQL básico (`SELECT`, `INSERT`, `COUNT`, `JOIN`) | Sí |
| Terminal / línea de comandos | Sí |
| Proyecto con base de datos en Supabase o PostgreSQL | Sí |
| Git y GitHub | Sí |
| Bash (scripts `.sh`) | Recomendado |

### Herramientas

- Tu proyecto con base de datos en Supabase (cuenta gratuita).
- **Cliente de PostgreSQL** (`pg_dump`, `pg_restore`, `psql`):
  - Mac: `brew install libpq` y luego `brew link --force libpq`
  - Windows: instalador oficial de PostgreSQL (marca solo "Command Line Tools")
  - Linux: `sudo apt install postgresql-client`
- Un **segundo proyecto de Supabase** vacío, para restaurar ahí (nunca practiques restauraciones sobre tu base de datos principal).
- Un cronómetro.

> ⚠️ **Versión de `pg_dump`:** debe ser igual o mayor que la versión de PostgreSQL de tu proyecto en Supabase (la ves en *Project Settings → Infrastructure*). Si es menor, el comando falla.

### Estructura del documento que vas a construir

```
1. Objetivo y Alcance
2. Política de Respaldos
3. Estrategia de Respaldo
4. Tipos de Respaldo
5. Frecuencia y Retención
6. Procedimientos de Respaldo
7. Procedimientos de Restauración
8. Plan de Recuperación ante Desastres (DRP)
9. Pruebas de Recuperación
10. Monitoreo y Alertas
11. Roles y Responsabilidades
12. Costos y Recursos
+ Registro, control de versiones y aprobaciones
```

Cada sección de esta guía tiene la misma forma:

- 🎯 **Objetivo**: para qué sirve esa sección.
- 📚 **Conceptos clave**: lo que debes entender.
- 🔍 **Analiza el ejemplo**: qué observar en el documento de referencia.
- ✍️ **Tu turno**: lo que debes escribir o hacer en tu proyecto.
- ✅ **Lista de chequeo**: para revisar antes de pasar a la siguiente sección.

---

## 3. Encabezado del documento

```markdown
# 🛡️ PLAN DE RESPALDO Y RECUPERACIÓN DE DATOS
## [Nombre de tu sistema]

**Responsable técnico:** [tu nombre]
**Fecha de preparación:** [fecha]
**Versión:** 1.0
**Estado:** Borrador | En revisión | Aprobado
```

---

## Sección 1. Objetivo y Alcance

🎯 **Objetivo:** dejar claro **qué se protege, qué no, y qué tan rápido** se debe recuperar.

📚 **Conceptos clave**

| Concepto | Pregunta que responde | Ejemplo |
|----------|----------------------|---------|
| **RPO** (Recovery Point Objective) | ¿Cuántos datos puedo **perder** como máximo? | RPO de 1 hora: si todo falla, pierdo como mucho la última hora de trabajo |
| **RTO** (Recovery Time Objective) | ¿Cuánto tiempo puede estar el sistema **caído**? | RTO de 4 horas: en máximo 4 horas el sistema vuelve a funcionar |
| **Disponibilidad** | ¿Qué porcentaje del tiempo funciona? | 99,5 % al año ≈ 43 horas de caída permitidas |
| **Integridad** | ¿Los datos recuperados son correctos y completos? | Verificación con checksums y conteos |
| **Alcance** | ¿Qué entra y qué no entra en el plan? | Base de datos sí; computadores de los usuarios no |

```
         RPO                         RTO
  ◄───────────────►         ◄───────────────►
──┬────────────────┬─────────┬───────────────┬──►  tiempo
  │                │         │               │
Último           💥 FALLA    Empieza la    Sistema
backup                       recuperación  funcionando
```

🔍 **Analiza el ejemplo**

El plan EBS promete RPO de 1 hora y RTO de 4 horas. Más adelante (Sección 5) verás que el backup propio se hace cada 6 horas.

> **Pregunta para pensar:** si el backup propio es cada 6 horas, ¿qué tendría que ser cierto para cumplir un RPO de 1 hora? Investiga en la documentación de Supabase qué incluye realmente cada plan: ¿backups diarios? ¿PITR (*Point-in-Time Recovery*)? ¿Es gratis o un complemento de pago?

✍️ **Tu turno**

1. Escribe el objetivo general de tu plan en 2 o 3 líneas.
2. Define tu RPO y RTO **y justifícalos con el negocio**: ¿qué pasa si tu sistema pierde un día de datos? ¿Y una hora?
3. Lista qué incluye el plan (base de datos, imágenes, código, configuración) y qué no incluye.

✅ **Lista de chequeo**
- [ ] Mi RPO y RTO son **alcanzables** con las herramientas que de verdad uso.
- [ ] El alcance dice explícitamente qué queda por fuera.

---

## Sección 2. Política de Respaldos

🎯 **Objetivo:** fijar las **reglas generales** que guían todas las decisiones de respaldo.

📚 **Conceptos clave**

**Regla 3-2-1**

```
3 copias de los datos       → producción + 2 copias de seguridad
2 tipos de almacenamiento   → por ejemplo, Supabase + un disco o nube distinta
1 copia fuera del sitio     → en otro proveedor u otra región
```

**Criticidad de los datos:** no todos los datos valen lo mismo.

| Nivel | Qué pasa si se pierde | Ejemplos en EBS |
|-------|----------------------|-----------------|
| 🔴 Crítico | Pérdida de dinero o problema legal | Facturas, abonos |
| 🟡 Importante | Se puede reconstruir con esfuerzo | Productos, clientes |
| 🟢 Normal | Molesto, pero no grave | Configuración, logs |

**Responsabilidad compartida:** cuando usas servicios en la nube, el proveedor protege su infraestructura, pero **tú sigues siendo responsable de tus datos**. Si alguien borra una tabla por error, Supabase no lo va a deshacer por ti si no tienes un backup que te sirva.

🔍 **Analiza el ejemplo**

Observa la tabla de responsabilidad compartida del plan EBS: para cada componente dice **quién** hace el backup y **cada cuánto se verifica**.

✍️ **Tu turno**

1. Explica cómo cumple tu sistema la regla 3-2-1 (dónde está cada copia).
2. Clasifica **todas tus tablas** en crítico / importante / normal, con RPO, RTO y retención para cada nivel.
3. Haz tu tabla de responsabilidad compartida.

✅ **Lista de chequeo**
- [ ] Cada tabla de mi base de datos está clasificada.
- [ ] Tengo al menos una copia fuera de Supabase.

---

## Sección 3. Estrategia de Respaldo

🎯 **Objetivo:** mostrar **cómo se combinan** los distintos niveles de protección.

📚 **Conceptos clave**

- **Defensa en profundidad:** varias capas; si una falla, otra te protege.
- **Automático vs manual:** lo automático no se olvida; lo manual se usa antes de cambios riesgosos.
- **Backup de datos ≠ versionado de código:** GitHub guarda tu código, **no** los datos de tu base de datos.

🔍 **Analiza el ejemplo**

El plan EBS tiene 4 niveles: backups de Supabase, backup propio diario, copia off-site semanal y versionado de código en GitHub. Cada nivel tiene frecuencia, retención y tiempo de recuperación.

> **Pregunta para pensar:** si un estudiante dice "yo no necesito backups porque mi proyecto está en GitHub", ¿qué le responderías?

✍️ **Tu turno**

1. Dibuja tu estrategia por niveles (mínimo 3 niveles).
2. Para cada nivel indica: qué respalda, frecuencia, retención, dónde se guarda y tiempo estimado de recuperación.

✅ **Lista de chequeo**
- [ ] Ningún nivel depende solo de que "alguien se acuerde".
- [ ] Separé el respaldo del código del respaldo de los datos.

---

## Sección 4. Tipos de Respaldo

🎯 **Objetivo:** explicar **qué tipos de copia** usas y por qué.

📚 **Conceptos clave**

| Tipo | Qué copia | Ventaja | Desventaja |
|------|-----------|---------|------------|
| **Completo** | Todo | Se restaura solo, sin depender de otros | Ocupa más y tarda más |
| **Incremental** | Lo que cambió desde el **último backup (de cualquier tipo)** | Rápido y liviano | Para restaurar necesitas el completo + **todos** los incrementales en orden |
| **Diferencial** | Lo que cambió desde el **último completo** | Restaurar = completo + 1 diferencial | Crece cada día hasta el siguiente completo |
| **Snapshot** | Foto del disco en un instante | Restauración muy rápida | Depende del proveedor |
| **Lógico** | Datos exportados como SQL o JSON (`pg_dump`) | Portátil entre servidores y versiones | Más lento con bases grandes |
| **Físico** | Archivos internos de la base de datos | Muy rápido | Solo sirve en el mismo tipo de servidor |

```
Lun        Mar        Mié        Jue
COMPLETO   +inc(Mar)  +inc(Mié)  +inc(Jue)    ← Incremental: restaurar Jue = Lun + Mar + Mié + Jue
COMPLETO   +dif(Mar)  +dif(Mar-Mié) +dif(Mar-Jue) ← Diferencial: restaurar Jue = Lun + dif(Jue)
```

🔍 **Analiza el ejemplo**

El plan EBS propone esta consulta como backup incremental de facturas:

```sql
SELECT * FROM facturas WHERE created_at > [ULTIMO_BACKUP];
```

> **Pregunta para pensar:** si una factura vieja se **modifica** (por ejemplo, se anula) o se **elimina**, ¿este incremental lo captura? ¿Qué columna o qué tabla adicional necesitarías?

✍️ **Tu turno**

1. Elige qué tipos de backup usarás y justifica cada uno.
2. Lista exactamente qué tablas incluye tu backup completo (incluida la de usuarios, si aplica).
3. Si usas incrementales, explica cómo detectas registros **modificados y eliminados**, no solo los nuevos.

✅ **Lista de chequeo**
- [ ] Sé explicar la diferencia entre incremental y diferencial con un ejemplo.
- [ ] Mi backup incluye la estructura (tablas, índices, funciones, políticas) y no solo los datos.

---

## Sección 5. Frecuencia y Retención

🎯 **Objetivo:** definir **cuándo** se hace cada backup y **cuánto tiempo** se guarda.

📚 **Conceptos clave**

- **Ventana de backup:** horario de poco uso para no afectar a los usuarios (madrugada).
- **Retención:** cuánto tiempo se conserva cada copia antes de borrarla.
- **Esquema abuelo-padre-hijo:** diarios por semanas, semanales por meses, mensuales por años.
- **Retención legal:** en Colombia los documentos contables y las facturas deben conservarse por varios años. Investiga cuántos y cómo afecta tu plan.

🔍 **Analiza el ejemplo**

El plan EBS calcula el espacio necesario:

```
Base de datos: ~50 MB, crece 10 MB/mes
Diarios (30 × 50 MB) + Semanales (12 × 60 MB) + Mensuales (12 × 60 MB) ≈ 3 GB
```

> **Actividad:** revisa la cuenta. Si los semanales se guardan 90 días, ¿cuántos semanales hay al mismo tiempo, 12 o 52? ¿Y el tamaño, se queda en 60 MB todo el año si crece 10 MB al mes?

✍️ **Tu turno**

1. Haz el calendario semanal de tus backups.
2. Haz la tabla de retención por nivel de criticidad.
3. Calcula el espacio necesario para el primer año **con el tamaño real** de tu base de datos (consúltalo con la consulta de abajo).

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS tamano_bd;
```

✅ **Lista de chequeo**
- [ ] El tamaño de mi base de datos es real, no inventado.
- [ ] La retención de datos críticos cumple lo que exige la ley.

---

## Sección 6. Procedimientos de Respaldo  🧪 *Laboratorio*

🎯 **Objetivo:** escribir **paso a paso** cómo se saca cada backup, y **hacerlo de verdad**.

📚 **Conceptos clave**

| Herramienta | Para qué |
|-------------|----------|
| `pg_dump` | Exporta una base de datos PostgreSQL (estructura + datos) |
| `cron` | Programa tareas para que se ejecuten solas a cierta hora |
| `sha256sum` / `shasum -a 256` | Genera una "huella" del archivo para detectar si cambió o se dañó |
| `tar -czf` | Comprime archivos |
| Variables de entorno | Guardan contraseñas fuera del script |

### 🧪 Laboratorio 1: tu primer backup real

1. En Supabase ve a **Connect** (arriba en el panel) y copia la cadena de conexión de PostgreSQL. Usa la opción **Session pooler** si tu red no tiene IPv6.
2. Guarda la cadena en una variable de entorno (**nunca** dentro del script):

   ```bash
   export DB_URL="postgresql://postgres.[ref]:[CONTRASEÑA]@[host]:5432/postgres"
   ```

3. Saca el backup en formato personalizado (comprimido):

   ```bash
   FECHA=$(date +%Y-%m-%d_%H-%M)
   pg_dump "$DB_URL" --schema=public --no-owner -Fc -f "backup_$FECHA.dump"
   ```

4. Genera la huella del archivo:

   ```bash
   shasum -a 256 "backup_$FECHA.dump" > "backup_$FECHA.sha256"   # Mac
   sha256sum   "backup_$FECHA.dump" > "backup_$FECHA.sha256"     # Linux
   ```

5. Mira qué quedó dentro del backup (sin restaurarlo):

   ```bash
   pg_restore --list "backup_$FECHA.dump" | head -40
   ```

6. Anota: tamaño del archivo, cuánto tardó y cuántas tablas aparecen.

> 🔐 **Seguridad:** agrega `*.dump`, `*.sql` y `.env` a tu `.gitignore`. Un backup contiene **todos** los datos de tus usuarios; subirlo a GitHub es una fuga de información.

### 🕵️ Actividad: encuentra el error

El script de backup diario del plan EBS exporta cada tabla así:

```bash
curl -X GET "${SUPABASE_URL}/rest/v1/productos?select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  > productos.json
log "✓ Productos exportados: $(wc -l < productos.json) registros"
```

Investiga y responde:

1. El script usa la **anon key**. Si la tabla tiene RLS (Row Level Security) activado, ¿qué filas devuelve la API a un usuario anónimo? ¿El backup quedaría completo?
2. La API REST de Supabase tiene un **límite máximo de filas por respuesta**. ¿Cuál es por defecto? ¿Qué pasa con una tabla de 5.000 productos?
3. `wc -l` cuenta **líneas**. ¿Cuántas líneas tiene normalmente la respuesta JSON de la API? ¿El log muestra de verdad el número de registros?
4. Este método exporta solo datos en JSON. ¿Dónde quedan la estructura de las tablas, los índices, los triggers y las políticas RLS?
5. En el script incremental se llama a la función `log` y a la variable `SUPABASE_URL`, pero ninguna está definida en ese archivo. ¿Qué pasa al ejecutarlo?
6. **Seguridad:** el script real escribe la URL del proyecto directamente en el código. ¿Por qué no debe aparecer en un documento que se comparte?

Conclusión esperada: compara el método `curl` + JSON con `pg_dump` y escribe cuál usarías y por qué.

✍️ **Tu turno**

1. Escribe tu procedimiento de backup completo con los comandos reales que usaste.
2. Escribe un script `backup.sh` que haga los pasos del laboratorio y escriba un log con fecha, tamaño y resultado.
3. Programa tu script con `cron` (o explica cómo lo harías) y muestra la línea del crontab:

   ```bash
   # minuto hora día-mes mes día-semana  comando
   0 2 * * * /ruta/a/backup.sh >> /ruta/a/backup.log 2>&1
   ```

4. Escribe el procedimiento de **backup manual antes de un cambio riesgoso** (por ejemplo, antes de modificar una tabla).

✅ **Lista de chequeo**
- [ ] Tengo un archivo `.dump` real y su `.sha256`.
- [ ] Mi script no tiene contraseñas escritas dentro.
- [ ] Los backups no están en mi repositorio de GitHub.

---

## Sección 7. Procedimientos de Restauración  🧪 *Laboratorio*

🎯 **Objetivo:** escribir **cómo se recupera** la información en cada tipo de problema, y **comprobar que funciona**.

📚 **Conceptos clave**

- **Escenario de recuperación:** un problema concreto con su propio procedimiento (no es lo mismo una factura borrada que perder toda la base).
- **Restaurar en un ambiente de prueba primero:** nunca restaures directo sobre producción sin verificar.
- **Verificación posterior:** contar registros y revisar datos clave después de restaurar.
- **Rollback:** volver a la versión anterior después de una actualización fallida.

### 🧪 Laboratorio 2: restaura tu backup

> ⚠️ Hazlo en tu **segundo proyecto de Supabase**, el vacío. Nunca sobre el principal.

1. **Antes de empezar, cuenta tus registros en el proyecto principal** y guarda el resultado:

   ```sql
   SELECT 'productos' AS tabla, COUNT(*) FROM productos
   UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
   UNION ALL SELECT 'facturas', COUNT(*) FROM facturas;
   -- agrega todas tus tablas
   ```

2. Verifica la huella del backup:

   ```bash
   shasum -a 256 -c backup_FECHA.sha256   # Mac
   sha256sum -c backup_FECHA.sha256        # Linux
   ```

3. Inicia el cronómetro ⏱️ y restaura en el proyecto de prueba:

   ```bash
   export DB_PRUEBA="postgresql://postgres.[ref-prueba]:[CONTRASEÑA]@[host]:5432/postgres"
   pg_restore -d "$DB_PRUEBA" --no-owner --no-privileges backup_FECHA.dump
   ```

4. Repite el conteo del paso 1 en el proyecto de prueba. **Los números deben coincidir.**
5. Detén el cronómetro. Ese es tu **RTO real** para este escenario.
6. Revisa que las políticas RLS y los triggers también llegaron (en el panel: *Authentication → Policies* y *Database → Triggers*).

> Es normal que `pg_restore` muestre algunos avisos sobre objetos que ya existen en Supabase. Anótalos y explica en tu documento cuáles son importantes y cuáles no.

### 🕵️ Actividad: encuentra el error

1. En el escenario "tabla corrupta", el plan EBS pone la tabla "en solo lectura" así:

   ```sql
   CREATE POLICY "readonly" ON productos FOR ALL USING (false);
   ```

   Investiga: en PostgreSQL, cuando una tabla tiene **varias políticas permisivas**, ¿se combinan con AND o con OR? Si ya existía una política que permite editar, ¿esta nueva bloquea algo? Además, `FOR ALL` incluye `SELECT`: ¿sería "solo lectura" o "sin acceso"?

2. El mismo escenario ejecuta `TRUNCATE TABLE productos CASCADE;`. ¿Qué otras tablas se vaciarían por el `CASCADE`, si `detalles_factura` y `movimientos_inventario` tienen llaves foráneas hacia `productos`?

3. Los escenarios 3 y 4 usan `systemctl restart ebs-app` y `nginx`. Si la aplicación está publicada en **Vercel** (serverless), ¿esos comandos tienen sentido? ¿Cómo se hace realmente un rollback del frontend en Vercel?

✍️ **Tu turno**

Escribe **4 escenarios** de recuperación para tu sistema. Para cada uno: RPO, RTO, complejidad y pasos numerados con los comandos.

| # | Escenario sugerido |
|---|--------------------|
| 1 | Un usuario borró por error un registro importante |
| 2 | Una tabla quedó con datos dañados |
| 3 | Se perdió toda la base de datos |
| 4 | Una actualización de la aplicación salió mal y hay que volver atrás |

Al menos **uno** de los escenarios debe estar **probado** con el laboratorio 2, con capturas y el tiempo medido.

✅ **Lista de chequeo**
- [ ] Restauré mi backup y los conteos coinciden.
- [ ] Medí mi RTO real con cronómetro.
- [ ] Cada escenario termina con un paso de verificación.

---

## Sección 8. Plan de Recuperación ante Desastres (DRP)

🎯 **Objetivo:** definir **qué hace el equipo, en qué orden y quién avisa a quién** cuando ocurre algo grave.

📚 **Conceptos clave**

- **Desastre:** evento que deja el sistema fuera de servicio por más tiempo del permitido (define tu umbral).
- **Fases del DRP:** detección → activación y comunicación → recuperación → validación → post-mortem.
- **Comunicación:** el cliente debe saber qué pasó, cuánto va a tardar y qué datos podría perder.
- **Post-mortem:** reunión después del incidente para aprender, **sin buscar culpables**.
- **Ransomware:** ataque que cifra los datos y pide rescate. Por eso al menos una copia debe estar fuera del alcance de quien tiene acceso a producción.

🔍 **Analiza el ejemplo**

El plan EBS trae una plantilla de mensaje al cliente con: situación, tiempo estimado, último backup disponible y hora de la próxima actualización. Es un buen modelo: informa sin generar pánico.

> **Actividad:** en la validación del DRP, el plan EBS revisa la integridad así:
>
> ```sql
> SELECT f.id, f.cliente FROM facturas f
> LEFT JOIN clientes c ON f.cliente = c.nombre
> WHERE c.id IS NULL;
> ```
>
> Une facturas y clientes **por el nombre**. ¿Qué pasa si hay dos clientes con el mismo nombre, o si un cliente cambia de nombre? ¿Cómo se debería hacer con una llave foránea (`cliente_id`)?

✍️ **Tu turno**

1. Define qué es un "desastre" para tu sistema.
2. Lista 5 causas posibles con su probabilidad e impacto.
3. Escribe las 5 fases con acciones concretas y tiempos.
4. Redacta el mensaje que enviarías al cliente durante un desastre.
5. Escribe las consultas SQL de validación para **tu** base de datos (conteos, valores imposibles como stock negativo, registros huérfanos).

✅ **Lista de chequeo**
- [ ] Hay un responsable con nombre para cada fase.
- [ ] Mis consultas de validación usan llaves foráneas, no nombres.

---

## Sección 9. Pruebas de Recuperación  🧪 *Simulacro*

🎯 **Objetivo:** demostrar que el plan **funciona en la práctica** y entrenar al equipo.

📚 **Conceptos clave**

| Tipo de prueba | Qué comprueba | Frecuencia típica |
|----------------|---------------|-------------------|
| Verificación de integridad | El archivo de backup no está dañado | Semanal |
| Restauración de un registro o tabla | El procedimiento de un escenario funciona | Mensual |
| Simulacro completo | Todo el DRP, con tiempos reales | Semestral |

### 🧪 Simulacro final (en clase)

El docente anuncia: *"Su base de datos de producción desapareció. Recupérenla usando solo sus backups y su documento."*

1. Trabaja en parejas: **uno ejecuta, el otro solo lee el documento en voz alta**. El que ejecuta no puede improvisar: si un paso no está escrito, se anota como falla del documento.
2. Cronometren desde el anuncio hasta que la aplicación funciona contra la base restaurada.
3. Registren en una tabla cada paso, la hora y los problemas encontrados.
4. Comparen el tiempo real contra el RTO prometido en la Sección 1.

✍️ **Tu turno**

1. Escribe tu calendario de pruebas (qué, cada cuánto, quién, cuánto dura).
2. Escribe el procedimiento de la prueba mensual.
3. Entrega el **reporte del simulacro**: tiempos, problemas, si se cumplió el RTO y qué cambiaste en el documento después.

✅ **Lista de chequeo**
- [ ] Hice el simulacro y tengo el tiempo medido.
- [ ] Corregí el documento con lo que aprendí en el simulacro.

---

## Sección 10. Monitoreo y Alertas

🎯 **Objetivo:** **enterarte a tiempo** de que un backup falló, antes de necesitarlo.

📚 **Conceptos clave**

- **Falla silenciosa:** el backup "corre" todos los días pero genera archivos vacíos o incompletos y nadie se da cuenta. Es el peor caso.
- **Señales que se vigilan:** antigüedad del último backup, tamaño anormalmente pequeño, espacio en disco, acceso al almacenamiento externo.
- **Severidad:** no todas las alertas son igual de urgentes.

### 🕵️ Actividad: encuentra el error

El script de monitoreo del plan EBS tiene estos detalles. Investígalos:

1. Usa `stat -f %m` y `stat -f %z`. ¿Funciona igual en Mac que en Linux? ¿Cuál es el equivalente en Linux? *(Pista: `stat -c`.)*
2. Guarda en la variable `ESPACIO_LIBRE` el resultado de la columna `Use%` de `df`. ¿Ese número es el espacio libre o el usado? ¿La alerta funciona aunque el nombre esté mal?
3. En el backup off-site, el script compara la huella del archivo local con un `.sha256` que **se generó a partir de ese mismo archivo local**. ¿Eso demuestra que la copia en la nube está bien? ¿Cómo lo comprobarías de verdad?

✍️ **Tu turno**

1. Haz tu tabla de alertas: evento, severidad, acción y a quién se avisa.
2. Escribe un script sencillo que revise la antigüedad y el tamaño de tu último backup y muestre una alerta si algo está mal. Debe funcionar en **tu** sistema operativo.

✅ **Lista de chequeo**
- [ ] Mi monitoreo detecta un backup vacío, no solo uno que no se hizo.
- [ ] Probé mi script con un caso que debe disparar la alerta.

---

## Sección 11. Roles y Responsabilidades

🎯 **Objetivo:** que **nadie tenga dudas** sobre quién hace qué.

📚 **Conceptos clave**

**Matriz RACI**

| Letra | Significa | Pregunta |
|-------|-----------|----------|
| **R** (Responsible) | Responsable | ¿Quién lo **hace**? |
| **A** (Accountable) | Aprobador | ¿Quién **responde** si sale mal? Solo uno por tarea |
| **C** (Consulted) | Consultado | ¿A quién se le **pregunta** antes? |
| **I** (Informed) | Informado | ¿A quién se le **avisa** después? |

🔍 **Analiza el ejemplo**

> **Pregunta para pensar:** en la matriz EBS, el desarrollador es "R, A" en casi todo. ¿Qué riesgo hay si esa única persona se enferma o se va de vacaciones el día del desastre? ¿Cómo lo resolverías?

✍️ **Tu turno**

1. Haz la matriz RACI de tu plan (mínimo 6 actividades).
2. Haz la tabla de contactos de emergencia **con datos de ejemplo** (no pongas teléfonos ni correos reales en un documento de clase).
3. Define quién reemplaza al responsable principal.

✅ **Lista de chequeo**
- [ ] Cada actividad tiene exactamente una "A".
- [ ] Hay un suplente para el responsable principal.

---

## Sección 12. Costos y Recursos

🎯 **Objetivo:** mostrar **cuánto cuesta** proteger los datos, para que el cliente lo pueda aprobar.

📚 **Conceptos clave**

- **Costo de almacenamiento:** por GB al mes; las clases de almacenamiento "frío" son más baratas pero tardan más en recuperar.
- **Costo de transferencia:** subir datos suele ser gratis; **descargarlos** (justo cuando necesitas restaurar) puede costar.
- **Costo de no tener backup:** compáralo con lo que perdería el negocio.

✍️ **Tu turno**

1. Consulta los precios **actuales** de los servicios que usas (Supabase, Google Drive, AWS S3 u otro) y calcula el costo mensual y anual con el tamaño real de tu base.
2. Estima el costo para el negocio de perder un día de datos (ventas no registradas, tiempo para reconstruirlas).
3. Compara ambos números en un párrafo.

✅ **Lista de chequeo**
- [ ] Los precios tienen fecha de consulta y fuente.
- [ ] Usé el tamaño real de mi base de datos.

---

## Sección 13. Cierre del documento

Incluye al final:

1. **Tabla de registro de backups** (`control_backups`) o una hoja donde anotes cada backup: fecha, tipo, tamaño, huella, resultado.
2. **Lista de verificación mensual.**
3. **Control de versiones** del documento.
4. **Fecha de próxima revisión.**
5. **Tabla de aprobación:**

```markdown
| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Responsable técnico | [tu nombre] | ________ | __/__/____ |
| Compañero que ejecutó el simulacro | [nombre] | ________ | __/__/____ |
| Docente | Ing. Edwin Marín | ________ | __/__/____ |
```

---

## 4. Cronograma sugerido (3 semanas)

| Sesión | Tema | Entregable |
|--------|------|------------|
| 1 | RPO, RTO, regla 3-2-1, lectura del documento de referencia | Secciones 1 y 2 |
| 2 | Estrategia y tipos de backup | Secciones 3 y 4 |
| 3 | Frecuencia, retención y cálculo de espacio | Sección 5 |
| 4 | 🧪 Laboratorio 1: primer backup con `pg_dump` + "encuentra el error" | Sección 6 |
| 5 | 🧪 Laboratorio 2: restauración y RTO real | Sección 7 |
| 6 | Plan ante desastres y comunicación | Sección 8 |
| 7 | Monitoreo, alertas, roles y costos | Secciones 10, 11 y 12 |
| 8 | 🧪 Simulacro de desastre en parejas | Sección 9 + reporte |
| 9 | Correcciones después del simulacro y sustentación | Documento final |

---

## 5. Rúbrica de evaluación

| Criterio | Peso | Excelente (5) | Aceptable (3) | Insuficiente (1) |
|----------|------|---------------|---------------|------------------|
| **Backup real** | 15% | `.dump` + huella + script sin contraseñas + programado | Backup manual sin script | No hay backup real |
| **Restauración comprobada** | 20% | Restaurado en otro proyecto, conteos iguales, RTO medido | Restaurado sin verificar conteos | No se restauró |
| **Simulacro** | 15% | Ejecutado en pareja, reporte completo y documento corregido | Ejecutado sin reporte | No se hizo |
| **RPO / RTO y criticidad** | 10% | Justificados con el negocio y coherentes con la estrategia | Definidos sin justificación | Copiados o imposibles de cumplir |
| **Procedimientos** | 15% | 4 escenarios con pasos que otra persona puede seguir | Escenarios con pasos vagos | Menos de 2 escenarios |
| **Pensamiento crítico** | 10% | Resolvió todas las actividades "encuentra el error" | Resolvió algunas | No las resolvió |
| **DRP, roles y monitoreo** | 10% | Fases completas, RACI correcta, alertas probadas | Incompleto | Ausente |
| **Seguridad y presentación** | 5% | Sin datos reales expuestos, formato limpio | Errores menores | Contraseñas o backups en GitHub |

**Importante:** un plan con procedimientos que nunca se probaron tiene como nota máxima 3,0, sin importar qué tan bien esté escrito.

---

## 6. Consejos finales

- **Prueba tus backups.** Es la diferencia entre un plan y una ilusión.
- **Escribe para alguien estresado a las 3 de la mañana.** Pasos cortos, numerados, con el comando exacto.
- **Nunca practiques sobre producción.** Usa siempre un proyecto o base de prueba.
- **Los backups son datos sensibles.** Protégelos igual que la base de datos original.
- **Documenta lo que existe.** Si algo es una mejora futura, márcalo como "(Futuro)".
- **Actualiza el plan** cada vez que cambie tu sistema o después de cada simulacro.

### Recursos

- Supabase, backups: https://supabase.com/docs/guides/platform/backups
- Supabase, conexión a la base de datos: https://supabase.com/docs/guides/database/connecting-to-postgres
- PostgreSQL, `pg_dump`: https://www.postgresql.org/docs/current/app-pgdump.html
- PostgreSQL, `pg_restore`: https://www.postgresql.org/docs/current/app-pgrestore.html
- PostgreSQL, políticas RLS: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Crontab explicado: https://crontab.guru
