"""Enhanced PDF parser with better error handling and OCR support"""
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dateutil import parser as date_parser
import pdfplumber
from pdfminer.high_level import extract_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EnhancedBankDetector:
    """Enhanced bank detection with confidence scores"""

    BANK_SIGNATURES = {
        'garanti': {
            'keywords': ['GARANTİ BBVA', 'GARANTI BBVA', 'garanti.com.tr', 'Garanti Bankası', 'Garanti BBVA'],
            'name': 'Garanti BBVA',
            'patterns': [r'GARANTI\s*BBVA', r'garanti\.com\.tr']
        },
        'isbank': {
            'keywords': ['TÜRKİYE İŞ BANKASI', 'İŞBANK', 'isbank.com.tr', 'İş Bankası', 'ISBANK'],
            'name': 'İş Bankası',
            'patterns': [r'İŞ\s*BANK', r'isbank\.com\.tr']
        },
        'yapikredi': {
            'keywords': ['YAPI KREDİ', 'YAPIKREDI', 'yapikredi.com.tr', 'Yapı ve Kredi', 'YAPI VE KREDİ'],
            'name': 'Yapı Kredi',
            'patterns': [r'YAP[IİI]\s*KRE[DİD]', r'yapikredi\.com']
        },
        'akbank': {
            'keywords': ['AKBANK', 'akbank.com', 'Akbank T.A.Ş', 'AKSİGORTA'],
            'name': 'Akbank',
            'patterns': [r'AKBANK', r'akbank\.com']
        },
        'ziraat': {
            'keywords': ['ZİRAAT BANKASI', 'ZIRAAT', 'ziraatbank.com.tr', 'T.C. Ziraat', 'Bankkart', 'BANKKART', 'ZİRAAT BANK'],
            'name': 'Ziraat Bankası',
            'patterns': [r'Z[İI]RAAT\s*BANK', r'BANKKART']
        },
        'qnb': {
            'keywords': ['QNB FİNANSBANK', 'QNB FINANSBANK', 'FINANSBANK', 'qnbfinansbank.com', 'QNB'],
            'name': 'QNB Finansbank',
            'patterns': [r'QNB\s*F[İI]NANS', r'qnbfinansbank']
        },
        'enpara': {
            'keywords': ['ENPARA', 'enpara.com', 'Enpara.com', 'ENPara'],
            'name': 'Enpara',
            'patterns': [r'ENPARA', r'enpara\.com']
        },
        'papara': {
            'keywords': ['PAPARA', 'papara.com', 'Papara'],
            'name': 'Papara',
            'patterns': [r'PAPARA', r'papara\.com']
        },
        'denizbank': {
            'keywords': ['DENİZBANK', 'DENIZBANK', 'denizbank.com', 'Denizbank'],
            'name': 'Denizbank',
            'patterns': [r'DEN[İI]ZBANK', r'denizbank\.com']
        },
        'halkbank': {
            'keywords': ['HALKBANK', 'HALK BANKASI', 'halkbank.com.tr', 'T.C. HALKBANK'],
            'name': 'Halkbank',
            'patterns': [r'HALKBANK', r'HALK\s*BANK']
        },
        'vakifbank': {
            'keywords': ['VAKIFBANK', 'VAKIF BANK', 'vakifbank.com.tr', 'VakıfBank'],
            'name': 'Vakıfbank',
            'patterns': [r'VAK[IİI]FBANK', r'VAK[IİI]F\s*BANK']
        },
        'kuveytturk': {
            'keywords': ['KUVEYT TÜRK', 'KUVEYTTURK', 'kuveytturk.com.tr', 'Kuveyt Türk'],
            'name': 'Kuveyt Türk',
            'patterns': [r'KUVEYT\s*T[ÜU]RK']
        },
        'teb': {
            'keywords': ['TEB', 'TÜRK EKONOMİ BANKASI', 'teb.com.tr', 'TEB BANK'],
            'name': 'TEB',
            'patterns': [r'\bTEB\b', r'T[ÜU]RK\s*EKONOM[İI]']
        },
        'ing': {
            'keywords': ['ING BANK', 'ING TURKEY', 'ing.com.tr', 'ING'],
            'name': 'ING Bank',
            'patterns': [r'\bING\s*BANK', r'ing\.com\.tr']
        },
        'hsbc': {
            'keywords': ['HSBC', 'hsbc.com.tr', 'HSBC BANK'],
            'name': 'HSBC',
            'patterns': [r'\bHSBC\b', r'hsbc\.com']
        },
        'odeabank': {
            'keywords': ['ODEABANK', 'ODEA BANK', 'odeabank.com.tr'],
            'name': 'Odeabank',
            'patterns': [r'ODEA\s*BANK', r'odeabank\.com']
        },
        'albaraka': {
            'keywords': ['ALBARAKA', 'ALBARAKA TÜRK', 'albaraka.com.tr'],
            'name': 'Albaraka Türk',
            'patterns': [r'ALBARAKA', r'albaraka\.com']
        },
        'sekerbank': {
            'keywords': ['ŞEKERBANK', 'SEKERBANK', 'sekerbank.com.tr'],
            'name': 'Şekerbank',
            'patterns': [r'[SŞ]EKERBANK', r'sekerbank\.com']
        },
        'turkishbank': {
            'keywords': ['TURKISH BANK', 'TURKISHBANK'],
            'name': 'Turkish Bank',
            'patterns': [r'TURKISH\s*BANK']
        },
        'anadolubank': {
            'keywords': ['ANADOLUBANK', 'ANADOLU BANK', 'anadolubank.com.tr'],
            'name': 'Anadolubank',
            'patterns': [r'ANADOLU\s*BANK']
        },
        'fibabanka': {
            'keywords': ['FIBABANKA', 'FIBA BANK', 'fibabanka.com.tr'],
            'name': 'Fibabanka',
            'patterns': [r'FIBA\s*BANK']
        },
        'alternatifbank': {
            'keywords': ['ALTERNATİF BANK', 'ALTERNATIFBANK', 'ABANK'],
            'name': 'Alternatif Bank',
            'patterns': [r'ALTERNAT[İI]F\s*BANK', r'\bABANK\b']
        }
    }

    @classmethod
    def detect(cls, text: str) -> Tuple[Optional[str], Optional[str], float]:
        """
        Detect bank from text with confidence score

        Returns:
            (bank_id, bank_name, confidence)
        """
        if not text:
            return None, None, 0.0

        text_upper = text.upper()
        best_match = (None, None, 0.0)

        for bank_id, info in cls.BANK_SIGNATURES.items():
            confidence = 0.0

            # Check keywords
            keyword_matches = sum(1 for kw in info['keywords'] if kw.upper() in text_upper)
            if keyword_matches > 0:
                confidence = min(100, 40 + (keyword_matches * 20))

            # Check regex patterns
            pattern_matches = 0
            for pattern in info.get('patterns', []):
                if re.search(pattern, text_upper):
                    pattern_matches += 1

            if pattern_matches > 0:
                confidence = max(confidence, min(100, 50 + (pattern_matches * 25)))

            if confidence > best_match[2]:
                best_match = (bank_id, info['name'], confidence)

        return best_match


