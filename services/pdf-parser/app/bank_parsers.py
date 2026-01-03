"""Bank-specific parsers for different Turkish bank statement formats"""
import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BankParser(ABC):
    """Abstract base class for bank-specific parsers"""

    @abstractmethod
    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse a single line from the bank statement"""
        pass

    @abstractmethod
    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        """Parse a table row from the bank statement"""
        pass

    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to ISO format"""
        patterns = [
            (r'(\d{2})/(\d{2})/(\d{4})', '%d/%m/%Y'),
            (r'(\d{2})\.(\d{2})\.(\d{4})', '%d.%m.%Y'),
            (r'(\d{4})-(\d{2})-(\d{2})', '%Y-%m-%d'),
            (r'(\d{2})/(\d{2})/(\d{2})', '%d/%m/%y'),
        ]

        for pattern, fmt in patterns:
            match = re.search(pattern, date_str)
            if match:
                try:
                    dt = datetime.strptime(match.group(0), fmt)
                    return dt.strftime('%Y-%m-%d')
                except:
                    continue
        return None

    def parse_amount(self, amount_str: str) -> float:
        """Parse amount string handling Turkish/English formats"""
        if not amount_str:
            return 0.0

        # Remove currency symbols and whitespace
        amount_str = re.sub(r'[TL₺\s]', '', amount_str.strip())

        try:
            # Turkish format: 1.234,56
            if ',' in amount_str and '.' in amount_str:
                if amount_str.rindex(',') > amount_str.rindex('.'):
                    return float(amount_str.replace('.', '').replace(',', '.'))
                else:
                    return float(amount_str.replace(',', ''))
            elif ',' in amount_str:
                return float(amount_str.replace(',', '.'))
            else:
                return float(amount_str)
        except:
            return 0.0


class GarantiParser(BankParser):
    """Parser for Garanti BBVA statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse Garanti credit card statement line"""
        # Garanti format: DD/MM/YYYY DD/MM/YYYY Description Amount
        pattern = r'^(\d{2}/\d{2}/\d{4})\s+(\d{2}/\d{2}/\d{4})?\s*(.+?)\s+(-?[\d\.,]+)\s*(?:TL)?$'
        match = re.match(pattern, line.strip())

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(3).strip()
            amount = self.parse_amount(match.group(4))

            if date and description and amount != 0:
                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': 'expense' if amount > 0 else 'income',
                    'currency': 'TRY',
                    'bank': 'garanti'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        # Find amount (usually last non-empty cell)
        amount = 0.0
        for cell in reversed(cells):
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        # Description is middle cells
        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': 'expense',
            'currency': 'TRY',
            'bank': 'garanti'
        }


class IsbankParser(BankParser):
    """Parser for İş Bankası statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse İşbank credit card/account statement line"""
        # İşbank format: DD.MM.YYYY Description Amount (BORÇ/ALACAK)
        pattern = r'^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(-?[\d\.,]+)\s*(TL)?\s*(BORÇ|ALACAK)?$'
        match = re.match(pattern, line.strip(), re.IGNORECASE)

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(2).strip()
            amount = self.parse_amount(match.group(3))
            tx_type_indicator = match.group(5)

            if date and description and amount != 0:
                tx_type = 'expense'
                if tx_type_indicator and 'ALACAK' in tx_type_indicator.upper():
                    tx_type = 'income'

                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': tx_type,
                    'currency': 'TRY',
                    'bank': 'isbank'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        tx_type = 'expense'

        # İşbank often has separate BORÇ (debit) and ALACAK (credit) columns
        for i, cell in enumerate(cells):
            amt = self.parse_amount(cell)
            if amt != 0:
                amount = amt
                # Check column header or position for type
                if i == len(cells) - 1:  # Last column often ALACAK
                    tx_type = 'income'

        if amount == 0:
            return None

        description = ' '.join(cells[1:-2]).strip() if len(cells) > 3 else cells[1]

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': tx_type,
            'currency': 'TRY',
            'bank': 'isbank'
        }


