# Mi Sueño Mexicano — Esquema de Base de Datos

## Tabla: `leads_cotizaciones`

### Datos de contacto
| Columna | Tipo | Descripción |
|---------|------|-------------|
| nombre_cliente | TEXT | Nombre completo del lead |
| telefono_cliente | TEXT | Teléfono principal |
| email_cliente | TEXT | Correo electrónico |
| whatsapp_principal | BOOLEAN | Si el teléfono es también su WhatsApp |
| notas | TEXT | Notas libres del usuario (opcional) |

### Snapshot de la Mesa de Diseño
| Columna | Tipo | Descripción |
|---------|------|-------------|
| tipo_sueno | TEXT | Tipo de propiedad (ej: "Lote habitacional") |
| ubicacion | TEXT | Desarrollo seleccionado (ej: "Tulum") |
| metros_cuadrados | INTEGER | Metros² configurados en el slider |
| porcentaje_enganche | NUMERIC | Decimal entre 0 y 1 (ej: 0.10 = 10%) |
| moneda | TEXT | "MXN" o "USD" — los montos se guardan en la moneda que eligió el usuario |

### Resultados financieros
| Columna | Tipo | Descripción |
|---------|------|-------------|
| monto_total | NUMERIC | metros_cuadrados × precio por m² (en la moneda elegida) |
| monto_enganche | NUMERIC | monto_total × porcentaje_enganche |
| monto_a_financiar | NUMERIC | monto_total - monto_enganche |
| mensualidad_estimada | NUMERIC | monto_a_financiar / meses_totales |
| plazo_tipo | TEXT | "contado", "20_años" o "30_años" |
| meses_totales | INTEGER | 0 (contado), 240 (20 años) o 360 (30 años) |

### Metadatos
| Columna | Tipo | Descripción |
|---------|------|-------------|
| idioma | TEXT | "es" o "en" — idioma del cotizador al momento de generar |
| ip_cliente | TEXT | IP pública capturada vía ipify.org |
| estatus | TEXT | "pendiente" (default) o "contactado" — se cambia desde el admin |
| folio_texto | TEXT | Generado automáticamente por trigger SQL (ej: "MSM-0001") |
| creado_en | TIMESTAMP | Fecha/hora de creación automática |

## Generación de folio

El `folio_texto` se genera mediante un trigger de PostgreSQL en Supabase que se ejecuta al insertar un nuevo registro. Formato: `MSM-XXXX` (secuencial).

## Estatus

| Valor | Significado |
|-------|-------------|
| `pendiente` | Lead nuevo, Alfonso no lo ha contactado |
| `contactado` | Alfonso ya se comunicó con el cliente |
