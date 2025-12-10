"""Enhanced transaction classifier with pattern matching and learning capabilities"""
import re
import logging
from typing import Dict, List, Optional, Tuple
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EnhancedTransactionClassifier:
    """
    Advanced classifier with:
    - Better keyword matching
    - Pattern-based classification
    - Confidence scoring
    - Multi-category support
    """

    CATEGORIES: List[Dict] = [
        {
            'id': 'salary',
            'label': 'Maaş',
            'keywords': ['maaş', 'salary', 'wage', 'ücret', 'bordro', 'maas', 'aylık', 'gelir', 'income'],
            'patterns': [r'\bmaa[şs]\b', r'\bsalary\b', r'\bbordro\b'],
            'type': 'income',
            'priority': 10
        },
        {
            'id': 'freelance',
            'label': 'Freelance',
            'keywords': ['freelance', 'serbest', 'danışmanlık', 'proje ödemesi', 'consultant', 'consulting'],
            'patterns': [r'\bfreelance\b', r'\bserbest\b', r'\bdanı[şs]manl[ıi]k\b'],
            'type': 'income',
            'priority': 9
        },
        {
            'id': 'investment',
            'label': 'Yatırım Geliri',
            'keywords': ['temettü', 'dividend', 'faiz', 'interest', 'kira geliri', 'rent income', 'yatırım'],
            'patterns': [r'\btemet[tü]ü\b', r'\bfaiz\b', r'\bkira\s+geliri\b'],
            'type': 'income',
            'priority': 8
        },
        {
            'id': 'market',
            'label': 'Market',
            'keywords': [
                'migros', 'carrefour', 'bim', 'a101', 'şok', 'sok', 'market', 'grocery',
                'macro', 'metro', 'file', 'carrefoursa', 'mm', 'migros jet', 'kipa',
                'real', 'auchan', 'dia', 'gratis', 'watsons'
            ],
            'patterns': [r'\bmigros\b', r'\bcarrefour\b', r'\bbim\b', r'\ba101\b', r'\b[şs]ok\b'],
            'type': 'expense',
            'priority': 9
        },
        {
            'id': 'restaurant',
            'label': 'Yemek',
            'keywords': [
                'restaurant', 'restoran', 'cafe', 'kahve', 'coffee', 'yemeksepeti',
                'getir', 'trendyol yemek', 'burger', 'pizza', 'starbucks', 'mcdonald',
                'kfc', 'popeyes', 'dominos', 'little caesars', 'sbarro', 'arby',
                'subway', 'kahveci', 'bistro', 'lokanta', 'aşçı', 'gurme'
            ],
            'patterns': [
                r'\brestaurant\b', r'\brestoran\b', r'\bcafe\b', r'\bkahve\b',
                r'\byemeksepeti\b', r'\bgetir\b', r'\bburger\b', r'\bpizza\b'
            ],
            'type': 'expense',
            'priority': 8
        },
        {
            'id': 'transport',
            'label': 'Ulaşım',
            'keywords': [
                'shell', 'opet', 'petrol', 'bp', 'total', 'benzin', 'fuel', 'motorin',
                'uber', 'taksi', 'taxi', 'metro', 'otobus', 'otobüs', 'bus', 'hgs', 'ogs',
                'bilet', 'thy', 'pegasus', 'anadolujet', 'sunexpress', 'onurair',
                'po', 'aytemiz', 'alpet', 'moil', 'akaryakıt', 'akaryakit',
                # İstanbulkart ve ulaşım kartları
                'istanbulkart', 'ankara kart', 'izmirim kart', 'kentkart', 
                'eskart', 'akbil', 'ulasim', 'ulaşım', 'kart yukleme', 'kart yükleme',
                # Toplu taşıma
                'iett', 'metrobus', 'tramvay', 'metro istasyonu', 'otogar',
                # Otopark
                'otopark', 'park yeri', 'vale', 'kat otopark',
                # Havayolu
                'ucak', 'uçak', 'havalimani', 'havalimanı', 'boarding', 'check-in'
            ],
            'patterns': [
                r'\bshell\b', r'\bopet\b', r'\bbenzin\b', r'\bhgs\b', r'\bogs\b',
                r'\btaksi\b', r'\bthy\b', r'\bpegasus\b', r'\bistanbulkart\b',
                r'\biett\b', r'\bmetro\b', r'\bula[şs][ıi]m\b', r'\botopark\b',
                r'\bkart\s*y[üu]kleme\b'
            ],
            'type': 'expense',
            'priority': 8
        },
        {
            'id': 'subscription',
            'label': 'Abonelik',
            'keywords': [
                'spotify', 'netflix', 'youtube', 'amazon prime', 'disney', 'apple',
                'hbo', 'exxen', 'blutv', 'gain', 'dazn', 'adobe', 'microsoft 365',
                'icloud', 'google one', 'chatgpt', 'openai', 'dropbox', 'zoom',
                'linkedin premium', 'github', 'notion', 'todoist', 'evernote'
            ],
            'patterns': [
                r'\bspotify\b', r'\bnetflix\b', r'\byoutube\b', r'\bamazon\s+prime\b',
                r'\bapple\b', r'\bexxen\b', r'\bblutv\b'
            ],
            'type': 'expense',
            'priority': 9
        },
        {
            'id': 'utilities',
            'label': 'Faturalar',
            'keywords': [
                'elektrik', 'su faturası', 'doğalgaz', 'dogalgaz', 'internet',
                'telefon', 'turkcell', 'vodafone', 'türk telekom', 'turk telekom',
                'enerjisa', 'başkent doğalgaz', 'igdaş', 'iski', 'aski', 'bedaş',
                'ayedaş', 'çedaş', 'gediz', 'aksa', 'ttnet', 'superonline'
            ],
            'patterns': [
                r'\belektrik\b', r'\bdo[ğg]algaz\b', r'\binternet\b', r'\btelefon\b',
                r'\bfatura\b'
            ],
            'type': 'expense',
            'priority': 10
        },
        {
            'id': 'health',
            'label': 'Sağlık',
            'keywords': [
                'eczane', 'pharmacy', 'hastane', 'hospital', 'klinik', 'clinic',
                'doktor', 'doctor', 'sağlık', 'health', 'medikal', 'medical',
                'diş', 'dental', 'göz', 'eye', 'optik', 'farmasi', 'rossmann',
                'laboratuvar', 'tahlil', 'muayene', 'reçete'
            ],
            'patterns': [
                r'\beczane\b', r'\bhastane\b', r'\bklinik\b', r'\bdoktor\b',
                r'\bdi[şs]\b', r'\boptik\b'
            ],
            'type': 'expense',
            'priority': 9
        },
        {
            'id': 'shopping',
            'label': 'Alışveriş',
            'keywords': [
                'trendyol', 'hepsiburada', 'amazon', 'n11', 'gittigidiyor',
                'lcw', 'defacto', 'zara', 'h&m', 'mavi', 'koton', 'boyner',
                'mediamarkt', 'teknosa', 'vatan', 'apple store', 'samsung',
                'ikea', 'english home', 'network', 'colin', 'lc waikiki',
                'marks spencer', 'mango', 'bershka', 'pull bear', 'stradivarius'
            ],
            'patterns': [
                r'\btrendyol\b', r'\bhepsiburada\b', r'\bamazon\b', r'\bn11\b',
                r'\bzara\b', r'\bikea\b'
            ],
            'type': 'expense',
            'priority': 7
        },
        {
            'id': 'education',
            'label': 'Eğitim',
            'keywords': [
                'udemy', 'coursera', 'linkedin learning', 'kitap', 'book',
                'eğitim', 'education', 'kurs', 'course', 'okul', 'school',
                'üniversite', 'university', 'd&r', 'idefix', 'kitapyurdu',
                'pandora', 'remzi', 'kolej', 'dershane', 'özel ders'
            ],
            'patterns': [
                r'\budemy\b', r'\bcoursera\b', r'\bkitap\b', r'\be[ğg]itim\b',
                r'\bokul\b', r'\bkurs\b'
            ],
            'type': 'expense',
            'priority': 8
        },
        {
            'id': 'entertainment',
            'label': 'Eğlence',
            'keywords': [
                'sinema', 'cinema', 'konser', 'concert', 'tiyatro', 'theater',
                'oyun', 'game', 'steam', 'playstation', 'xbox', 'nintendo',
                'biletix', 'passo', 'mobilet', 'cinemaximum', 'cinepolis',
                'cineplex', 'park', 'lunapark', 'aquapark'
            ],
            'patterns': [
                r'\bsinema\b', r'\bkonser\b', r'\btiyatro\b', r'\bsteam\b',
                r'\bbiletix\b'
            ],
            'type': 'expense',
            'priority': 7
        },
        {
            'id': 'rent',
            'label': 'Kira',
            'keywords': [
                'kira', 'rent', 'aidat', 'apartman', 'site aidatı', 'konut',
                'ev kirası', 'mesken', 'daire'
            ],
            'patterns': [
                r'\bkira\b', r'\baidat\b', r'\bapartman\b', r'\bsite\s+aidat\b'
            ],
            'type': 'expense',
            'priority': 10
        },
        {
            'id': 'transfer',
            'label': 'Transfer',
            'keywords': [
                'havale', 'eft', 'transfer', 'gönderim', 'para transferi', 'wire',
                'fast', 'swift', 'virman', 'aktarım'
            ],
            'patterns': [
                r'\bhavale\b', r'\beft\b', r'\btransfer\b', r'\bfast\b'
            ],
            'type': 'both',
            'priority': 5
        },
        {
            'id': 'atm',
            'label': 'ATM',
            'keywords': [
                'atm', 'nakit', 'cash', 'çekim', 'withdrawal', 'para çekme',
                'para yatırma', 'deposit'
            ],
            'patterns': [r'\batm\b', r'\bnakit\b', r'\b[çc]ekim\b'],
            'type': 'expense',
            'priority': 8
        },
        {
            'id': 'insurance',
            'label': 'Sigorta',
            'keywords': [
                'sigorta', 'insurance', 'poliçe', 'policy', 'kasko', 'trafik sigortası',
                'sağlık sigortası', 'hayat sigortası', 'dask', 'zorunlu trafik'
            ],
            'patterns': [r'\bsigorta\b', r'\bpoli[çc]e\b', r'\bkasko\b', r'\bdask\b'],
            'type': 'expense',
            'priority': 9
        },
        {
            'id': 'charity',
            'label': 'Bağış',
            'keywords': [
                'bağış', 'donation', 'sadaka', 'charity', 'yardım', 'help',
                'zekât', 'fitre', 'kurban'
            ],
            'patterns': [r'\bba[ğg][ıi][şs]\b', r'\bsadaka\b', r'\byardım\b'],
            'type': 'expense',
            'priority': 6
        },
        {
            'id': 'personal_care',
            'label': 'Kişisel Bakım',
            'keywords': [
                'kuaför', 'berber', 'güzellik', 'masaj', 'spa', 'salon',
                'kozmetik', 'makyaj', 'parfüm', 'tırnak', 'cilt bakım'
            ],
            'patterns': [
                r'\bkuaf[öo]r\b', r'\bberber\b', r'\bspa\b', r'\bsalon\b'
            ],
            'type': 'expense',
            'priority': 7
        },
        {
            'id': 'pet',
            'label': 'Evcil Hayvan',
            'keywords': [
                'petshop', 'veteriner', 'vet', 'kedi', 'köpek', 'pet',
                'hayvan', 'mama', 'kuş', 'akvaryum'
            ],
            'patterns': [r'\bpetshop\b', r'\bveteriner\b', r'\bvet\b', r'\bmama\b'],
            'type': 'expense',
            'priority': 7
        }
    ]

    def __init__(self):
        self._keyword_index: Dict[str, List[Dict]] = defaultdict(list)
        self._pattern_index: List[Tuple[re.Pattern, Dict]] = []

        # Build indexes for fast lookup
        for category in self.CATEGORIES:
            # Keyword index
            for keyword in category['keywords']:
                self._keyword_index[keyword.lower()].append({
                    'categoryId': category['id'],
                    'category': category['label'],
                    'type': category['type'],
                    'priority': category.get('priority', 5),
                    'keyword_length': len(keyword)
                })

            # Pattern index
            for pattern_str in category.get('patterns', []):
                pattern = re.compile(pattern_str, re.IGNORECASE)
                self._pattern_index.append((pattern, {
                    'categoryId': category['id'],
                    'category': category['label'],
                    'type': category['type'],
                    'priority': category.get('priority', 5)
                }))

        logger.info(f"Classifier initialized with {len(self.CATEGORIES)} categories")

    def classify(self, description: str, amount: Optional[float] = None) -> Dict:
        """
        Classify transaction with enhanced matching

        Args:
            description: Transaction description
            amount: Transaction amount (optional, for context)

        Returns:
            Dict with category, categoryId, confidence, type
        """
        if not description:
            return self._default_category()

        desc_lower = description.lower()
        matches = []

        # 1. Keyword matching
        for keyword, categories in self._keyword_index.items():
            if keyword in desc_lower:
                for cat_info in categories:
                    confidence = self._calculate_keyword_confidence(
                        keyword, desc_lower, cat_info
                    )
                    matches.append({
                        **cat_info,
                        'confidence': confidence,
                        'match_type': 'keyword'
                    })

        # 2. Pattern matching
        for pattern, cat_info in self._pattern_index:
            if pattern.search(desc_lower):
                confidence = self._calculate_pattern_confidence(desc_lower, cat_info)
                matches.append({
                    **cat_info,
                    'confidence': confidence,
                    'match_type': 'pattern'
                })

        # 3. Amount-based hints (optional enhancement)
        if amount is not None:
            matches = self._adjust_confidence_by_amount(matches, amount)

        # Select best match
        if matches:
            best_match = max(matches, key=lambda x: (x['confidence'], x['priority']))
            return {
                'categoryId': best_match['categoryId'],
                'category': best_match['category'],
                'confidence': min(98, best_match['confidence']),
                'type': best_match['type'],
                'match_type': best_match['match_type']
            }

        return self._default_category()

    def _calculate_keyword_confidence(
        self, keyword: str, description: str, cat_info: Dict
    ) -> float:
        """Calculate confidence score for keyword match"""
        base_confidence = 60

        # Longer keywords = higher confidence
        length_bonus = min(20, cat_info['keyword_length'] * 2)

        # Word boundary match = higher confidence
        word_boundary_bonus = 0
        if re.search(rf'\b{re.escape(keyword)}\b', description):
            word_boundary_bonus = 15

        # Priority bonus
        priority_bonus = cat_info['priority'] * 0.5

        total = base_confidence + length_bonus + word_boundary_bonus + priority_bonus
        return min(98, total)

    def _calculate_pattern_confidence(self, description: str, cat_info: Dict) -> float:
        """Calculate confidence score for pattern match"""
        base_confidence = 70
        priority_bonus = cat_info['priority'] * 0.8
        return min(98, base_confidence + priority_bonus)

    def _adjust_confidence_by_amount(
        self, matches: List[Dict], amount: float
    ) -> List[Dict]:
        """Adjust confidence based on typical amounts for categories"""
        # Define typical amount ranges for categories
        amount_profiles = {
            'utilities': (50, 500),
            'rent': (2000, 20000),
            'subscription': (10, 200),
            'market': (50, 1000),
            'restaurant': (50, 500),
            'transport': (50, 1000),
            'salary': (5000, 50000),
        }

        abs_amount = abs(amount)
        for match in matches:
            cat_id = match['categoryId']
            if cat_id in amount_profiles:
                min_amt, max_amt = amount_profiles[cat_id]
                if min_amt <= abs_amount <= max_amt:
                    match['confidence'] += 5
                elif abs_amount < min_amt * 0.5 or abs_amount > max_amt * 2:
                    match['confidence'] -= 5

        return matches

    def _default_category(self) -> Dict:
        """Return default category for unclassified transactions"""
        return {
            'categoryId': 'other',
            'category': 'Diğer',
            'confidence': 20,
            'type': 'expense',
            'match_type': 'default'
        }

    def classify_bulk(self, transactions: List[Dict]) -> List[Dict]:
        """Classify multiple transactions efficiently"""
        results = []
        for tx in transactions:
            description = tx.get('description', '')
            amount = tx.get('amount', None)
            classification = self.classify(description, amount)
            results.append({
                **tx,
                **classification
            })
        return results

    def get_categories(self) -> List[Dict]:
        """Get all available categories"""
        return self.CATEGORIES

    def get_category_by_id(self, category_id: str) -> Optional[Dict]:
        """Get category details by ID"""
        for cat in self.CATEGORIES:
            if cat['id'] == category_id:
                return cat
        return None
