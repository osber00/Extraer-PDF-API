const pdf = require('pdf-parse');
const mammoth = require('mammoth');

export default async function handler(req, res) {
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
    // Validar datos
    if (!req.body || (!req.body.document && !req.body.pdf && !req.body.docx)) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Document data is required. Use "document", "pdf", or "docx" field',
        receivedKeys: Object.keys(req.body || {})
      });
    }

    // Obtener los datos del documento
    const documentData = req.body.document || req.body.pdf || req.body.docx;
    const documentType = req.body.type || 'auto'; // 'pdf', 'docx', 'auto'

    let buffer;
    try {
      buffer = Buffer.from(documentData, 'base64');
    } catch (base64Error) {
      return res.status(400).json({ 
        error: 'Base64 decode error',
        message: 'Invalid base64 data'
      });
    }
    
    if (buffer.length === 0) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Document data appears to be empty' 
      });
    }

    // Detectar tipo de archivo automáticamente
    let detectedType = documentType;
    if (documentType === 'auto') {
      const firstBytes = buffer.toString('ascii', 0, 4);
      const zipHeader = buffer.toString('hex', 0, 4);
      
      if (firstBytes === '%PDF') {
        detectedType = 'pdf';
      } else if (zipHeader === '504b0304' || zipHeader === '504b0506' || zipHeader === '504b0708') {
        detectedType = 'docx';
      } else {
        return res.status(400).json({
          error: 'Unknown file type',
          message: 'Could not detect if file is PDF or DOCX',
          firstBytes: firstBytes,
          zipHeader: zipHeader
        });
      }
    }

    let result;

    // Procesar según el tipo detectado
    if (detectedType === 'pdf') {
      const data = await pdf(buffer);
      result = {
        success: true,
        type: 'pdf',
        text: data.text,
        pages: data.numpages,
        info: data.info || {},
        metadata: {
          bufferSize: buffer.length,
          extractedAt: new Date().toISOString()
        }
      };
    } else if (detectedType === 'docx') {
      const textResult = await mammoth.extractRawText({ buffer: buffer });
      const htmlResult = await mammoth.convertToHtml({ buffer: buffer });
      
      result = {
        success: true,
        type: 'docx',
        text: textResult.value,
        html: htmlResult.value,
        warnings: textResult.messages.filter(m => m.type === 'warning'),
        errors: textResult.messages.filter(m => m.type === 'error'),
        metadata: {
          textLength: textResult.value.length,
          htmlLength: htmlResult.value.length,
          bufferSize: buffer.length,
          extractedAt: new Date().toISOString()
        }
      };
    } else {
      return res.status(400).json({
        error: 'Unsupported file type',
        message: `File type "${detectedType}" is not supported`
      });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Document processing error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Document processing failed',
      message: error.message
    });
  }
}