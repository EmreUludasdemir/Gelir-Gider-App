"""Advanced PDF parsing utilities with table extraction and bank-specific support"""
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dateutil import parser as date_parser
import pdfplumber
from pdfminer.high_level import extract_text


class BankDetector:
    """Detects which bank the statement belongs to"""
    
    BANK_SIGNATURES = {
        'garanti': {
            'keywords': ['GARANTİ BBVA', 'GARANTI BBVA', 'garanti.com.tr', 'Garanti Bankası'],
            'name': 'Garanti BBVA'
        },
        'isbank': {
            'keywords': ['TÜRKİYE İŞ BANKASI', 'İŞBANK', 'isbank.com.tr', 'İş Bankası'],
            'name': 'İş Bankası'
        },
        'yapikredi': {
            'keywords': ['YAPI KREDİ', 'YAPIKREDI', 'yapikredi.com.tr', 'Yapı ve Kredi'],
            'name': 'Yapı Kredi'
        },
        'akbank': {
            'keywords': ['AKBANK', 'akbank.com', 'Akbank T.A.Ş'],
            'name': 'Akbank'
        },
        'ziraat': {
            'keywords': ['ZİRAAT BANKASI', 'ZIRAAT', 'ziraatbank.com.tr', 'T.C. Ziraat'],
            'name': 'Ziraat Bankası'
        },
        'qnb': {
            'keywords': ['QNB FİNANSBANK', 'QNB FINANSBANK', 'FINANSBANK', 'qnbfinansbank.com'],
            'name': 'QNB Finansbank'
        },
        'enpara': {
            'keywords': ['ENPARA', 'enpara.com', 'Enpara.com'],
            'name': 'Enpara'
        },
        'papara': {
            'keywords': ['PAPARA', 'papara.com'],
            'name': 'Papara'
        },
        'denizbank': {
            'keywords': ['DENİZBANK', 'DENIZBANK', 'denizbank.com'],
            'name': 'Denizbank'
        },
        'halkbank': {
            'keywords': ['HALKBANK', 'HALK BANKASI', 'halkbank.com.tr'],
            'name': 'Halkbank'
        },
        'vakifbank': {
            'keywords': ['VAKIFBANK', 'VAKIF BANK', 'vakifbank.com.tr'],
            'name': 'Vakıfbank'
        },
    }
    
    @classmethod
    def detect(cls, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Detect bank from text content"""
        text_upper = text.upper()
        for bank_id, info in cls.BANK_SIGNATURES.items():
            for keyword in info['keywords']:
                if keyword.upper() in text_upper:
                    return bank_id, info['name']
        return None, None


class PDFParser:
    """Advanced bank statement parser with table extraction"""

    # Türkçe ay isimleri
    TURKISH_MONTHS = {
        'ocak': '01', 'şubat': '02', 'mart': '03',
        'nisan': '04', 'mayıs': '05', 'haziran': '06',
        'temmuz': '07', 'ağustos': '08', 'eylül': '09',
        'ekim': '10', 'kasım': '11', 'aralık': '12',
        'aralik': '12', 'subat': '02', 'mayis': '05',
        'agustos': '08', 'eylul': '09', 'kasim': '11'
    }

    # Tarih kalıpları
    DATE_PATTERNS = [
        r'(\d{2}[\./]\d{2}[\./]\d{4})',           # 01.12.2024 veya 01/12/2024
        r'(\d{4}-\d{2}-\d{2})',                    # 2024-12-01
        r'(\d{1,2}\s+\w+\s+\d{4})',                # 01 Aralık 2024
        r'(\d{2}[\./]\d{2}[\./]\d{2})',            # 01.12.24
    ]

    # Tutar kalıpları - daha kapsamlı
    AMOUNT_PATTERNS = [
        # Türk formatı: 1.234,56 veya 1.234.567,89
        r'([-+]?\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL|TRY|₺)?',
        # Alternatif format: 1234.56
        r'([-+]?\d+\.\d{2})\s*(?:TL|TRY|₺)?',
        # Sadece sayı: 1234,56
        r'([-+]?\d+,\d{2})\s*(?:TL|TRY|₺)?',
    ]

    # Atlanacak satırlar
    SKIP_KEYWORDS = [
        'sayfa', 'page', 'toplam', 'bakiye', 'balance', 
        'devir', 'opening', 'closing', 'hesap özeti',
        'account statement', 'tarih', 'date', 'açıklama',
        'description', 'tutar', 'amount', 'borç', 'alacak'
    ]

    def __init__(self):
        self.date_patterns = [re.compile(p, re.IGNORECASE) for p in self.DATE_PATTERNS]
        self.amount_patterns = [re.compile(p, re.IGNORECASE) for p in self.AMOUNT_PATTERNS]

    def extract_transactions(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract transactions from PDF using multiple methods.
        """
        transactions = []
        
        # İlk olarak pdfplumber ile tablo çıkarmayı dene
        table_transactions = self._extract_from_tables(pdf_path)
        if table_transactions:
            print(f"DEBUG: Found {len(table_transactions)} transactions from tables")
            transactions.extend(table_transactions)
        
        # Tablo bulunamazsa veya az işlem varsa, text-based parsing yap
        if len(transactions) < 3:
            text_transactions = self._extract_from_text(pdf_path)
            print(f"DEBUG: Found {len(text_transactions)} transactions from text")
            
            # Duplicate'leri önle
            existing_keys = {(t['date'], t['amount'], t['description'][:20]) for t in transactions}
            for tx in text_transactions:
                key = (tx['date'], tx['amount'], tx['description'][:20])
                if key not in existing_keys:
                    transactions.append(tx)
                    existing_keys.add(key)
        
        # Tarihe göre sırala
        transactions.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return transactions

    def _extract_from_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract transactions from PDF tables using pdfplumber"""
        transactions = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Banka tespiti
                first_page_text = pdf.pages[0].extract_text() or ""
                bank_id, bank_name = BankDetector.detect(first_page_text)
                print(f"DEBUG: Detected bank: {bank_name or 'Unknown'}")
                
                for page_num, page in enumerate(pdf.pages):
                    # Tablolari çıkar
                    tables = page.extract_tables()
                    
                    for table in tables:
                        if not table or len(table) < 2:
                            continue
                        
                        # Header satırını bul
                        header_idx = self._find_header_row(table)
                        if header_idx is None:
                            header_idx = 0
                        
                        # Her satırı işle
                        for row_idx, row in enumerate(table):
                            if row_idx <= header_idx:
                                continue
                            
                            if not row or all(cell is None or str(cell).strip() == '' for cell in row):
                                continue
                            
                            tx = self._parse_table_row(row, bank_id)
                            if tx:
                                transactions.append(tx)
                    
                    # Tablo yoksa, sayfa metninden çıkar
                    if not tables:
                        page_text = page.extract_text()
                        if page_text:
                            page_txs = self._extract_from_page_text(page_text, bank_id)
                            transactions.extend(page_txs)
                            
        except Exception as e:
            print(f"DEBUG: Table extraction error: {e}")
            
        return transactions

    def _find_header_row(self, table: List[List]) -> Optional[int]:
        """Find the header row in a table"""
        header_keywords = ['tarih', 'date', 'açıklama', 'description', 'tutar', 'amount', 'borç', 'alacak']
        
        for idx, row in enumerate(table[:5]):  # İlk 5 satıra bak
            if row:
                row_text = ' '.join(str(cell).lower() for cell in row if cell)
                if any(kw in row_text for kw in header_keywords):
                    return idx
        return None

    def _parse_table_row(self, row: List, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse a single table row into a transaction"""
        if not row or len(row) < 2:
            return None
        
        # Satırı temizle
        cells = [str(cell).strip() if cell else '' for cell in row]
        row_text = ' '.join(cells)
        
        # Skip keywords kontrolü
        row_lower = row_text.lower()
        if any(kw in row_lower for kw in self.SKIP_KEYWORDS):
            if len(row_text) < 50:  # Kısa header satırlarını atla
                return None
        
        # Tarih bul
        date = None
        for cell in cells:
            date = self._parse_date(cell)
            if date:
                break
        
        if not date:
            date = self._extract_date_from_text(row_text)
        
        if not date:
            return None
        
        # Tutar bul
        amounts = self._extract_amounts_from_row(cells)
        if not amounts:
            return None
        
        # Ana tutarı belirle (genelde son veya en büyük tutar)
        amount = amounts[-1] if len(amounts) == 1 else self._determine_main_amount(amounts)
        
        if amount == 0:
            return None
        
        # Açıklama oluştur
        description = self._build_description(cells, date, amounts)
        
        if not description or len(description) < 3:
            return None
        
        return {
            'date': date,
            'description': description,
            'amount': amount,
            'currency': 'TRY',
            'raw_line': row_text[:200],
            'bank': bank_id
        }

    def _extract_amounts_from_row(self, cells: List[str]) -> List[float]:
        """Extract all amounts from row cells"""
        amounts = []
        for cell in cells:
            amount = self._parse_amount(cell)
            if amount != 0:
                amounts.append(amount)
        return amounts

    def _determine_main_amount(self, amounts: List[float]) -> float:
        """Determine the main transaction amount from multiple amounts"""
        if not amounts:
            return 0
        
        # Bakiye değil işlem tutarını bul
        # Genelde daha küçük olan işlem tutarıdır
        if len(amounts) >= 2:
            # En küçük mutlak değeri al (0 hariç)
            non_zero = [a for a in amounts if a != 0]
            if non_zero:
                return min(non_zero, key=abs)
        
        return amounts[-1]

    def _build_description(self, cells: List[str], date: str, amounts: List[float]) -> str:
        """Build transaction description from cells"""
        desc_parts = []
        
        for cell in cells:
            # Tarih ve tutar içermeyen hücreleri al
            if not cell:
                continue
            
            is_date = self._parse_date(cell) is not None
            is_amount = self._parse_amount(cell) != 0
            
            if not is_date and not is_amount:
                # Gereksiz karakterleri temizle
                cleaned = re.sub(r'[^\w\s\-ğüşıöçĞÜŞİÖÇ]', ' ', cell)
                cleaned = ' '.join(cleaned.split())
                if cleaned and len(cleaned) > 2:
                    desc_parts.append(cleaned)
        
        return ' '.join(desc_parts).strip()

    def _extract_from_text(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Fallback: Extract from raw text using pdfminer"""
        transactions = []
        
        try:
            text = extract_text(pdf_path)
            if not text or len(text.strip()) < 50:
                return []
            
            # Banka tespiti
            bank_id, bank_name = BankDetector.detect(text)
            
            lines = text.splitlines()
            for line in lines:
                line = line.strip()
                if not line or len(line) < 10:
                    continue
                
                # Skip keywords
                line_lower = line.lower()
                if any(kw in line_lower for kw in self.SKIP_KEYWORDS):
                    continue
                
                tx = self._parse_text_line(line, bank_id)
                if tx:
                    transactions.append(tx)
                    
        except Exception as e:
            print(f"DEBUG: Text extraction error: {e}")
        
        return transactions

    def _extract_from_page_text(self, text: str, bank_id: Optional[str]) -> List[Dict[str, Any]]:
        """Extract transactions from page text"""
        transactions = []
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
        
        return transactions

    def _parse_text_line(self, line: str, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse a single text line"""
        date = self._extract_date_from_text(line)
        if not date:
            return None
        
        amount = self._extract_amount_from_text(line)
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
            'bank': bank_id
        }

    def _parse_date(self, text: str) -> Optional[str]:
        """Parse date from text"""
        if not text:
            return None
        
        for pattern in self.date_patterns:
            match = pattern.search(text)
            if match:
                date_str = match.group(1)
                try:
                    # Türkçe ay isimlerini çevir
                    date_str_lower = date_str.lower()
                    for tr, num in self.TURKISH_MONTHS.items():
                        date_str_lower = date_str_lower.replace(tr, num)
                    
                    parsed = date_parser.parse(date_str_lower, dayfirst=True)
                    return parsed.strftime('%Y-%m-%d')
                except:
                    continue
        return None

    def _extract_date_from_text(self, line: str) -> Optional[str]:
        """Extract date from text line"""
        return self._parse_date(line)

    def _parse_amount(self, text: str) -> float:
        """Parse amount from text"""
        if not text:
            return 0.0
        
        for pattern in self.amount_patterns:
            matches = pattern.findall(text)
            if matches:
                amount_str = matches[-1] if isinstance(matches[-1], str) else matches[-1][0]
                try:
                    # Türk formatını normalize et
                    # 1.234,56 -> 1234.56
                    if ',' in amount_str and '.' in amount_str:
                        amount_str = amount_str.replace('.', '').replace(',', '.')
                    elif ',' in amount_str:
                        amount_str = amount_str.replace(',', '.')
                    
                    return float(amount_str)
                except ValueError:
                    continue
        return 0.0

    def _extract_amount_from_text(self, line: str) -> float:
        """Extract amount from text line"""
        return self._parse_amount(line)

    def _extract_description(self, line: str, date: str, amount: float) -> str:
        """Extract description from line"""
        desc = line
        
        # Tarihi kaldır
        for pattern in self.date_patterns:
            desc = re.sub(pattern, '', desc)
        
        # Tutarı kaldır
        for pattern in self.amount_patterns:
            desc = re.sub(pattern, '', desc)
        
        # Para birimi sembollerini kaldır
        desc = re.sub(r'TL|TRY|₺|USD|\$|EUR|€', '', desc)
        
        # Fazladan boşlukları temizle
        desc = ' '.join(desc.split())
        
        # Özel karakterleri temizle ama Türkçe karakterleri koru
        desc = re.sub(r'[^\w\s\-ğüşıöçĞÜŞİÖÇ]', ' ', desc)
        desc = ' '.join(desc.split())
        
        return desc.strip()
