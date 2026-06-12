from fastapi import APIRouter, HTTPException
from app.models.schemas import CertificateRequest, SafetyCertificate
from app.services.certificate_generator import generate_certificate

router = APIRouter()


@router.post("/certificate", response_model=SafetyCertificate)
async def certificate(request: CertificateRequest):
    try:
        return await generate_certificate(request)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
