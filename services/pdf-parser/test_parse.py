"""Test script to debug PDF parsing"""
import sys
sys.path.insert(0, '.')
from app.parser import PDFParser, BankDetector
import pdfplumber
from pdfminer.high_level import extract_text

def main():
    pdf_path = r"C:\Users\Emre\Downloads\Aralık Ayı kredi kartı ekstresi.pdf"
    
    print("=" * 60)
    print("PDF PARSING DEBUG TEST")
    print("=" * 60)
    
    # 1. Raw text extraction with pdfminer
    print("\n>>> 1. PDFMINER RAW TEXT EXTRACTION <<<")
    try:
        text = extract_text(pdf_path)
        print(f"Text length: {len(text)} characters")
        print("\n--- First 2000 chars ---")
        print(text[:2000])
        print("\n--- Looking for bank keywords ---")
        bank_id, bank_name = BankDetector.detect(text)
        print(f"Detected bank: {bank_name or 'Unknown'} (ID: {bank_id})")
    except Exception as e:
        print(f"Error: {e}")
    
    # 2. Table extraction with pdfplumber
    print("\n" + "=" * 60)
    print(">>> 2. PDFPLUMBER TABLE EXTRACTION <<<")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                print(f"\n--- Page {page_num + 1} ---")
                
                # Page text
                page_text = page.extract_text() or ""
                print(f"Page text length: {len(page_text)} chars")
                if page_text:
                    print("First 500 chars of page text:")
                    print(page_text[:500])
                
                # Tables
                tables = page.extract_tables()
                print(f"\nNumber of tables found: {len(tables)}")
                
                for table_idx, table in enumerate(tables):
                    print(f"\n  Table {table_idx + 1}: {len(table)} rows")
                    for row_idx, row in enumerate(table[:10]):  # First 10 rows
                        print(f"    Row {row_idx}: {row}")
    except Exception as e:
        print(f"Error: {e}")
    
    # 3. Use our parser
    print("\n" + "=" * 60)
    print(">>> 3. OUR PARSER OUTPUT <<<")
    try:
        parser = PDFParser()
        transactions = parser.extract_transactions(pdf_path)
        print(f"Total transactions found: {len(transactions)}")
        for i, tx in enumerate(transactions[:10]):
            print(f"\n  Transaction {i+1}:")
            print(f"    Date: {tx.get('date')}")
            print(f"    Amount: {tx.get('amount')}")
            print(f"    Description: {tx.get('description')}")
            print(f"    Raw: {tx.get('raw_line', '')[:80]}...")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
