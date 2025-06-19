const mammoth = require('mammoth');

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted' 
    });
  }

  try {
    // Validar que se envió el documento Word
    if (!req.body || !req.body.docx) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Word document data is required in body.docx field',
        receivedKeys: Object.keys(req.body || {})
      });
    }

    // Convertir base64 a buffer
    let buffer;
    try {
      buffer = Buffer.from(req.body.docx, 'base64');
    } catch (base64Error) {
      return res.status(400).json({ 
        error: 'Base64 decode error',
        message: 'Invalid base64 data',
        details: base64Error.message
      });
    }
    
    if (buffer.length === 0) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Document data appears to be empty' 
      });
    }

    // Verificar que sea un archivo DOCX válido (ZIP signature)
    const zipHeader = buffer.toString('hex', 0, 4);
    if (zipHeader !== '504b0304' && zipHeader !== '504b0506' && zipHeader !== '504b0708') {
      return res.status(400).json({ 
        error: 'Invalid DOCX format',
        message: 'File does not appear to be a valid DOCX document',
        receivedHeader: zipHeader,
        expectedHeaders: ['504b0304', '504b0506', '504b0708']
      });
    }

    // Extraer texto del documento Word usando mammoth
    const result = await mammoth.extractRawText({ buffer: buffer });
    
    // Extraer también HTML para análisis más avanzado
    const htmlResult = await mammoth.convertToHtml({ buffer: buffer });
    
    // Responder con los datos extraídos
    res.status(200).json({
      success: true,
      text: result.value,
      html: htmlResult.value,
      warnings: result.messages.filter(m => m.type === 'warning'),
      errors: result.messages.filter(m => m.type === 'error'),
      metadata: {
        textLength: result.value.length,
        htmlLength: htmlResult.value.length,
        bufferSize: buffer.length,
        extractedAt: new Date().toISOString(),
        hasWarnings: result.messages.some(m => m.type === 'warning'),
        hasErrors: result.messages.some(m => m.type === 'error')
      }
    });

  } catch (error) {
    console.error('Word processing error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Word document processing failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}