class YapikrediParser(BankParser):
    """Parser for Yapı Kredi statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse Yapıkredi credit card statement line"""
        # Yapıkredi format: DD/MM/YYYY Description Amount TL
        pattern = r'^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+(-?[\d\.,]+)\s*(?:TL|₺)?$'
        match = re.match(pattern, line.strip())

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(2).strip()
            amount = self.parse_amount(match.group(3))

            if date and description and amount != 0:
                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': 'expense' if amount > 0 else 'income',
                    'currency': 'TRY',
                    'bank': 'yapikredi'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        for cell in reversed(cells):
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': 'expense',
            'currency': 'TRY',
            'bank': 'yapikredi'
        }


class ZiraatParser(BankParser):
    """Parser for Ziraat Bankası statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse Ziraat Bankası statement line"""
        # Ziraat format varies - try multiple patterns
        patterns = [
            r'^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(-?[\d\.,]+)\s*(?:TL)?(?:\s*(G|C))?$',
            r'^(\d{2}/\d{2}/\d{4})\s+(.+?)\s+(-?[\d\.,]+)\s*(?:TL)?(?:\s*(G|C))?$',
        ]

        for pattern in patterns:
            match = re.match(pattern, line.strip())
            if match:
                date = self.parse_date(match.group(1))
                description = match.group(2).strip()
                amount = self.parse_amount(match.group(3))
                type_indicator = match.group(4) if len(match.groups()) > 3 else None

                if date and description and amount != 0:
                    tx_type = 'expense'
                    if type_indicator == 'G':  # Giriş (Income)
                        tx_type = 'income'

                    return {
                        'date': date,
                        'description': description,
                        'amount': abs(amount),
                        'type': tx_type,
                        'currency': 'TRY',
                        'bank': 'ziraat'
                    }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        tx_type = 'expense'

        for cell in reversed(cells):
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': tx_type,
            'currency': 'TRY',
            'bank': 'ziraat'
        }


class AkbankParser(BankParser):
    """Parser for Akbank statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse Akbank statement line"""
        # Akbank format: DD.MM.YYYY Description Amount
        pattern = r'^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(-?[\d\.,]+)\s*(?:TL|₺)?$'
        match = re.match(pattern, line.strip())

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(2).strip()
            amount = self.parse_amount(match.group(3))

            if date and description and amount != 0:
                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': 'expense' if amount > 0 else 'income',
                    'currency': 'TRY',
                    'bank': 'akbank'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        for cell in reversed(cells):
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': 'expense',
            'currency': 'TRY',
            'bank': 'akbank'
        }


class EnparaParser(BankParser):
    """Parser for Enpara statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse Enpara statement line"""
        # Enpara typically shows transactions in a clean format
        pattern = r'^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([+-]?[\d\.,]+)\s*(?:TL|₺)?$'
        match = re.match(pattern, line.strip())

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(2).strip()
            amount_str = match.group(3)
            is_income = amount_str.startswith('+')
            amount = self.parse_amount(amount_str)

            if date and description and amount != 0:
                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': 'income' if is_income else 'expense',
                    'currency': 'TRY',
                    'bank': 'enpara'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        tx_type = 'expense'

        for cell in cells:
            if cell.startswith('+'):
                tx_type = 'income'
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': tx_type,
            'currency': 'TRY',
            'bank': 'enpara'
        }


class PaparaParser(BankParser):
    """Parser for Papara statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse Papara statement line"""
        # Papara format is typically: Date Description Amount Status
        pattern = r'^(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+([+-]?[\d\.,]+)\s*(?:TL|₺)?'
        match = re.match(pattern, line.strip())

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(2).strip()
            amount_str = match.group(3)
            is_income = amount_str.startswith('+')
            amount = self.parse_amount(amount_str)

            if date and description and amount != 0:
                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': 'income' if is_income else 'expense',
                    'currency': 'TRY',
                    'bank': 'papara'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        tx_type = 'expense'

        for cell in cells:
            if '+' in cell:
                tx_type = 'income'
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': tx_type,
            'currency': 'TRY',
            'bank': 'papara'
        }


