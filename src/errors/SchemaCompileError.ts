type ErrorWithCaptureStackTrace = typeof Error & {
  captureStackTrace?: (target: object, ctor: unknown) => void
}
const ErrorCtor = Error as ErrorWithCaptureStackTrace

/**
 * SchemaCompileError — thrown when a JSON Schema cannot be compiled.
 */
export class SchemaCompileError extends Error {
  readonly name = 'SchemaCompileError' as const
  readonly code = 'SCHEMA_COMPILE_ERROR' as const
  readonly originalError: unknown
  readonly schema: unknown

  constructor(error: unknown, schema?: unknown) {
    const detail = error instanceof Error ? error.message : String(error)
    super(`Schema compilation failed: ${detail}`)
    this.originalError = error
    this.schema = schema

    if (ErrorCtor.captureStackTrace) {
      ErrorCtor.captureStackTrace(this, SchemaCompileError)
    }
  }

  toJSON(): {
    error: string
    code: string
    message: string
  } {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
    }
  }
}
