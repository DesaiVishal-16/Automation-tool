import OpenAI from 'openai';
import fs from 'fs';

let openai;
let currentAssistantId = null;
let currentVectorStoreId = null;
let currentThreadId = null;
let currentFileId = null;

/**
 * Initialize OpenAI client
 * @param {string} apiKey - OpenAI API key
 */
export function initializeAssistants(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  openai = new OpenAI({ apiKey });
  console.log('[Assistant] OpenAI client initialized');
}

/**
 * Setup an Assistant with the uploaded PDF
 * This should be called once when a PDF is uploaded
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<{assistantId: string, vectorStoreId: string, threadId: string, fileId: string}>}
 */
export async function setupAssistant(filePath) {
  if (!openai) {
    throw new Error('OpenAI not initialized. Call initializeAssistants() first.');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    // Step 1: Upload file to OpenAI
    console.log('[Assistant] Uploading file to OpenAI...');
    const fileStream = fs.createReadStream(filePath);
    const file = await openai.files.create({
      file: fileStream,
      purpose: 'assistants',
    });
    currentFileId = file.id;
    console.log(`[Assistant] File uploaded successfully: ${file.id}`);

    // Step 2: Create a Vector Store
    console.log('[Assistant] Creating Vector Store...');
    const vectorStore = await openai.vectorStores.create({
      name: "RAG Demo Document Store",
      expires_after: {
        anchor: "last_active_at",
        days: 7
      }
    });
    currentVectorStoreId = vectorStore.id;
    console.log(`[Assistant] Vector Store created: ${vectorStore.id}`);

    // Step 3: Add file to Vector Store
    console.log('[Assistant] Adding file to Vector Store...');
    await openai.vectorStores.files.create(
      vectorStore.id,
      { file_id: file.id }
    );
    
    // Step 4: Poll until vector store is ready
    console.log('[Assistant] Waiting for Vector Store to process file...');
    let vsStatus = await openai.vectorStores.retrieve(vectorStore.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait
    
    while (vsStatus.status === 'in_progress' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      vsStatus = await openai.vectorStores.retrieve(vectorStore.id);
      attempts++;
    }
    
    if (vsStatus.status !== 'completed') {
      throw new Error(`Vector Store processing failed with status: ${vsStatus.status}`);
    }
    console.log(`[Assistant] Vector Store ready (${vsStatus.file_counts.completed} files processed)`);

    // Step 5: Create Assistant with file_search tool
    console.log('[Assistant] Creating Assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Education Automation Assistant",
      instructions: `You are an expert educational assistant. Your task is to help teachers automate their work based on the uploaded document.

Capabilities:
1. Generate high-quality Multiple Choice Questions (MCQs) with options and correct answers.
2. Provide comprehensive and structured summaries of lectures or lessons.
3. Create detailed assignment rubrics with clear criteria and levels of achievement.

Guidelines:
1. Always base your output strictly on the information from the uploaded document.
2. Be professional, accurate, and concise.
3. Format your responses clearly using Markdown (headers, bullet points, tables where appropriate).
4. If the document doesn't contain enough information for a specific task, inform the user clearly.`,
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      },
      temperature: 0.3, // Lower temperature for more consistent, factual responses
    });

    currentAssistantId = assistant.id;
    console.log(`[Assistant] Assistant created: ${assistant.id}`);

    // Step 6: Create a persistent thread for the conversation
    console.log('[Assistant] Creating conversation thread...');
    const thread = await openai.beta.threads.create();
    currentThreadId = thread.id;
    console.log(`[Assistant] Thread created: ${thread.id}`);
    
    return { 
      assistantId: assistant.id, 
      vectorStoreId: vectorStore.id,
      threadId: thread.id,
      fileId: file.id
    };
  } catch (error) {
    console.error('[Assistant] Setup failed:', error.message);
    // Cleanup partial resources if setup fails
    await cleanup();
    throw error;
  }
}

