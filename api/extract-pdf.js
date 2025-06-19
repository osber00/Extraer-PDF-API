const pdf = require('pdf-parse');

export default async function handler(req, res) {
  // Configurar CORS para permitir requests desde n8n
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    // Validar que se envió el PDF
    if (!req.body || !req.body.pdf) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'PDF data is required in body.pdf field' 
      });
    }

    // Convertir base64 a buffer
    const buffer = Buffer.from(req.body.pdf, 'base64');
    
    // Validar que el buffer no esté vacío
    if (buffer.length === 0) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'PDF data appears to be empty' 
      });
    }

    // Extraer texto del PDF
    const data = await pdf(buffer);
    
    // Responder con los datos extraídos
    res.status(200).json({
      success: true,
      text: data.text,
      pages: data.numpages,
      info: {
        title: data.info?.Title || '',
        author: data.info?.Author || '',
        subject: data.info?.Subject || '',
        creator: data.info?.Creator || ''
      },
      metadata: {
        bufferSize: buffer.length,
        extractedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'PDF processing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}