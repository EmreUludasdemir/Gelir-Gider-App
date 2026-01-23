---
description: API kontrat dokümantasyonu ve tutarlılık kontrolü
arguments:
  - name: module
    description: Modül adı (transactions, budgets, etc.) veya 'all'
    required: false
---

API Kontrat Analizi: $ARGUMENTS (varsayılan: tüm modüller)

## 1. Endpoint Envanteri

Her modül için şunları belirle:
- HTTP Method (GET, POST, PATCH, DELETE)
- Path pattern
- Query parametreleri
- Request body schema
- Response schema
- Auth gereksinimleri

## 2. Tutarlılık Kontrolü

### Naming Conventions:
- [ ] Plural resource names (transactions, budgets, NOT transaction)
- [ ] Kebab-case URL paths
- [ ] camelCase JSON fields
- [ ] Consistent ID field names (id, userId, etc.)

### HTTP Methods:
- [ ] GET: Read operations, idempotent
- [ ] POST: Create operations
- [ ] PATCH: Partial update (not PUT)
- [ ] DELETE: Remove operations

### Response Format:
```typescript
// Başarılı yanıt
{
  success: true,
  data: {...} | [...]
}

// Hatalı yanıt
{
  success: false,
  error: {
    code: "AUTH_001",
    message: "Kullanıcı doğrulaması başarısız",
    timestamp: "2024-01-15T10:00:00Z",
    path: "/auth/login"
  }
}
```

### Pagination:
- [ ] Limit/offset pattern tutarlı mı?
- [ ] Total count dönüyor mu?
- [ ] Default limit değeri var mı?

## 3. Error Codes

| Prefix | Domain | Examples |
|--------|--------|----------|
| AUTH_  | Auth   | AUTH_001, AUTH_002 |
| VAL_   | Valid  | VAL_001 |
| RES_   | Resource | RES_404 |
| TRX_   | Trans  | TRX_001 |
| DB_    | Database | DB_001 |

## 4. Security

- [ ] Tüm endpoint'ler JwtAuthGuard kullanıyor mu?
- [ ] Rate limiting aktif mi?
- [ ] Input validation (class-validator) var mı?
- [ ] SQL injection koruması var mı?

## 5. Dokümantasyon

Her endpoint için şu bilgileri çıkar:

```markdown
### GET /transactions
**Auth**: Required (Bearer Token)
**Rate Limit**: 100/min

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | no | Page number (default: 1) |
| limit | number | no | Items per page (default: 20) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 100.50,
      "type": "expense"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```
```

## Çıktı Formatı

Sonuçları şu formatta raporla:
1. **Endpoint Listesi**: Tablo halinde
2. **Tutarsızlıklar**: ⚠️ ile işaretle
3. **Eksik Doküman**: ❌ ile işaretle
4. **Öneriler**: Düzeltme önerileri
