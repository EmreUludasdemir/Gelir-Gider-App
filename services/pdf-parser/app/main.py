from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import tempfile
import os

from .parser import PDFParser
from .classifier import TransactionClassifier

app = FastAPI(
    title="PDF Parser Service",
    description="Banka ekstrelerini parse eden mikroservis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

parser = PDFParser()
classifier = TransactionClassifier()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "pdf-parser",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.post("/parse")
async def parse_pdf(file: UploadFile = File(...)):
    """
    PDF dosyasını parse et ve işlemleri çıkar.

    Returns:
        - success: bool
        - transactions: list of parsed transactions
        - total: total count
        - errors: any parsing errors
    """
    # Dosya validasyonu
    if not file.filename:
        raise HTTPException(status_code=400, detail="Dosya adı gerekli")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyaları kabul edilir")

    # Dosya boyutu kontrolü (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya boyutu 10MB'dan küçük olmalı")

    if not contents:
        raise HTTPException(status_code=400, detail="Dosya boş")

    # Geçici dosyaya yaz ve parse et
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # PDF'i parse et
        raw_transactions = parser.extract_transactions(tmp_path)

        # Kategorize et
        transactions = []
        errors = []

        for tx in raw_transactions:
            try:
                classification = classifier.classify(tx['description'])
                tx['category'] = classification['category']
                tx['categoryId'] = classification['categoryId']
                tx['confidence'] = classification['confidence']
                transactions.append(tx)
            except Exception as e:
                errors.append(f"Sınıflandırma hatası: {tx.get('description', 'Bilinmiyor')} - {str(e)}")

        return {
            "success": True,
            "filename": file.filename,
            "transactions": transactions,
            "total": len(transactions),
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF işleme hatası: {str(e)}"
        )
    finally:
        # Geçici dosyayı temizle
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/classify")
async def classify_text(data: dict):
    """
    Tek bir açıklamayı kategorize et.

    Body:
        - description: str

    Returns:
        - category, categoryId, confidence
    """
    description = data.get('description', '')
    if not description:
        raise HTTPException(status_code=400, detail="description alanı gerekli")

    result = classifier.classify(description)
    return result


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
