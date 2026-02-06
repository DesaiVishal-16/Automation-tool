import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import pdf from 'pdf-parse';
import { chatCompletion } from './openai/litellm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('[Server] Environment loaded');
console.log('[Server] LITELLM_ENDPOINT:', process.env.LITELLM_ENDPOINT);
console.log('[Server] MODEL_ID:', process.env.MODEL_ID);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

let currentPDFInfo = null;
let currentPDFText = null;

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    pdfUploaded: currentPDFInfo !== null,
    hasExtractedText: !!currentPDFText,
    model: process.env.MODEL_ID || 'moonshotai/Kimi-K2-Thinking'
  });
});

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`\n[Upload] Processing PDF: ${req.file.originalname}`);
    const filePath = req.file.path;

    console.log('[Upload] Extracting text from PDF...');
    const dataBuffer = await fs.readFile(filePath);
    const pdfData = await pdf(dataBuffer);
    
    currentPDFText = pdfData.text;
    const numPages = pdfData.numpages;
    
    console.log(`[Upload] Extracted ${currentPDFText.length} characters from ${numPages} pages`);

    currentPDFInfo = {
      filename: req.file.originalname,
      uploadDate: new Date().toISOString(),
      numPages: numPages,
      textLength: currentPDFText.length
    };

    await fs.unlink(filePath);
    console.log('[Upload] PDF processed successfully\n');

    res.json({
      success: true,
      message: 'PDF processed successfully',
      info: {
        filename: currentPDFInfo.filename,
        uploadDate: currentPDFInfo.uploadDate,
        numPages: currentPDFInfo.numPages,
        numChunks: 1
      }
    });

  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
});

function truncateText(text, maxChars = 15000) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n\n[Note: Document truncated for processing]';
}

async function callLLM(messages, maxTokens = 2048) {
  const result = await chatCompletion(messages, {
    temperature: 0.3,
    max_tokens: maxTokens
  });
  
  if (!result.success) {
    throw new Error(result.error || 'LLM call failed');
  }
  
  return result.answer;
}

app.post('/mcq', async (req, res) => {
  try {
    if (!currentPDFText) {
      return res.status(400).json({ error: 'No PDF uploaded. Please upload a PDF first.' });
    }

    const language = req.body.language || 'english';
    const truncatedText = truncateText(currentPDFText);
    
    console.log('[MCQ] Generating MCQs...');

    const systemPrompt = `You are an expert educational assistant. Generate exactly 5 Multiple Choice Questions (MCQs) from the provided document.

Requirements:
1. Each question has 4 distinct options (A, B, C, D)
2. Clearly indicate the correct answer
3. Cover different parts of the document
4. Format output clearly with Markdown`;

    const userPrompt = `Generate 5 MCQs in ${language} from this document:\n\n${truncatedText}\n\nOutput in ${language} language.`;

    const answer = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    console.log('[MCQ] Generated successfully');
    res.json({ success: true, answer });

  } catch (error) {
    console.error('[MCQ] Error:', error);
    res.status(500).json({ error: 'Failed to generate MCQs', details: error.message });
  }
});

app.post('/summary', async (req, res) => {
  try {
    if (!currentPDFText) {
      return res.status(400).json({ error: 'No PDF uploaded. Please upload a PDF first.' });
    }

    const language = req.body.language || 'english';
    const truncatedText = truncateText(currentPDFText, 20000);
    
    console.log('[Summary] Generating summary...');

    const userPrompt = `Provide a comprehensive summary in ${language}:\n\n${truncatedText}\n\nInclude main topic, key points, important takeaways, and conclusions. Output in ${language} language.`;

    const answer = await callLLM([{ role: 'user', content: userPrompt }]);

    console.log('[Summary] Generated successfully');
    res.json({ success: true, answer });

  } catch (error) {
    console.error('[Summary] Error:', error);
    res.status(500).json({ error: 'Failed to generate summary', details: error.message });
  }
});

app.post('/rubric', async (req, res) => {
  try {
    if (!currentPDFText) {
      return res.status(400).json({ error: 'No PDF uploaded. Please upload a PDF first.' });
    }

    const language = req.body.language || 'english';
    const truncatedText = truncateText(currentPDFText);
    
    console.log('[Rubric] Creating rubric...');

    const userPrompt = `Create a detailed assignment rubric in ${language}:\n\n${truncatedText}\n\nInclude 4-5 criteria with Excellent/Good/Fair/Poor levels and point values. Output in ${language} language.`;

    const answer = await callLLM([{ role: 'user', content: userPrompt }]);

    console.log('[Rubric] Created successfully');
    res.json({ success: true, answer });

  } catch (error) {
    console.error('[Rubric] Error:', error);
    res.status(500).json({ error: 'Failed to create rubric', details: error.message });
  }
});

app.get('/current-pdf', (req, res) => {
  if (!currentPDFInfo) {
    return res.status(404).json({ error: 'No PDF currently loaded' });
  }
  res.json({ success: true, pdf: currentPDFInfo, hasExtractedText: !!currentPDFText });
});

app.post('/cleanup', async (req, res) => {
  try {
    currentPDFInfo = null;
    currentPDFText = null;
    console.log('[Cleanup] PDF data cleared');
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('[Cleanup] Error:', error);
    res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});

app.get('/status', (req, res) => {
  res.json({
    success: true,
    pdfUploaded: !!currentPDFInfo,
    hasExtractedText: !!currentPDFText,
    model: process.env.MODEL_ID || 'moonshotai/Kimi-K2-Thinking',
    liteLLMEndpoint: process.env.LITELLM_ENDPOINT || 'http://localhost:4000'
  });
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error', details: error.message });
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Education Automation Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🤖 Using LiteLLM with: ${process.env.MODEL_ID || 'moonshotai/Kimi-K2-Thinking'}`);
  console.log('='.repeat(50) + '\n');
});
