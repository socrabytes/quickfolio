# Google Gemini API Integration

## Overview

This document describes the implementation of Google's Gemini API for content generation in Quickfolio, replacing the initial OpenAI integration.

## Motivation

- **Cost Effectiveness**: Google Gemini API offers a free tier with generous limits (60 requests/minute)
- **No Credit Card Required**: Easier for developers and users to get started
- **Comparable Quality**: Gemini Pro model provides high-quality text generation similar to GPT models

## Implementation Details

### Dependencies

```python
# Old dependency
openai==1.12.0

# New dependency
google-generativeai==0.3.1
```

### Configuration Changes

```python
# Old configuration
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "500"))
OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))

# New configuration
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-pro")
GEMINI_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_TOKENS", "500"))
GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
```

### API Usage Differences

1. **Initialization**:
   ```python
   # OpenAI initialization
   openai.api_key = OPENAI_API_KEY

   # Gemini initialization 
   genai.configure(api_key=GEMINI_API_KEY)
   ```

2. **Model Configuration**:
   ```python
   # OpenAI parameters were passed with each call
   # Gemini uses a generation_config object
   self.generation_config = {
       "max_output_tokens": self.max_tokens,
       "temperature": self.temperature,
       "top_p": 0.95,
       "top_k": 40,
   }
   ```

3. **Content Generation**:
   ```python
   # OpenAI API call
   response = openai.chat.completions.create(
       model=self.model,
       messages=[
           {"role": "system", "content": system_prompt},
           {"role": "user", "content": user_prompt}
       ],
       max_tokens=self.max_tokens,
       temperature=self.temperature
   )
   return response.choices[0].message.content.strip()

   # Gemini API call
   model = genai.GenerativeModel(
       model_name=self.model,
       generation_config=self.generation_config,
   )
   prompt_parts = [system_prompt, user_prompt]
   response = model.generate_content(prompt_parts)
   return response.text.strip()
   ```

## Challenges and Solutions

### Prompt Structure
- **Challenge**: Gemini API doesn't have explicit system/user message roles like OpenAI
- **Solution**: Passed system prompt and user prompt as separate elements in an array

### Response Processing
- **Challenge**: Different response structure between APIs
- **Solution**: Used `response.text` instead of `response.choices[0].message.content`

### Error Handling
- Maintained same error-handling approach with fallback content
- Added specific model instantiation per method for better control

## Getting an API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a free account or sign in with Google
3. Click "Create API Key"
4. Copy the key to your `.env` file as `GEMINI_API_KEY=your_key_here`

## Performance Comparison

Initial testing shows comparable quality between OpenAI and Gemini for:
- Professional bios
- Project descriptions
- Skills summaries

Additional fine-tuning of prompts may be needed for optimal results.

## Future Improvements

- Add caching to reduce API calls
- Implement retry logic for rate limiting
- Create fallback to alternative models
- Add telemetry to track generation quality
