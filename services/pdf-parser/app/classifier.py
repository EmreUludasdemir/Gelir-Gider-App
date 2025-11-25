"""Transaction classification utilities"""
from typing import Dict, List
import re


class TransactionClassifier:
    """Keyword-based transaction classifier"""

    CATEGORIES: List[Dict] = [
        {
            'id': 'salary',
            'label': 'Maaş',
            'keywords': ['maaş', 'salary', 'wage', 'ücret', 'bordro', 'maas'],
            'type': 'income'
        },
        {
            'id': 'freelance',
            'label': 'Freelance',
            'keywords': ['freelance', 'serbest', 'danışmanlık', 'proje ödemesi', 'consultant'],
            'type': 'income'
        },
        {
            'id': 'investment',
            'label': 'Yatırım Geliri',
            'keywords': ['temettü', 'dividend', 'faiz', 'interest', 'kira geliri', 'rent income'],
            'type': 'income'
        },
        {
            'id': 'market',
            'label': 'Market',
            'keywords': ['migros', 'carrefour', 'bim', 'a101', 'şok', 'sok', 'market', 'grocery',
                        'macro', 'metro', 'file', 'carrefoursa'],
            'type': 'expense'
        },
        {
            'id': 'restaurant',
            'label': 'Yemek',
            'keywords': ['restaurant', 'restoran', 'cafe', 'kahve', 'coffee', 'yemeksepeti',
                        'getir', 'trendyol yemek', 'burger', 'pizza', 'starbucks', 'mcdonald'],
            'type': 'expense'
        },
        {
            'id': 'transport',
            'label': 'Ulaşım',
            'keywords': ['shell', 'opet', 'petrol', 'bp', 'total', 'benzin', 'fuel',
                        'uber', 'taksi', 'taxi', 'metro', 'otobüs', 'bus', 'hgs', 'ogs',
                        'bilet', 'thy', 'pegasus', 'anadolujet'],
            'type': 'expense'
        },
        {
            'id': 'subscription',
            'label': 'Abonelik',
            'keywords': ['spotify', 'netflix', 'youtube', 'amazon prime', 'disney', 'apple',
                        'hbo', 'exxen', 'blutv', 'gain', 'dazn', 'adobe', 'microsoft 365',
                        'icloud', 'google one', 'chatgpt', 'openai'],
            'type': 'expense'
        },
        {
            'id': 'utilities',
            'label': 'Faturalar',
            'keywords': ['elektrik', 'su faturası', 'doğalgaz', 'dogalgaz', 'internet',
                        'telefon', 'turkcell', 'vodafone', 'türk telekom', 'turk telekom',
                        'enerjisa', 'başkent doğalgaz', 'igdaş', 'iski', 'aski'],
            'type': 'expense'
        },
        {
            'id': 'health',
            'label': 'Sağlık',
            'keywords': ['eczane', 'pharmacy', 'hastane', 'hospital', 'klinik', 'clinic',
                        'doktor', 'doctor', 'sağlık', 'health', 'medikal', 'medical',
                        'diş', 'dental', 'göz', 'eye', 'optik'],
            'type': 'expense'
        },
        {
            'id': 'shopping',
            'label': 'Alışveriş',
            'keywords': ['trendyol', 'hepsiburada', 'amazon', 'n11', 'gittigidiyor',
                        'lcw', 'defacto', 'zara', 'h&m', 'mavi', 'koton', 'boyner',
                        'mediamarkt', 'teknosa', 'vatan', 'apple store', 'samsung'],
            'type': 'expense'
        },
        {
            'id': 'education',
            'label': 'Eğitim',
            'keywords': ['udemy', 'coursera', 'linkedin learning', 'kitap', 'book',
                        'eğitim', 'education', 'kurs', 'course', 'okul', 'school',
                        'üniversite', 'university', 'd&r', 'idefix', 'kitapyurdu'],
            'type': 'expense'
        },
        {
            'id': 'entertainment',
            'label': 'Eğlence',
            'keywords': ['sinema', 'cinema', 'konser', 'concert', 'tiyatro', 'theater',
                        'oyun', 'game', 'steam', 'playstation', 'xbox', 'nintendo',
                        'biletix', 'passo', 'mobilet'],
            'type': 'expense'
        },
        {
            'id': 'rent',
            'label': 'Kira',
            'keywords': ['kira', 'rent', 'aidat', 'apartman', 'site aidatı', 'konut'],
            'type': 'expense'
        },
        {
            'id': 'transfer',
            'label': 'Transfer',
            'keywords': ['havale', 'eft', 'transfer', 'gönderim', 'para transferi', 'wire'],
            'type': 'both'
        },
        {
            'id': 'atm',
            'label': 'ATM',
            'keywords': ['atm', 'nakit', 'cash', 'çekim', 'withdrawal', 'para çekme'],
            'type': 'expense'
        },
    ]

    def __init__(self):
        # Keyword lookup için index oluştur
        self._keyword_index: Dict[str, Dict] = {}
        for category in self.CATEGORIES:
            for keyword in category['keywords']:
                self._keyword_index[keyword.lower()] = {
                    'categoryId': category['id'],
                    'category': category['label'],
                    'type': category['type'],
                    'keyword_length': len(keyword)
                }

    def classify(self, description: str) -> Dict:
        """
        Açıklamayı kategorize et.

        Args:
            description: İşlem açıklaması

        Returns:
            Dict with category, categoryId, confidence
        """
        desc_lower = description.lower()

        best_match = None
        best_confidence = 0

        # Keyword'leri uzunluğuna göre sırala (uzun olanlar önce)
        sorted_keywords = sorted(
            self._keyword_index.items(),
            key=lambda x: x[1]['keyword_length'],
            reverse=True
        )

        for keyword, category_info in sorted_keywords:
            if keyword in desc_lower:
                # Confidence hesapla
                # Uzun keyword = yüksek confidence
                # Tam eşleşme = daha yüksek confidence
                confidence = min(95, 60 + category_info['keyword_length'] * 3)

                # Tam kelime eşleşmesi kontrolü
                if re.search(rf'\b{re.escape(keyword)}\b', desc_lower):
                    confidence = min(98, confidence + 10)

                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match = category_info

        if best_match:
            return {
                'categoryId': best_match['categoryId'],
                'category': best_match['category'],
                'confidence': best_confidence,
                'type': best_match['type']
            }

        # Eşleşme bulunamadı
        return {
            'categoryId': 'other',
            'category': 'Diğer',
            'confidence': 20,
            'type': 'expense'
        }
