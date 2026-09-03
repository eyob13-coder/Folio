export const environment = {
  production: true,
  appName: 'Folio',
  appVersion: '1.0.0',
  api: {
    baseUrl: '/api/v1',
    timeout: 30000,
  },
  sync: {
    enabled: true,
    intervalMs: 120000,
    maxRetries: 5,
  },
  ai: {
    ollamaBaseUrl: 'http://localhost:11434',
    embeddingModel: 'nomic-embed-text',
    chatModel: 'llama3.2',
    chunkSize: 512,
    chunkOverlap: 64,
    topK: 5,
  },
  search: {
    maxResults: 100,
    minQueryLength: 2,
  },
  storage: {
    dbName: 'folio-library',
    dbVersion: 1,
  },
};
