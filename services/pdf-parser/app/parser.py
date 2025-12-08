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
            'keywords': ['ZİRAAT BANKASI', 'ZIRAAT', 'ziraatbank.com.tr', 'T.C. Ziraat', 'Bankkart', 'BANKKART'],
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

    # Tarih kalıpları - kredi kartı ekstreleri için genişletildi
    DATE_PATTERNS = [
        r'(\d{2}/\d{2}/\d{4})',                      # 02/11/2025
        r'(\d{2}\.\d{2}\.\d{4})',                    # 01.12.2024
        r'(\d{4}-\d{2}-\d{2})',                      # 2024-12-01
        r'(\d{1,2}\s+\w+\s+\d{4})',                  # 01 Aralık 2024
        r'(\d{2}/\d{2}/\d{2})',                      # 01/12/24
        r'(\d{2}\.\d{2}\.\d{2})',                    # 01.12.24
    ]

    # Tutar kalıpları - daha kapsamlı
    AMOUNT_PATTERNS = [
        # Türk formatı: 1.234,56 veya 1.234.567,89
        r'([-+]?\d{1,3}(?:\.\d{3})*,\d{2})',
        # Alternatif format: 1234.56
        r'([-+]?\d+\.\d{2})',
        # Sadece sayı: 1234,56
        r'([-+]?\d+,\d{2})',
    ]

    # Atlanacak satırlar - kredi kartı için genişletildi
    SKIP_KEYWORDS = [
        'sayfa', 'page', 'bakiye', 'balance', 
        'hesap özeti', 'account statement', 
        'kart limiti', 'müşteri numarası', 'hesap kesim',
        'son ödeme tarihi', 'nakit avans', 'asgari ödeme',
        'toplam bankkart', 'dönem borcu',
        'kullanılabilir', 'sonraki hesap', 'sonraki son',
        'bugüne kadar', 'ekstre', 'sayın',
    ]

    def __init__(self):
        self.date_patterns = [re.compile(p, re.IGNORECASE) for p in self.DATE_PATTERNS]
        self.amount_patterns = [re.compile(p, re.IGNORECASE) for p in self.AMOUNT_PATTERNS]

    def extract_transactions(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract transactions from PDF using multiple methods.
        """
        transactions = []
        
        # Önce pdfplumber ile satır bazlı parsing yapalım (daha güvenilir)
        pdfplumber_transactions = self._extract_with_pdfplumber(pdf_path)
        if pdfplumber_transactions:
            print(f"DEBUG: Found {len(pdfplumber_transactions)} transactions from pdfplumber")
            transactions.extend(pdfplumber_transactions)
        
        # Eğer işlem bulunamadıysa, tablo parsing dene
        if len(transactions) < 3:
            table_transactions = self._extract_from_tables(pdf_path)
            if table_transactions:
                print(f"DEBUG: Found {len(table_transactions)} transactions from tables")
                # Duplicate'leri önle
                existing_keys = {(t['date'], t['amount'], t.get('description', '')[:20]) for t in transactions}
                for tx in table_transactions:
                    key = (tx['date'], tx['amount'], tx.get('description', '')[:20])
                    if key not in existing_keys:
                        transactions.append(tx)
                        existing_keys.add(key)
        
        # Hala az işlem varsa, pdfminer text-based parsing yap
        if len(transactions) < 3:
            text_transactions = self._extract_from_text(pdf_path)
            print(f"DEBUG: Found {len(text_transactions)} transactions from text")
            
            existing_keys = {(t['date'], t['amount'], t.get('description', '')[:20]) for t in transactions}
            for tx in text_transactions:
                key = (tx['date'], tx['amount'], tx.get('description', '')[:20])
                if key not in existing_keys:
                    transactions.append(tx)
                    existing_keys.add(key)
        
        # Tarihe göre sırala
        transactions.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return transactions

    def _extract_with_pdfplumber(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract transactions using pdfplumber line by line parsing"""
        transactions = []
        seen_lines = set()  # Duplicate line kontrolü için
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Banka tespiti
                first_page_text = pdf.pages[0].extract_text() or ""
                bank_id, bank_name = BankDetector.detect(first_page_text)
                print(f"DEBUG: Detected bank: {bank_name or 'Unknown'}")
                
                # Tüm sayfalardan metin çıkar
                full_text = ""
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    full_text += page_text + "\n"
                
                # Satır satır işle
                lines = full_text.split('\n')
                for line in lines:
                    line = line.strip()
                    if not line or len(line) < 15:
                        continue
                    
                    # Duplicate line kontrolü (aynı satır birden fazla sayfada görünebilir)
                    if line in seen_lines:
                        continue
                    seen_lines.add(line)
                    
                    # Tarih ile başlayan satırları bul (DD/MM/YYYY veya DD.MM.YYYY)
                    if not re.match(r'^\d{2}[/\.]\d{2}[/\.]\d{4}', line):
                        continue
                    
                    tx = self._parse_credit_card_line(line, bank_id)
                    if tx:
                        transactions.append(tx)

                        
        except Exception as e:
            print(f"DEBUG: pdfplumber extraction error: {e}")
            import traceback
            traceback.print_exc()
        
        return transactions

    def _parse_credit_card_line(self, line: str, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse a credit card statement line: DD/MM/YYYY AÇIKLAMA TUTAR"""
        try:
            # Tarih çıkar
            date_match = re.match(r'^(\d{2}[/\.]\d{2}[/\.]\d{4})', line)
            if not date_match:
                return None
            
            date_str = date_match.group(1)
            date = self._parse_date(date_str)
            if not date:
                return None
            
            rest = line[len(date_str):].strip()
            
            # Ödeme kontrolü (+ ile biten = alacak/ödeme)
            is_payment = rest.rstrip().endswith('+')
            if is_payment:
                rest = rest.rstrip()[:-1].strip()
            
            # Tutarları bul
            amount_pattern = re.compile(r'(\d{1,3}(?:\.\d{3})*,\d{2})')
            amounts = amount_pattern.findall(rest)
            
            if not amounts:
                return None
            
            # İlk tutar genelde TL tutarı (ana işlem tutarı)
            amount_str = amounts[0]
            amount = self._parse_amount(amount_str)
            
            if amount == 0:
                return None
            
            # Çok düşük tutarlı işlemleri atla (0.00 TL gibi Bankkart lira ödemeleri)
            if amount < 1:
                return None
            
            # Ödeme ise pozitif, harcama ise negatif
            if is_payment:
                amount = abs(amount)  # Ödeme = gelir
            else:
                amount = -abs(amount)  # Harcama = gider
            
            # Açıklamayı çıkar (tarih ile tutar arasındaki kısım)
            amount_pos = rest.find(amount_str)
            if amount_pos > 0:
                description = rest[:amount_pos].strip()
            else:
                description = rest
            
            # Açıklamayı temizle
            description = self._clean_description(description)
            
            if not description or len(description) < 3:
                return None
            
            # Bazı açıklamaları filtrele
            desc_lower = description.lower()
            skip_phrases = [
                'bankkart lira ile ödeme', 
                'troy kampanyası',
                'önceki aydan devir',
                'bankkart lira ile',
            ]
            if any(phrase in desc_lower for phrase in skip_phrases):
                return None
            
            return {
                'date': date,
                'description': description,
                'amount': amount,
                'currency': 'TRY',
                'raw_line': line[:200],
                'bank': bank_id
            }
        except Exception as e:
            print(f"DEBUG: Parse line error: {e} - Line: {line[:50]}...")
            return None

    def _clean_description(self, description: str) -> str:
        """Clean up transaction description"""
        if not description:
            return ""
        
        # Fazla boşlukları temizle
        description = ' '.join(description.split())
        
        # Sonundaki şehir isimlerini düzelt
        description = re.sub(r'\s+ISTANBUL\s*$', ' İstanbul', description, flags=re.IGNORECASE)
        description = re.sub(r'\s+ANKARA\s*$', ' Ankara', description, flags=re.IGNORECASE)
        description = re.sub(r'\s+IZMIR\s*$', ' İzmir', description, flags=re.IGNORECASE)
        
        # TRTR suffix'ini kaldır
        description = re.sub(r'\s+TRTR\s*$', '', description)
        
        # Özel karakterleri temizle ama Türkçe karakterleri koru
        # PDF'den gelen bozuk karakterleri de kabul edelim
        description = re.sub(r'[^\w\s\-/\.\'\"\(\)ğüşıöçĞÜŞİÖÇ]', '', description)
        
        return description.strip()

    def _extract_from_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract transactions from PDF tables using pdfplumber"""
        transactions = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Banka tespiti
                first_page_text = pdf.pages[0].extract_text() or ""
                bank_id, bank_name = BankDetector.detect(first_page_text)
                
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
                            
        except Exception as e:
            print(f"DEBUG: Table extraction error: {e}")
            
        return transactions

    def _find_header_row(self, table: List[List]) -> Optional[int]:
        """Find the header row in a table"""
        header_keywords = ['tarih', 'date', 'açıklama', 'description', 'tutar', 'amount', 'borç', 'alacak']
        
        for idx, row in enumerate(table[:5]):
            if row:
                row_text = ' '.join(str(cell).lower() for cell in row if cell)
                if any(kw in row_text for kw in header_keywords):
                    return idx
        return None

    def _parse_table_row(self, row: List, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse a single table row into a transaction"""
        if not row or len(row) < 2:
            return None
        
        cells = [str(cell).strip() if cell else '' for cell in row]
        row_text = ' '.join(cells)
        
        row_lower = row_text.lower()
        if any(kw in row_lower for kw in self.SKIP_KEYWORDS):
            if len(row_text) < 50:
                return None
        
        date = None
        for cell in cells:
            date = self._parse_date(cell)
            if date:
                break
        
        if not date:
            return None
        
        amounts = self._extract_amounts_from_row(cells)
        if not amounts:
            return None
        
        amount = amounts[-1] if len(amounts) == 1 else self._determine_main_amount(amounts)
        
        if amount == 0:
            return None
        
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
        
        if len(amounts) >= 2:
            non_zero = [a for a in amounts if a != 0]
            if non_zero:
                return min(non_zero, key=abs)
        
        return amounts[-1]

    def _build_description(self, cells: List[str], date: str, amounts: List[float]) -> str:
        """Build transaction description from cells"""
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
        """Fallback: Extract from raw text using pdfminer"""
        transactions = []
        
        try:
            text = extract_text(pdf_path)
            if not text or len(text.strip()) < 50:
                return []
            
            bank_id, bank_name = BankDetector.detect(text)
            
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
            print(f"DEBUG: Text extraction error: {e}")
        
        return transactions

    def _parse_text_line(self, line: str, bank_id: Optional[str]) -> Optional[Dict[str, Any]]:
        """Parse a single text line"""
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
                    date_str_lower = date_str.lower()
                    for tr, num in self.TURKISH_MONTHS.items():
                        date_str_lower = date_str_lower.replace(tr, num)
                    
                    parsed = date_parser.parse(date_str_lower, dayfirst=True)
                    return parsed.strftime('%Y-%m-%d')
                except:
                    continue
        return None

    def _parse_amount(self, text: str) -> float:
        """Parse amount from text"""
        if not text:
            return 0.0
        
        for pattern in self.amount_patterns:
            matches = pattern.findall(text)
            if matches:
                amount_str = matches[-1] if isinstance(matches[-1], str) else matches[-1][0]
                try:
                    if ',' in amount_str and '.' in amount_str:
                        amount_str = amount_str.replace('.', '').replace(',', '.')
                    elif ',' in amount_str:
                        amount_str = amount_str.replace(',', '.')
                    
                    return float(amount_str)
                except ValueError:
                    continue
        return 0.0

    def _extract_description(self, line: str, date: str, amount: float) -> str:
        """Extract description from line"""
        desc = line
        
        for pattern in self.date_patterns:
            desc = re.sub(pattern, '', desc)
        
        for pattern in self.amount_patterns:
            desc = re.sub(pattern, '', desc)
        
        desc = re.sub(r'TL|TRY|₺|USD|\$|EUR|€', '', desc)
        desc = ' '.join(desc.split())
        desc = re.sub(r'[^\w\s\-ğüşıöçĞÜŞİÖÇ]', ' ', desc)
        desc = ' '.join(desc.split())
        
        return desc.strip()
