export const environment = {
  production: false,
  appName: 'Folio',
  appVersion: '1.0.0-dev',
  api: {
    baseUrl: 'http://localhost:8080/api/v1',
    timeout: 30000,
  },
  sync: {
    enabled: false,
    intervalMs: 60000,
    maxRetries: 3,
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
    maxResults: 50,
    minQueryLength: 2,
  },
  storage: {
    dbName: 'folio-library-dev',
    dbVersion: 1,
  },
};
