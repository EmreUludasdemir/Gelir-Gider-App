from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import tempfile
import os
import logging

from .parser import PDFParser
from .classifier import TransactionClassifier
from .enhanced_parser import EnhancedPDFParser
from .enhanced_classifier import EnhancedTransactionClassifier

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PDF Parser Service",
    description="Banka ekstrelerini parse eden gelişmiş mikroservis",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use enhanced versions by default
parser = EnhancedPDFParser()
classifier = EnhancedTransactionClassifier()

# Keep legacy parser for fallback
legacy_parser = PDFParser()
legacy_classifier = TransactionClassifier()


@app.get("/health")
async def health_check():
    """Health check endpoint with enhanced status info"""
    return {
        "status": "healthy",
        "service": "pdf-parser",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "features": {
            "enhanced_parser": True,
            "enhanced_classifier": True,
            "multi_bank_support": True,
            "categories_count": len(classifier.get_categories())
        }
    }


@app.get("/categories")
async def get_categories():
    """Get all available transaction categories"""
    return {
        "categories": classifier.get_categories(),
        "total": len(classifier.get_categories())
    }


@app.post("/parse")
async def parse_pdf(file: UploadFile = File(...), use_legacy: bool = False):
    """
    PDF dosyasını parse et ve işlemleri çıkar (Gelişmiş parser).

    Args:
        file: PDF dosyası
        use_legacy: Eski parser'ı kullan (fallback)

    Returns:
        - success: bool
        - filename: str
        - transactions: list of parsed transactions
        - total: total count
        - errors: any parsing errors
        - statistics: parsing statistics
    """
    logger.info(f"Parsing PDF: {file.filename} (legacy={use_legacy})")

    # Dosya validasyonu
    if not file.filename:
        raise HTTPException(status_code=400, detail="Dosya adı gerekli")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyaları kabul edilir")

    # Dosya boyutu kontrolü (max 10MB)
    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)

    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'dan küçük olmalı")

    if not contents:
        raise HTTPException(status_code=400, detail="Dosya boş")

    # Geçici dosyaya yaz ve parse et
    tmp_path = None
    start_time = datetime.now()

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Seçilen parser'ı kullan
        active_parser = legacy_parser if use_legacy else parser
        active_classifier = legacy_classifier if use_legacy else classifier

        # PDF'i parse et
        raw_transactions = active_parser.extract_transactions(tmp_path)
        logger.info(f"Extracted {len(raw_transactions)} raw transactions")

        # Kategorize et
        transactions = []
        errors = []

        for tx in raw_transactions:
            try:
                amount = tx.get('amount', None)
                classification = active_classifier.classify(tx['description'], amount)

                tx['category'] = classification['category']
                tx['categoryId'] = classification['categoryId']
                tx['confidence'] = classification['confidence']

                # Enhanced parser returns these already, but add for legacy
                if 'type' not in classification:
                    tx['type'] = 'income' if amount >= 0 else 'expense'
                else:
                    tx['type'] = classification['type']

                transactions.append(tx)
            except Exception as e:
                logger.error(f"Classification error: {e}")
                errors.append(f"Sınıflandırma hatası: {tx.get('description', 'Bilinmiyor')} - {str(e)}")

        processing_time = (datetime.now() - start_time).total_seconds()

        # Generate statistics
        stats = {
            'total_transactions': len(transactions),
            'by_type': {
                'income': len([t for t in transactions if t.get('amount', 0) >= 0]),
                'expense': len([t for t in transactions if t.get('amount', 0) < 0])
            },
            'by_confidence': {
                'high': len([t for t in transactions if t.get('confidence', 0) >= 80]),
                'medium': len([t for t in transactions if 60 <= t.get('confidence', 0) < 80]),
                'low': len([t for t in transactions if t.get('confidence', 0) < 60])
            },
            'file_size_mb': round(file_size_mb, 2),
            'processing_time_seconds': round(processing_time, 2),
            'parser_version': 'legacy' if use_legacy else 'enhanced'
        }

        logger.info(f"Successfully parsed {len(transactions)} transactions in {processing_time:.2f}s")

        return {
            "success": True,
            "filename": file.filename,
            "transactions": transactions,
            "total": len(transactions),
            "errors": errors,
            "statistics": stats
        }

    except Exception as e:
        logger.error(f"PDF parsing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"PDF işleme hatası: {str(e)}"
        )
    finally:
        # Geçici dosyayı temizle
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")


@app.post("/classify")
async def classify_text(data: dict):
    """
    Tek bir açıklamayı kategorize et (Gelişmiş classifier).

    Body:
        - description: str (required)
        - amount: float (optional, for better classification)

    Returns:
        - category, categoryId, confidence, type, match_type
    """
    description = data.get('description', '')
    if not description:
        raise HTTPException(status_code=400, detail="description alanı gerekli")

    amount = data.get('amount', None)
    result = classifier.classify(description, amount)
    return result


@app.post("/classify/bulk")
async def classify_bulk(data: dict):
    """
    Birden fazla açıklamayı toplu kategorize et.

    Body:
        - transactions: list of {description: str, amount?: float}

    Returns:
        - classified_transactions: list
        - total: int
    """
    transactions = data.get('transactions', [])
    if not transactions:
        raise HTTPException(status_code=400, detail="transactions listesi gerekli")

    results = classifier.classify_bulk(transactions)
    return {
        "classified_transactions": results,
        "total": len(results)
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "detail": "Beklenmeyen bir hata oluştu"
        }
    )