class QNBParser(BankParser):
    """Parser for QNB Finansbank statements"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse QNB Finansbank statement line"""
        pattern = r'^(\d{2}[/\.]\d{2}[/\.]\d{4})\s+(.+?)\s+(-?[\d\.,]+)\s*(?:TL|₺)?$'
        match = re.match(pattern, line.strip())

        if match:
            date = self.parse_date(match.group(1))
            description = match.group(2).strip()
            amount = self.parse_amount(match.group(3))

            if date and description and amount != 0:
                return {
                    'date': date,
                    'description': description,
                    'amount': abs(amount),
                    'type': 'expense' if amount > 0 else 'income',
                    'currency': 'TRY',
                    'bank': 'qnb'
                }
        return None

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 3:
            return None

        date = self.parse_date(cells[0])
        if not date:
            return None

        amount = 0.0
        for cell in reversed(cells):
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description = ' '.join(cells[1:-1]).strip()

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': 'expense',
            'currency': 'TRY',
            'bank': 'qnb'
        }


class GenericParser(BankParser):
    """Generic parser for unknown bank formats"""

    def parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse generic statement line"""
        # Try multiple date formats
        date_patterns = [
            r'^(\d{2}[/\.]\d{2}[/\.]\d{4})',
            r'^(\d{4}-\d{2}-\d{2})',
        ]

        date = None
        rest = line

        for pattern in date_patterns:
            match = re.match(pattern, line.strip())
            if match:
                date = self.parse_date(match.group(1))
                rest = line[match.end():].strip()
                break

        if not date:
            return None

        # Extract amount from end of line
        amount_pattern = r'(-?[\d\.,]+)\s*(?:TL|₺)?\s*$'
        amount_match = re.search(amount_pattern, rest)

        if not amount_match:
            return None

        amount = self.parse_amount(amount_match.group(1))
        if amount == 0:
            return None

        description = rest[:amount_match.start()].strip()
        if len(description) < 3:
            return None

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': 'expense',
            'currency': 'TRY',
            'bank': 'unknown'
        }

    def parse_table_row(self, row: List[str]) -> Optional[Dict[str, Any]]:
        cells = [str(c).strip() if c else '' for c in row]
        if len(cells) < 2:
            return None

        date = None
        for cell in cells:
            date = self.parse_date(cell)
            if date:
                break

        if not date:
            return None

        amount = 0.0
        for cell in reversed(cells):
            amount = self.parse_amount(cell)
            if amount != 0:
                break

        if amount == 0:
            return None

        description_parts = [c for c in cells if self.parse_date(c) is None and self.parse_amount(c) == 0]
        description = ' '.join(description_parts).strip()

        if len(description) < 3:
            return None

        return {
            'date': date,
            'description': description,
            'amount': abs(amount),
            'type': 'expense',
            'currency': 'TRY',
            'bank': 'unknown'
        }


class BankParserFactory:
    """Factory for creating bank-specific parsers"""

    PARSERS = {
        'garanti': GarantiParser,
        'isbank': IsbankParser,
        'yapikredi': YapikrediParser,
        'ziraat': ZiraatParser,
        'akbank': AkbankParser,
        'enpara': EnparaParser,
        'papara': PaparaParser,
        'qnb': QNBParser,
    }

    @classmethod
    def get_parser(cls, bank_id: Optional[str]) -> BankParser:
        """Get parser for specific bank or generic parser"""
        if bank_id and bank_id.lower() in cls.PARSERS:
            return cls.PARSERS[bank_id.lower()]()
        return GenericParser()

    @classmethod
    def get_all_parsers(cls) -> List[BankParser]:
        """Get all bank parsers including generic"""
        parsers = [parser() for parser in cls.PARSERS.values()]
        parsers.append(GenericParser())
        return parsers
