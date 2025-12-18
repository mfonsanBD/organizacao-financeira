/**
 * PWA Configuration
 * 
 * next-pwa não é compatível com Turbopack do Next.js 16.
 * Alternativas para PWA no Next.js 16:
 * 
 * 1. Usar Workbox diretamente (recomendado)
 * 2. Implementar service worker customizado
 * 3. Aguardar atualização do next-pwa para Turbopack
 * 
 * Para desenvolvimento inicial, focaremos em:
 * - manifest.json já configurado
 * - Service worker será implementado manualmente quando necessário
 * - IndexedDB (Dexie) já configurado para offline-first
 * 
 * A funcionalidade offline-first está garantida pelo IndexedDB,
 * o que é o mais crítico para o sistema.
 */

// TODO: Implementar service worker customizado usando Workbox
// Referência: https://developer.chrome.com/docs/workbox/
