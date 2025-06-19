# PDF Extractor API

API simple para extraer texto de archivos PDF, diseñada para funcionar con n8n.

## Endpoints

### POST /api/extract-pdf

Extrae texto de un archivo PDF enviado en formato base64.

**Request Body:**
```json
{
  "pdf": "base64_encoded_pdf_data"
}
```

**Response:**
```json
{
  "success": true,
  "text": "Texto extraído del PDF",
  "pages": 3,
  "info": {
    "title": "Título del documento",
    "author": "Autor",
    "subject": "Asunto",
    "creator": "Creador"
  },
  "metadata": {
    "bufferSize": 1234567,
    "extractedAt": "2025-06-19T15:30:00.000Z"
  }
}
```

## Uso con n8n

1. Configura un nodo HTTP Request
2. URL: `https://tu-proyecto.vercel.app/api/extract-pdf`
3. Method: POST
4. Headers: `Content-Type: application/json`
5. Body: `{"pdf": "{{ $binary.data.toString('base64') }}"}`

## Desarrollo Local

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run deploy
```