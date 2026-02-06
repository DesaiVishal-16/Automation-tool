# LiteLLM + HuggingFace Setup Guide

## 1. Install LiteLLM Proxy

```bash
pip install litellm[proxy]
```

## 2. Start LiteLLM Proxy Server

Create a `config.yaml` file:

```yaml
model_list:
  - model_name: moonshotai/Kimi-K2-Thinking
    litellm_params:
      model: huggingface/moonshotai/Kimi-K2-Thinking
      api_key: env:HF_TOKEN

general_settings: 
  master_key: "special-key-for-litellm"
```

Start the proxy:
```bash
export HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
litellm --config config.yaml
```

## 3. Update .env

Edit `/home/vishal/Documents/demo/automation-tool/api/.env`:
- Replace `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual HuggingFace token
- Get your token from: https://huggingface.co/settings/tokens

## 4. Use in Your Code

Import and use the litellm module:

```javascript
import { chatCompletion, getModelInfo } from './openai/litellm.js';

const messages = [
  { role: 'user', content: 'Hello, how are you?' }
];

const result = await chatCompletion(messages);
console.log(result.answer);
```
