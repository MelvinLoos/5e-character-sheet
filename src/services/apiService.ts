function cleanSchemaForApi(schema: unknown): unknown {
  if (typeof schema !== 'object' || schema === null) {
    return schema
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => cleanSchemaForApi(item))
  }

  const newSchema: Record<string, unknown> = {}

  for (const key in schema) {
    if (key === '$schema' || key === 'errorMessage') {
      continue
    }

    const value = (schema as Record<string, unknown>)[key]

    if (key === 'type' && Array.isArray(value)) {
      const nonNullType = value.find((t) => t !== 'null')
      newSchema[key] = String(nonNullType || value[0]).toUpperCase()
    } else if (typeof value === 'object' && value !== null) {
      newSchema[key] = cleanSchemaForApi(value)
    } else {
      newSchema[key] = value
    }
  }

  return newSchema
}

export async function generateCharacterViaGemini(
  userPrompt: string,
  schema: object,
): Promise<object> {
  const cleanedSchema = cleanSchemaForApi(schema)

  const response = await fetch(`/.netlify/functions/generate-character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userPrompt, schema: cleanedSchema }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `API call failed with status: ${response.status} ${response.statusText} - ${errorText}`,
    )
  }

  const result = await response.json()

  if (
    result.candidates &&
    result.candidates.length > 0 &&
    result.candidates[0].content?.parts?.[0]?.text
  ) {
    const jsonText = result.candidates[0].content.parts[0].text
    return JSON.parse(jsonText)
  } else {
    throw new Error('Invalid response structure from Gemini API.')
  }
}
