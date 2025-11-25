"""PDF parsing utilities"""
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from pdfminer.high_level import extract_text
from dateutil import parser as date_parser


class PDFParser:
    """Banka ekstrelerinden işlem çıkaran parser"""

    # Tarih formatları (Türk bankaları için)
    DATE_PATTERNS = [
        r'(\d{2}\.\d{2}\.\d{4})',           # 01.12.2024
        r'(\d{2}/\d{2}/\d{4})',              # 01/12/2024
        r'(\d{4}-\d{2}-\d{2})',              # 2024-12-01
        r'(\d{2}\s+\w+\s+\d{4})',            # 01 Aralık 2024
        r'(\d{1,2}\.\d{1,2}\.\d{2,4})',     # 1.12.24
    ]

    # Tutar pattern'leri
    AMOUNT_PATTERNS = [
        r'([-+]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*(?:TL|TRY|₺)?',  # 1.234,56 TL
        r'([-+]?\d+(?:[.,]\d{2}))\s*(?:TL|TRY|₺)?',                     # 1234.56 TL
        r'(?:TL|TRY|₺)\s*([-+]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))',   # TL 1.234,56
    ]

    # Görmezden gelinecek satırlar
    SKIP_PATTERNS = [
        r'^sayfa\s*\d+',
        r'^page\s*\d+',
        r'^\s*$',
        r'^-+$',
        r'^=+$',
        r'devam\s*ediyor',
        r'toplam',
        r'bakiye',
    ]

    def __init__(self):
        self.date_patterns = [re.compile(p, re.IGNORECASE) for p in self.DATE_PATTERNS]
        self.amount_patterns = [re.compile(p, re.IGNORECASE) for p in self.AMOUNT_PATTERNS]
        self.skip_patterns = [re.compile(p, re.IGNORECASE) for p in self.SKIP_PATTERNS]

    def extract_transactions(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        PDF'den işlemleri çıkar.

        Args:
            pdf_path: PDF dosya yolu

        Returns:
            List of transaction dictionaries
        """
        # PDF'den text çıkar
        text = extract_text(pdf_path)

        if not text or len(text.strip()) < 50:
            return []

        lines = text.splitlines()
        transactions = []

        for line in lines:
            line = line.strip()

            # Boş veya skip edilecek satırları atla
            if not line or len(line) < 10:
                continue

            if any(p.search(line) for p in self.skip_patterns):
                continue

            # Tarih bul
            date = self._extract_date(line)
            if not date:
                continue

            # Tutar bul
            amount = self._extract_amount(line)
            if amount == 0:
                continue

            # Açıklama çıkar
            description = self._extract_description(line, date, amount)
            if not description or len(description) < 3:
                continue

            transactions.append({
                'date': date,
                'description': description,
                'amount': amount,
                'currency': 'TRY',
                'raw_line': line
            })

        return transactions

    def _extract_date(self, line: str) -> Optional[str]:
        """Satırdan tarih çıkar"""
        for pattern in self.date_patterns:
            match = pattern.search(line)
            if match:
                date_str = match.group(1)
                try:
                    # Türkçe ay isimleri için
                    turkish_months = {
                        'ocak': '01', 'şubat': '02', 'mart': '03',
                        'nisan': '04', 'mayıs': '05', 'haziran': '06',
                        'temmuz': '07', 'ağustos': '08', 'eylül': '09',
                        'ekim': '10', 'kasım': '11', 'aralık': '12'
                    }

                    for tr, num in turkish_months.items():
                        date_str = date_str.lower().replace(tr, num)

                    parsed = date_parser.parse(date_str, dayfirst=True)
                    return parsed.strftime('%Y-%m-%d')
                except:
                    continue
        return None

    def _extract_amount(self, line: str) -> float:
        """Satırdan tutar çıkar"""
        for pattern in self.amount_patterns:
            matches = pattern.findall(line)
            if matches:
                # Son bulunan tutarı al (genelde işlem tutarı sonda olur)
                amount_str = matches[-1] if isinstance(matches[-1], str) else matches[-1][0]

                # Türk formatını normalize et (1.234,56 -> 1234.56)
                amount_str = amount_str.replace('.', '').replace(',', '.')

                try:
                    return float(amount_str)
                except ValueError:
                    continue
        return 0.0

    def _extract_description(self, line: str, date: str, amount: float) -> str:
        """Satırdan açıklama çıkar"""
        desc = line

        # Tarihi kaldır
        for pattern in self.date_patterns:
            desc = pattern.sub('', desc)

        # Tutarı kaldır (formatlanmış haliyle)
        amount_str = str(abs(amount))
        desc = desc.replace(amount_str, '')

        # Para birimi sembollerini kaldır
        desc = re.sub(r'TL|TRY|₺|USD|\$|EUR|€', '', desc)

        # Fazladan boşlukları temizle
        desc = ' '.join(desc.split())

        # Özel karakterleri temizle ama alfanumerik ve Türkçe karakterleri koru
        desc = re.sub(r'[^\w\s\-ğüşıöçĞÜŞİÖÇ]', ' ', desc)
        desc = ' '.join(desc.split())

        return desc.strip()