/**
 * Ask a question to the Assistant
 * Can be called multiple times after setup
 * @param {string} question - User's question
 * @returns {Promise<{answer: string, citations: Array<{index: number, quote: string, fileId: string}>}>}
 */
export async function askAssistant(question) {
  if (!openai) {
    throw new Error('OpenAI not initialized. Call initializeAssistants() first.');
  }
  
  if (!currentAssistantId || !currentThreadId) {
    throw new Error('Assistant not set up. Call setupAssistant() with a PDF first.');
  }

  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty');
  }

  let retryCount = 0;
  const maxRetries = 5;

  // 0. Cancel any active runs on this thread first
  try {
    const runs = await openai.beta.threads.runs.list(currentThreadId);
    for (const run of runs.data) {
      if (['in_progress', 'queued', 'requires_action'].includes(run.status)) {
        console.log(`[Assistant] Cancelling active run: ${run.id}`);
        await openai.beta.threads.runs.cancel(currentThreadId, run.id);
        // Wait a bit for cancellation to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (err) {
    console.warn('[Assistant] Failed to check/cancel active runs:', err.message);
  }

  while (retryCount <= maxRetries) {
    try {
      // 1. Add user's question to the thread
      console.log(`[Assistant] Adding question to thread (Attempt ${retryCount + 1})...`);
      await openai.beta.threads.messages.create(currentThreadId, {
        role: "user",
        content: question
      });

      // 2. Run the assistant
      console.log('[Assistant] Running assistant...');
      const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, {
        assistant_id: currentAssistantId,
      });

      console.log(`[Assistant] Run completed with status: ${run.status}`);
      
      if (run.status === 'completed') {
        // 3. Retrieve the latest message
        const messages = await openai.beta.threads.messages.list(currentThreadId, {
          limit: 1,
          order: 'desc'
        });
        
        const lastMessage = messages.data[0];
        if (!lastMessage || lastMessage.role !== 'assistant') {
          throw new Error('No assistant response found');
        }

        const textContent = lastMessage.content.find(c => c.type === 'text');
        if (!textContent || !textContent.text || !textContent.text.value) {
          console.warn('[Assistant] No text content in response:', JSON.stringify(lastMessage.content));
          return { answer: "The assistant processed the document but didn't return a text response. This can happen if the document content is restricted or unreadable.", citations: [] };
        }

        let answer = textContent.text.value;
        const rawCitations = textContent.text.annotations || [];
        const citations = [];
        
        // 4. Process annotations for citations
        for (let i = 0; i < rawCitations.length; i++) {
          const annotation = rawCitations[i];
          if (annotation.type === 'file_citation') {
            const fileId = annotation.file_citation.file_id;
            
            const citation = {
              index: i + 1,
              quote: annotation.file_citation.quote || 'Source text from document',
              fileId: fileId,
              pageNumber: 'Ref'
            };
            
            citations.push(citation);
            answer = answer.replace(annotation.text, ` [${i + 1}]`);
          }
        }

        console.log(`[Assistant] Successfully generated response (${answer.length} chars)`);
        return { answer, citations };
      } else {
        const errorMsg = run.last_error ? `${run.last_error.code}: ${run.last_error.message}` : run.status;
        
        // If the run itself failed due to rate limits
        if (errorMsg.includes('rate_limit_exceeded') && retryCount < maxRetries) {
          retryCount++;
          const waitTime = 30000; // Wait 30 seconds
          console.warn(`[Assistant] Run failed due to rate limit. Retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw new Error(`Assistant run failed: ${errorMsg}`);
      }
    } catch (error) {
      const isRateLimit = error.message.includes('rate_limit_exceeded') || 
                          (error.status === 429) ||
                          (error.code === 'rate_limit_exceeded');

      if (isRateLimit && retryCount < maxRetries) {
        retryCount++;
        const waitTime = 35000; // Wait 35 seconds for Free Tier
        console.warn(`[Assistant] Rate limit hit. Retrying in ${waitTime/1000}s... (Attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      console.error('[Assistant] Ask failed:', error.message);
      throw error;
    }
  }
}

/**
 * Get the conversation history from the current thread
 * @param {number} limit - Maximum number of messages to retrieve (default: 20)
 * @returns {Promise<Array<{role: string, content: string, timestamp: number}>>}
 */
export async function getConversationHistory(limit = 20) {
  if (!openai || !currentThreadId) {
    throw new Error('No active conversation thread');
  }

  try {
    const messages = await openai.beta.threads.messages.list(currentThreadId, {
      limit,
      order: 'desc'
    });

    return messages.data.map(msg => ({
      role: msg.role,
      content: msg.content[0]?.text?.value || '',
      timestamp: msg.created_at
    })).reverse(); // Return in chronological order
  } catch (error) {
    console.error('[Assistant] Failed to get conversation history:', error.message);
    throw error;
  }
}

/**
 * Reset the conversation while keeping the same assistant and document
 * @returns {Promise<string>} New thread ID
 */
export async function resetConversation() {
  if (!openai) {
    throw new Error('OpenAI not initialized');
  }

  if (!currentAssistantId) {
    throw new Error('No assistant to reset conversation for');
  }

  try {
    console.log('[Assistant] Resetting conversation...');
    const thread = await openai.beta.threads.create();
    currentThreadId = thread.id;
    console.log(`[Assistant] New conversation thread created: ${thread.id}`);
    return thread.id;
  } catch (error) {
    console.error('[Assistant] Reset conversation failed:', error.message);
    throw error;
  }
}

/**
 * Cleanup all resources
 * Call this when you're done with the assistant or want to upload a new document
 */
export async function cleanup() {
  if (!openai) {
    console.log('[Assistant] Nothing to cleanup');
    return;
  }

  const errors = [];

  try {
    // Delete assistant
    if (currentAssistantId) {
      try {
        await openai.beta.assistants.delete(currentAssistantId);
        console.log('[Assistant] Assistant deleted');
      } catch (err) {
        errors.push(`Failed to delete assistant: ${err.message}`);
      }
    }

    // Delete vector store (this also deletes associated file references)
    if (currentVectorStoreId) {
      try {
        await openai.vectorStores.delete(currentVectorStoreId);
        console.log('[Assistant] Vector Store deleted');
      } catch (err) {
        errors.push(`Failed to delete vector store: ${err.message}`);
      }
    }

    // Delete uploaded file
    if (currentFileId) {
      try {
        await openai.files.delete(currentFileId);
        console.log('[Assistant] File deleted');
      } catch (err) {
        errors.push(`Failed to delete file: ${err.message}`);
      }
    }

    // Note: Threads are automatically deleted after inactivity
    // but we can clear the reference
    if (currentThreadId) {
      console.log('[Assistant] Thread reference cleared (will auto-delete after inactivity)');
    }

  } catch (error) {
    errors.push(`Cleanup error: ${error.message}`);
  } finally {
    // Reset all state
    currentAssistantId = null;
    currentVectorStoreId = null;
    currentThreadId = null;
    currentFileId = null;
    
    if (errors.length > 0) {
      console.warn('[Assistant] Cleanup completed with errors:', errors);
    } else {
      console.log('[Assistant] Cleanup completed successfully');
    }
  }
}

/**
 * Get the current status of the assistant system
 * @returns {Object} Status information
 */
export function getStatus() {
  return {
    initialized: !!openai,
    hasAssistant: !!currentAssistantId,
    hasVectorStore: !!currentVectorStoreId,
    hasThread: !!currentThreadId,
    hasFile: !!currentFileId,
    assistantId: currentAssistantId,
    vectorStoreId: currentVectorStoreId,
    threadId: currentThreadId,
    fileId: currentFileId,
    ready: !!(openai && currentAssistantId && currentThreadId)
  };
}

/**
 * Check if the system is ready to answer questions
 * @returns {boolean}
 */
export function isReady() {
  return !!(openai && currentAssistantId && currentThreadId);
}