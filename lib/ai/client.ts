import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('No AI provider configured. Please set GEMINI_API_KEY in your .env.local file')
  }

  return generateWithGemini(systemPrompt, userPrompt, options)
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


