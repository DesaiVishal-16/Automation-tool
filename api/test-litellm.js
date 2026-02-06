import { chatCompletion, getModelInfo } from './openai/litellm.js';

async function testLiteLLM() {
  console.log('Model Info:', getModelInfo());

  const messages = [
    { role: 'user', content: 'What is 2+2?' }
  ];

  console.log('\nTesting LiteLLM with HuggingFace model...');
  const result = await chatCompletion(messages);

  if (result.success) {
    console.log('\nResponse:', result.answer);
  } else {
    console.error('Error:', result.error);
  }
}

testLiteLLM();
