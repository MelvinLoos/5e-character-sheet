// Schema validation helpers backed by Ajv (JSON Schema draft-07) and the
// ajv-errors plugin, which enables the custom `errorMessage` keywords used
// throughout schema.json to surface human-friendly validation messages.
import Ajv from 'ajv'
import type { ValidateFunction } from 'ajv'
import ajvErrors from 'ajv-errors'

// A single shared Ajv instance is reused across the app.
// - `allErrors: true` is required by ajv-errors so every failing keyword is
//   collected (and so multiple problems are reported at once).
// - `strict: false` keeps Ajv from throwing on schema-authoring conveniences
//   such as the `default` keyword present in schema.json.
const ajv = new Ajv({ allErrors: true, strict: false })
ajvErrors(ajv)

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// Compiled validators are cached per-schema object so we don't recompile the
// same schema on every validation call.
const validatorCache = new WeakMap<object, ValidateFunction>()

export function getValidator(schema: object): ValidateFunction {
  let validate = validatorCache.get(schema)
  if (!validate) {
    validate = ajv.compile(schema)
    validatorCache.set(schema, validate)
  }
  return validate
}

export function validateAgainstSchema(schema: object, data: unknown): ValidationResult {
  const validate = getValidator(schema)
  const valid = validate(data)

  if (valid) {
    return { valid: true, errors: [] }
  }

  const errorMessages = (validate.errors || [])
    .map((err) => err.message)
    .filter((message): message is string => Boolean(message))

  // De-duplicate so repeated keyword failures don't spam the error modal.
  return { valid: false, errors: [...new Set(errorMessages)] }
}

export { ajv }
