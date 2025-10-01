// Jest DOM 拡張をインポート
import '@testing-library/jest-dom'

// TextEncoder/TextDecoder のポリフィル (Node.js 環境用)
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Next.js の環境変数をテスト環境に設定
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// console.error をモック（不要なエラーログを非表示）
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: useLayoutEffect does nothing on the server') ||
       args[0].includes('An update to') ||
       args[0].includes('Warning: useLayoutEffect'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Provide minimal Fetch API globals for both server/client test envs
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.body = init?.body
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map(Object.entries(init || {}))
    }

    get(name) {
      return this.map.get(name)
    }

    set(name, value) {
      this.map.set(name, value)
    }

    has(name) {
      return this.map.has(name)
    }
  }
}

if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map()
    }

    append(key, value) {
      this.data.set(key, value)
    }

    get(key) {
      return this.data.get(key)
    }

    has(key) {
      return this.data.has(key)
    }

    delete(key) {
      this.data.delete(key)
    }
  }
}

// DOM-specific mocks only in jsdom environment
if (typeof window !== 'undefined') {
  // window.matchMedia のモック
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // IntersectionObserver のモック
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null
    }
    disconnect() {
      return null
    }
    unobserve() {
      return null
    }
  }

  // ResizeObserver のモック
  global.ResizeObserver = class ResizeObserver {
    constructor(cb) {
      this.cb = cb
    }
    observe() {
      return null
    }
    unobserve() {
      return null
    }
    disconnect() {
      return null
    }
  }
}

// No additional Node-specific mocks required beyond fetch shims above
