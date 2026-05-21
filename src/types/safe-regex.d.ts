declare module 'safe-regex' {
  interface SafeRegexOptions {
    limit?: number
  }

  export default function safeRegex(pattern: string | RegExp, options?: SafeRegexOptions): boolean
}


