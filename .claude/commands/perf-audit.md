---
description: Performans denetimi - Bundle size, lazy loading, caching
arguments:
  - name: target
    description: Hedef (frontend, backend, all)
    required: false
---

Performans Denetimi: $ARGUMENTS (varsayılan: tüm sistem)

## 1. Frontend Performans

### Bundle Analysis
- [ ] İlk yükleme JS boyutu < 200KB mi?
- [ ] Lazy loading kullanılıyor mu?
- [ ] Code splitting aktif mi?
- [ ] Tree shaking çalışıyor mu?

### Rendering
- [ ] Gereksiz re-render var mı?
- [ ] React.memo kullanılıyor mu?
- [ ] useMemo/useCallback doğru kullanılmış mı?
- [ ] Virtual scrolling büyük listeler için var mı?

### Assets
- [ ] Resimler optimize mi? (WebP, lazy load)
- [ ] Font loading optimize mi?
- [ ] Critical CSS inline mı?

### Caching
- [ ] SWR/React Query cache stratejisi doğru mu?
- [ ] staleTime değerleri uygun mu?
- [ ] Service Worker kullanılıyor mu?

## 2. Backend Performans

### Database
- [ ] N+1 query problemi var mı?
- [ ] Index'ler doğru tanımlanmış mı?
- [ ] Query timeout'lar var mı?
- [ ] Connection pooling aktif mi?

### API Response
- [ ] Gzip compression aktif mi?
- [ ] Response caching var mı?
- [ ] Rate limiting uygun mu?
- [ ] Pagination düzgün çalışıyor mu?

### Memory
- [ ] Memory leak riski var mı?
- [ ] Büyük object'ler stream ediliyor mu?
- [ ] Garbage collection optimize mi?

## 3. Network

### Request Optimization
- [ ] Batch API calls mümkün mü?
- [ ] GraphQL yerine REST uygun mu?
- [ ] WebSocket gereken yerde kullanılıyor mu?

### Headers
- [ ] Cache-Control header'lar doğru mu?
- [ ] ETag kullanılıyor mu?
- [ ] Compression header'lar var mı?

## 4. Monitoring

- [ ] Performance metrics endpoint'i var mı?
- [ ] Error tracking aktif mi?
- [ ] APM tool entegre mi?

## Analiz Komutları

```bash
# Bundle analizi
npm run build && npx source-map-explorer dist/**/*.js

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# API response time test
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/health
```

## Çıktı

```
📊 PERFORMANS RAPORU
━━━━━━━━━━━━━━━━━━━━

Frontend:
  Bundle Size: X KB (✅ / ⚠️)
  LCP: X.X s (✅ / ⚠️)
  FID: X ms (✅ / ⚠️)

Backend:
  Avg Response: X ms
  Cache Hit Rate: X%
  Memory Usage: X MB

Öneriler:
1. [Öncelik: Yüksek] ...
2. [Öncelik: Orta] ...
```
