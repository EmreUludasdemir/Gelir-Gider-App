"""Test the updated parser"""
import sys
sys.path.insert(0, '.')
from app.parser import PDFParser

def main():
    pdf_path = r"C:\Users\Emre\Downloads\Aralık Ayı kredi kartı ekstresi.pdf"
    
    print("=" * 60)
    print("TESTING UPDATED PARSER")
    print("=" * 60)
    
    parser = PDFParser()
    transactions = parser.extract_transactions(pdf_path)
    
    print(f"\nTotal transactions found: {len(transactions)}")
    print("\n" + "-" * 60)
    
    # İlk 20 işlemi göster
    for i, tx in enumerate(transactions[:20]):
        print(f"\n{i+1}. Transaction:")
        print(f"   Date: {tx.get('date')}")
        print(f"   Amount: {tx.get('amount'):,.2f} TRY")
        print(f"   Description: {tx.get('description')}")
        print(f"   Bank: {tx.get('bank')}")
    
    # Özet istatistikler
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    total_income = sum(tx['amount'] for tx in transactions if tx['amount'] > 0)
    total_expense = sum(tx['amount'] for tx in transactions if tx['amount'] < 0)
    
    print(f"Total Income (Ödemeler): {total_income:,.2f} TRY")
    print(f"Total Expense (Harcamalar): {total_expense:,.2f} TRY")
    print(f"Net: {total_income + total_expense:,.2f} TRY")

if __name__ == "__main__":
    main()
