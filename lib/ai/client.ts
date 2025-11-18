import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number; preferOpenAI?: boolean } = {}
): Promise<string> {
  // Prefer OpenAI for code generation (website building) if available
  if (options.preferOpenAI && process.env.OPENAI_API_KEY) {
    try {
      return await generateWithOpenAI(systemPrompt, userPrompt, options)
    } catch (error) {
      console.warn('OpenAI generation failed, falling back to Gemini:', error)
      // Fall through to Gemini
    }
  }

  // Use Gemini as default or fallback
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('No AI provider configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env.local file')
  }

  return generateWithGemini(systemPrompt, userPrompt, options)
}

async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables.')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Latest GPT-4 model - best for code generation (like Lovable uses)
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: options.maxTokens || 8000, // More tokens for complete websites
        temperature: options.temperature || 0.3, // Lower temperature for more consistent, production-ready code
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No content in OpenAI response')
    }
    
    return data.choices[0].message.content
  } catch (error: any) {
    console.error('OpenAI API call failed:', error)
    throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`)
  }
}

async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables. Please add it to your .env.local file.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  // Use Gemini 2.0 Flash - latest model with better performance
  const modelName = 'gemini-2.0-flash' // Gemini 2.0 Flash (generally available)
  
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7,
      },
      systemInstruction: systemPrompt, // Use system instruction for better context
    })

    const result = await model.generateContent(userPrompt)
    const response = await result.response
    
    if (!response.text) {
      throw new Error('No text response from Gemini API')
    }
    
    return response.text()
  } catch (error: any) {
    console.error('Gemini API call failed:', {
      model: modelName,
      error: error.message,
      status: error.status,
      statusText: error.statusText,
    })
    
    // Provide helpful error messages
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid GEMINI_API_KEY. Please check your API key in .env.local')
    }
    
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      throw new Error('API quota exceeded. Please check your Gemini API usage limits.')
    }
    
    if (error.message?.includes('model')) {
      throw new Error(`Model ${modelName} not available. Please check the model name.`)
    }
    
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`)
  }
}


