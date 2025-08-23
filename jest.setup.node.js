// Jest setup for Node.js environment tests (Server Actions)

// TextEncoder/TextDecoder のポリフィル (Node.js 環境用)
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Next.js の環境変数をテスト環境に設定
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Request をモック（node-fetch を使用）
try {
  const nodeFetch = require('node-fetch')
  global.Request = nodeFetch.Request
  global.Response = nodeFetch.Response
  global.Headers = nodeFetch.Headers
  global.fetch = nodeFetch.default
} catch (error) {
  // node-fetch がない場合は簡単なモックを作成
  global.Request = class Request {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
  }
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
  }
  global.Headers = Map
  global.fetch = jest.fn()
}

// FormData のモック
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