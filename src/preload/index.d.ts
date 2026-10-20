// Declares the global window.api type for the renderer.
import type { Api } from './index'

declare global {
  interface Window {
    api: Api
  }
}
