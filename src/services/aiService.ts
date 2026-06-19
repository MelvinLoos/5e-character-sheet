import { generateCharacterViaGemini } from './apiService'
import { logger } from '../utils/logger'

let _geminiSchema: object | null = null

export async function loadAiSchema(): Promise<object | null> {
  try {
    const response = await fetch('/gemini-schema.json')
    if (!response.ok) throw new Error('Network response was not ok for gemini-schema.json')
    _geminiSchema = await response.json()
    return _geminiSchema
  } catch (e) {
    logger.error('Error loading gemini-schema.json:', e)
    logger.warn('AI character generation will be disabled.')
    return null
  }
}

export function getAiSchema(): object | null {
  return _geminiSchema
}

export async function generateCharacter(userPrompt: string): Promise<{ data: object, valid: boolean, errors: string[] }> {
  if (!userPrompt) {
    throw new Error('Please describe the character you want to generate.')
  }
  
  if (!_geminiSchema) {
     throw new Error('Character schema is not loaded. AI generation is disabled.')
  }

  const generatedData = await generateCharacterViaGemini(userPrompt, _geminiSchema)
  // We'll return it and let the store determine if it's valid with the separate main schema, or we can use gemini-schema
  return { data: generatedData, valid: true, errors: [] } 
}
