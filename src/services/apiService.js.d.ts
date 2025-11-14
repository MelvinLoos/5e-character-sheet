declare module '../services/apiService.js' {
  export function generateCharacterViaGemini(userPrompt: string, schema: object): Promise<object>
}