class EnhancedPDFParser:
    """Enhanced PDF parser with improved error handling and validation"""

    # Turkish month names
    TURKISH_MONTHS = {
        'ocak': '01', 'şubat': '02', 'mart': '03', 'nisan': '04',
        'mayıs': '05', 'haziran': '06', 'temmuz': '07', 'ağustos': '08',
        'eylül': '09', 'ekim': '10', 'kasım': '11', 'aralık': '12',
        'aralik': '12', 'subat': '02', 'mayis': '05', 'agustos': '08',
        'eylul': '09', 'kasim': '11'
    }

    # Date patterns
    DATE_PATTERNS = [
        r'(\d{2}/\d{2}/\d{4})',
        r'(\d{2}\.\d{2}\.\d{4})',
        r'(\d{4}-\d{2}-\d{2})',
        r'(\d{1,2}\s+\w+\s+\d{4})',
        r'(\d{2}/\d{2}/\d{2})',
        r'(\d{2}\.\d{2}\.\d{2})',
    ]

    # Amount patterns
    AMOUNT_PATTERNS = [
        r'([-+]?\d{1,3}(?:\.\d{3})*,\d{2})',
        r'([-+]?\d+\.\d{2})',
        r'([-+]?\d+,\d{2})',
    ]

    # Skip keywords
    SKIP_KEYWORDS = [
        'sayfa', 'page', 'bakiye', 'balance', 'hesap özeti', 'account statement',
        'kart limiti', 'müşteri numarası', 'hesap kesim', 'son ödeme tarihi',
        'nakit avans', 'asgari ödeme', 'toplam bankkart', 'dönem borcu',
        'kullanılabilir', 'sonraki hesap', 'sonraki son', 'bugüne kadar',
        'ekstre', 'sayın', 'toplam borç', 'toplam alacak'
    ]

    def __init__(self):
        self.date_patterns = [re.compile(p, re.IGNORECASE) for p in self.DATE_PATTERNS]
        self.amount_patterns = [re.compile(p, re.IGNORECASE) for p in self.AMOUNT_PATTERNS]
        self.stats = {
            'total_lines': 0,
            'skipped_lines': 0,
            'parsed_transactions': 0,
            'failed_parses': 0
        }

    def extract_transactions(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract transactions from PDF using multiple methods with enhanced error handling
        """
        logger.info(f"Starting PDF extraction: {pdf_path}")
        transactions = []
        errors = []

        try:
            # Method 1: pdfplumber line-by-line
            try:
                pdfplumber_txs = self._extract_with_pdfplumber(pdf_path)
                if pdfplumber_txs:
                    logger.info(f"pdfplumber found {len(pdfplumber_txs)} transactions")
                    transactions.extend(pdfplumber_txs)
            except Exception as e:
                logger.error(f"pdfplumber extraction failed: {e}")
                errors.append(f"pdfplumber error: {str(e)}")

            # Method 2: Table extraction (if few transactions found)
            if len(transactions) < 3:
                try:
                    table_txs = self._extract_from_tables(pdf_path)
                    if table_txs:
                        logger.info(f"Table extraction found {len(table_txs)} transactions")
                        existing_keys = {self._tx_key(t) for t in transactions}
                        for tx in table_txs:
                            if self._tx_key(tx) not in existing_keys:
                                transactions.append(tx)
                                existing_keys.add(self._tx_key(tx))
                except Exception as e:
                    logger.error(f"Table extraction failed: {e}")
                    errors.append(f"Table extraction error: {str(e)}")

            # Method 3: Fallback text extraction
            if len(transactions) < 3:
                try:
                    text_txs = self._extract_from_text(pdf_path)
                    logger.info(f"Text extraction found {len(text_txs)} transactions")
                    existing_keys = {self._tx_key(t) for t in transactions}
                    for tx in text_txs:
                        if self._tx_key(tx) not in existing_keys:
                            transactions.append(tx)
                            existing_keys.add(self._tx_key(tx))
                except Exception as e:
                    logger.error(f"Text extraction failed: {e}")
                    errors.append(f"Text extraction error: {str(e)}")

            # Sort by date (newest first)
            transactions.sort(key=lambda x: x.get('date', ''), reverse=True)

            # Add metadata
            for tx in transactions:
                tx['extraction_errors'] = errors if errors else None

            logger.info(f"Total transactions extracted: {len(transactions)}")
            logger.info(f"Statistics: {self.stats}")

            return transactions

        except Exception as e:
            logger.error(f"Critical error in extract_transactions: {e}", exc_info=True)
            raise

    def _tx_key(self, tx: Dict[str, Any]) -> Tuple:
        """Generate unique key for transaction deduplication"""
        return (
            tx.get('date', ''),
            tx.get('amount', 0),
            tx.get('description', '')[:30]
        )

    def _extract_with_pdfplumber(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract using pdfplumber with enhanced parsing"""
        transactions = []
        seen_lines = set()

        with pdfplumber.open(pdf_path) as pdf:
            # Detect bank
            first_page_text = pdf.pages[0].extract_text() or ""
            bank_id, bank_name, confidence = EnhancedBankDetector.detect(first_page_text)
            logger.info(f"Detected bank: {bank_name or 'Unknown'} (confidence: {confidence:.1f}%)")

            # Extract text from all pages
            full_text = ""
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"

            # Process line by line
            lines = full_text.split('\n')
            self.stats['total_lines'] = len(lines)

            for line in lines:
                line = line.strip()
                if not line or len(line) < 15:
                    continue

                # Skip duplicate lines
                if line in seen_lines:
                    continue
                seen_lines.add(line)

                # Check if line starts with date
                if not re.match(r'^\d{2}[/\.]\d{2}[/\.]\d{4}', line):
                    continue

                tx = self._parse_credit_card_line(line, bank_id)
                if tx:
                    transactions.append(tx)
                    self.stats['parsed_transactions'] += 1
                else:
                    self.stats['failed_parses'] += 1

        return transactions

    def _parse_credit_card_line(self, line: str, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse credit card statement line with enhanced validation"""
        try:
            # Extract date
            date_match = re.match(r'^(\d{2}[/\.]\d{2}[/\.]\d{4})', line)
            if not date_match:
                return None

            date_str = date_match.group(1)
            date = self._parse_date(date_str)
            if not date:
                return None

            rest = line[len(date_str):].strip()
            
            # Enhanced amount extraction - look for both positive and negative amounts
            # Handle patterns like: "1.234,56", "1234.56", "1,234.56", "-1.234,56"
            amount_patterns = [
                r'(-?\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|₺)?(?:\s+)?(?:G|C)?$',  # Turkish: 1.234,56
                r'(-?\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:TL|₺)?(?:\s+)?(?:G|C)?$',  # English: 1,234.56
                r'(-?\d+,\d{2})\s*(?:TL|₺)?(?:\s+)?(?:G|C)?$',                  # Simple: 1234,56
                r'(-?\d+\.\d{2})\s*(?:TL|₺)?(?:\s+)?(?:G|C)?$',                 # Simple: 1234.56
            ]
            
            amount = None
            description = rest
            is_expense = True
            
            for pattern in amount_patterns:
                match = re.search(pattern, rest)
                if match:
                    amount_str = match.group(1)
                    # Check for income/expense indicators at end of line
                    line_end = rest[match.end():].strip()
                    if 'G' in line_end.upper():  # Gelir (Income)
                        is_expense = False
                    elif 'C' in line_end.upper():  # Çıkış (Expense)  
                        is_expense = True
                    
                    # Convert amount string to float
                    # Handle both Turkish (1.234,56) and English (1,234.56) formats
                    if ',' in amount_str and '.' in amount_str:
                        if amount_str.rindex(',') > amount_str.rindex('.'):
                            # Turkish format: 1.234,56
                            amount = float(amount_str.replace('.', '').replace(',', '.'))
                        else:
                            # English format: 1,234.56
                            amount = float(amount_str.replace(',', ''))
                    elif ',' in amount_str:
                        # Assume Turkish format: 1234,56
                        amount = float(amount_str.replace(',', '.'))
                    else:
                        # English format or no decimal: 1234.56 or 1234
                        amount = float(amount_str)
                    
                    # Get description (everything before amount)
                    description = rest[:match.start()].strip()
                    break
            
            if amount is None or amount == 0:
                return None
            
            # Clean description
            description = re.sub(r'\s+', ' ', description).strip()
            if len(description) < 3:
                return None
            
            # Filter unwanted transactions
            desc_lower = description.lower()
            skip_phrases = [
                'bankkart lira ile ödeme', 'troy kampanyası',
                'önceki aydan devir', 'bankkart lira ile',
                'son ödeme tarihi', 'nakit avans limiti',
                'hesap özeti', 'ekstre', 'toplam'
            ]
            if any(phrase in desc_lower for phrase in skip_phrases):
                return None
            
            # Apply description cleaning
            description = self._clean_description(description)
            
            if not description or len(description) < 3:
                return None

            tx_type = 'expense' if is_expense else 'income'

            return {
                'date': date,
                'description': description,
                'amount': amount,
                'type': tx_type,
                'currency': 'TRY',
                'raw_line': line[:200],
                'bank': bank_id,
                'confidence': 85.0
            }

        except Exception as e:
            logger.debug(f"Parse line error: {e} - Line: {line[:50]}...")
            return None

    def _clean_description(self, description: str) -> str:
        """Clean transaction description with enhanced rules"""
        if not description:
            return ""

        # Remove extra whitespace
        description = ' '.join(description.split())

        # Fix city names
        description = re.sub(r'\s+ISTANBUL\s*$', ' İstanbul', description, flags=re.IGNORECASE)
        description = re.sub(r'\s+ANKARA\s*$', ' Ankara', description, flags=re.IGNORECASE)
        description = re.sub(r'\s+IZMIR\s*$', ' İzmir', description, flags=re.IGNORECASE)

        # Remove country codes
        description = re.sub(r'\s+TRTR\s*$', '', description)
        description = re.sub(r'\s+TR\s*$', '', description)

        # Remove special characters but keep Turkish chars
        description = re.sub(r'[^\w\s\-/\.\'\"\(\)ğüşıöçĞÜŞİÖÇ]', '', description)

        # Remove multiple spaces
        description = ' '.join(description.split())

        return description.strip()

    def _extract_from_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract from tables with enhanced validation"""
        transactions = []

        try:
            with pdfplumber.open(pdf_path) as pdf:
                first_page_text = pdf.pages[0].extract_text() or ""
                bank_id, bank_name, _ = EnhancedBankDetector.detect(first_page_text)

                for page in pdf.pages:
                    tables = page.extract_tables()

                    for table in tables:
                        if not table or len(table) < 2:
                            continue

                        header_idx = self._find_header_row(table)
                        if header_idx is None:
                            header_idx = 0

                        for row_idx, row in enumerate(table):
                            if row_idx <= header_idx:
                                continue

                            if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                                continue

                            tx = self._parse_table_row(row, bank_id)
                            if tx:
                                transactions.append(tx)

        except Exception as e:
            logger.error(f"Table extraction error: {e}")

        return transactions

    def _find_header_row(self, table: List[List]) -> Optional[int]:
        """Find header row in table"""
        header_keywords = ['tarih', 'date', 'açıklama', 'description', 'tutar', 'amount', 'borç', 'alacak']

        for idx, row in enumerate(table[:5]):
            if row:
                row_text = ' '.join(str(cell).lower() for cell in row if cell)
                if any(kw in row_text for kw in header_keywords):
                    return idx
        return None

    def _parse_table_row(self, row: List, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse table row into transaction"""
        if not row or len(row) < 2:
            return None

        cells = [str(cell).strip() if cell else '' for cell in row]
        row_text = ' '.join(cells)

        # Skip header-like rows
        row_lower = row_text.lower()
        if any(kw in row_lower for kw in self.SKIP_KEYWORDS):
            if len(row_text) < 50:
                return None

        # Find date
        date = None
        for cell in cells:
            date = self._parse_date(cell)
            if date:
                break

        if not date:
            return None

        # Find amounts
        amounts = []
        for cell in cells:
            amount = self._parse_amount(cell)
            if amount != 0:
                amounts.append(amount)

        if not amounts:
            return None

        # Determine main amount
        amount = amounts[-1] if len(amounts) == 1 else self._determine_main_amount(amounts)

        if amount == 0:
            return None

        # Build description
        description = self._build_description(cells, date, amounts)

        if not description or len(description) < 3:
            return None

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'currency': 'TRY',
            'raw_line': row_text[:200],
            'bank': bank_id,
            'confidence': 75.0
        }

    def _determine_main_amount(self, amounts: List[float]) -> float:
        """Determine main transaction amount from multiple amounts"""
        if not amounts:
            return 0.0

        if len(amounts) >= 2:
            non_zero = [a for a in amounts if a != 0]
            if non_zero:
                return min(non_zero, key=abs)

        return amounts[-1]

    def _build_description(self, cells: List[str], date: str, amounts: List[float]) -> str:
        """Build transaction description from table cells"""
        desc_parts = []

        for cell in cells:
            if not cell:
                continue

            is_date = self._parse_date(cell) is not None
            is_amount = self._parse_amount(cell) != 0

            if not is_date and not is_amount:
                cleaned = re.sub(r'[^\w\s\-ğüşıöçĞÜŞİÖÇ]', ' ', cell)
                cleaned = ' '.join(cleaned.split())
                if cleaned and len(cleaned) > 2:
                    desc_parts.append(cleaned)

        return ' '.join(desc_parts).strip()

    def _extract_from_text(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Fallback text extraction using pdfminer"""
        transactions = []

        try:
            text = extract_text(pdf_path)
            if not text or len(text.strip()) < 50:
                return []

            bank_id, bank_name, _ = EnhancedBankDetector.detect(text)

            lines = text.splitlines()
            for line in lines:
                line = line.strip()
                if not line or len(line) < 10:
                    continue

                line_lower = line.lower()
                if any(kw in line_lower for kw in self.SKIP_KEYWORDS):
                    continue

                tx = self._parse_text_line(line, bank_id)
                if tx:
                    transactions.append(tx)

        except Exception as e:
            logger.error(f"Text extraction error: {e}")

        return transactions

    def _parse_text_line(self, line: str, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse text line into transaction"""
        date = self._parse_date(line)
        if not date:
            return None

        amount = self._parse_amount(line)
        if amount == 0:
            return None

        description = self._extract_description(line, date, amount)
        if not description or len(description) < 3:
            return None

        return {
            'date': date,
            'description': description,
            'amount': amount,
            'currency': 'TRY',
            'raw_line': line[:200],
            'bank': bank_id,
            'confidence': 65.0
        }

    def _parse_date(self, text: str) -> Optional[str]:
        """Parse date from text with enhanced validation"""
        if not text:
            return None

        for pattern in self.date_patterns:
            match = pattern.search(text)
            if match:
                date_str = match.group(1)
                try:
                    # Replace Turkish months
                    date_str_lower = date_str.lower()
                    for tr, num in self.TURKISH_MONTHS.items():
                        date_str_lower = date_str_lower.replace(tr, num)

                    parsed = date_parser.parse(date_str_lower, dayfirst=True)

                    # Validate date range (last 10 years to 1 year in future)
                    now = datetime.now()
                    if parsed.year < now.year - 10 or parsed.year > now.year + 1:
                        continue

                    return parsed.strftime('%Y-%m-%d')
                except:
                    continue
        return None

    def _parse_amount(self, text: str) -> float:
        """Parse amount from text with validation"""
        if not text:
            return 0.0

        for pattern in self.amount_patterns:
            matches = pattern.findall(text)
            if matches:
                amount_str = matches[-1] if isinstance(matches[-1], str) else matches[-1][0]
                try:
                    # Handle Turkish number format
                    if ',' in amount_str and '.' in amount_str:
                        amount_str = amount_str.replace('.', '').replace(',', '.')
                    elif ',' in amount_str:
                        amount_str = amount_str.replace(',', '.')

                    amount = float(amount_str)

                    # Validation: reasonable amount range
                    if abs(amount) > 1000000:
                        return 0.0

                    return amount
                except ValueError:
                    continue
        return 0.0

    def _extract_description(self, line: str, date: str, amount: float) -> str:
        """Extract description from line by removing date and amount"""
        desc = line

        # Remove dates
        for pattern in self.date_patterns:
            desc = re.sub(pattern, '', desc)

        # Remove amounts
        for pattern in self.amount_patterns:
            desc = re.sub(pattern, '', desc)

        # Remove currency symbols
        desc = re.sub(r'TL|TRY|₺|USD|\$|EUR|€', '', desc)

        # Clean up
        desc = ' '.join(desc.split())
        desc = re.sub(r'[^\w\s\-ğüşıöçĞÜŞİÖÇ]', ' ', desc)
        desc = ' '.join(desc.split())

        return desc.strip()
