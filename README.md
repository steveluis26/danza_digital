# Registro Offline — Instituto de Danza Ma. del Carmen Montejo

Formulario HTML **100% offline** para tablet (sin conexión), que captura los datos del
alumno, salud, contactos y 4 firmas, y genera un **PDF multipágina** con los 4 documentos
legales íntegros:

1. Contrato de Prestación de Servicios Educativos (17 cláusulas)
2. Aviso de Privacidad
3. Anexo — Datos del Alumno (costos, datos médicos, contactos de emergencia)
4. Acuerdo DOF (Bases mínimas de información)

El archivo `registro_OFFLINE.html` es **autocontenido**: lleva el logo, jsPDF y
SignaturePad embebidos. No requiere servidor ni red.

## Cómo usarlo

1. Copia `registro_OFFLINE.html` a la tablet.
2. Ábrelo en Chrome/Edge (modo escritorio o tablet).
3. Llena los 3 pasos y firma en los recuadros.
4. Botón "Generar PDF": descarga `Apellido_Nombre_YYYY-MM-DD.pdf` y un JSON con los datos.

> Si el navegador cachea una versión vieja, recarga con **Cmd+Shift+R** (Mac) o
> Ctrl+Shift+R (Win/Linux).

## Desplegar en GitHub Pages

1. Sube este repo a `github.com/steveluis26/danza_digital`.
2. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch →
   Branch: `main` → `/root` → Save**.
3. La URL queda: `https://steveluis26.github.io/danza_digital/registro_OFFLINE.html`

## Pendiente (no implementado aún)

- Botón "Enviar por WhatsApp" (vía `navigator.share` adjuntando el PDF).
- Guardar el PDF en Google Drive.
