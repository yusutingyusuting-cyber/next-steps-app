/** One offered next step: the short text on its button, the prompt it fills. */
export type Suggestion = { label: string; prompt: string }

export type View =
  | { kind: 'hidden' }
  | { kind: 'loading'; turnId: string; answer: string }
  | { kind: 'offer'; items: Suggestion[]; answer: string }

declare module 'claude-code' {
  interface PluginState {
    'next-steps-app': { view: View }
  }
}
