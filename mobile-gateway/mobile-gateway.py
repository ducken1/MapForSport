from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import httpx
import grpc
import asyncio
from typing import Optional, Dict, Any
import logging
from pydantic import BaseModel
from datetime import datetime
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mobile-gateway.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MobileGateway")

app = FastAPI(
    title="Mobile API Gateway",
    description="API Gateway for Mobile Applications",
    version="1.0.0"
)

# CORS middleware for mobile apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify mobile app origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
AUTH_SERVICE_URL = "http://localhost:8000"
RESERVATION_SERVICE_URL = "http://localhost:8080"
FACILITY_GRPC_HOST = "localhost:50051"

# Pydantic models for mobile-specific requests
class MobileUserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    device_id: Optional[str] = None
    push_token: Optional[str] = None

class MobileUserLogin(BaseModel):
    email: str
    password: str
    device_id: Optional[str] = None
    push_token: Optional[str] = None

class MobileFacilityCreate(BaseModel):
    name: str
    description: str
    location: Optional[Dict[str, float]] = None  # GPS coordinates for mobile

class MobileReservation(BaseModel):
    facility_id: str
    user_email: str
    start_time: str
    end_time: str
    notes: Optional[str] = None
    device_info: Optional[Dict[str, str]] = None

class QuickBookingRequest(BaseModel):
    facility_id: str
    duration_minutes: int = 60

# Middleware to log requests
@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"{request.method} {request.url.path} - Mobile Gateway")
    response = await call_next(request)
    return response

# Dependency to extract mobile device info
async def get_device_info(
    user_agent: str = Header(None),
    x_device_id: str = Header(None),
    x_app_version: str = Header(None)
):
    return {
        "user_agent": user_agent,
        "device_id": x_device_id,
        "app_version": x_app_version
    }

# ============= MOBILE AUTH ROUTES =============

@app.post("/mobile/auth/register")
async def mobile_register(user: MobileUserCreate):
    """Mobile-specific registration with device tracking"""
    try:
        async with httpx.AsyncClient() as client:
            # Prepare payload for auth service
            auth_payload = {
                "email": user.email,
                "password": user.password,
                "full_name": user.full_name
            }
            
            response = await client.post(
                f"{AUTH_SERVICE_URL}/auth/register",
                json=auth_payload
            )
            
            if response.status_code == 200:
                logger.info(f"Mobile user registered: {user.email}, device: {user.device_id}")
                result = response.json()
                # Add mobile-specific response data
                result["mobile_registration"] = True
                result["device_registered"] = user.device_id is not None
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("detail", "Registration failed")
                )
                
    except httpx.RequestError as e:
        logger.error(f"Mobile registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")

@app.post("/mobile/auth/login")
async def mobile_login(user: MobileUserLogin):
    """Mobile-specific login with device tracking"""
    try:
        async with httpx.AsyncClient() as client:
            auth_payload = {
                "email": user.email,
                "password": user.password
            }
            
            response = await client.post(
                f"{AUTH_SERVICE_URL}/auth/login",
                json=auth_payload
            )
            
            if response.status_code == 200:
                logger.info(f"Mobile user logged in: {user.email}, device: {user.device_id}")
                result = response.json()
                # Add mobile-specific response data
                result["mobile_login"] = True
                result["device_id"] = user.device_id
                result["push_notifications_enabled"] = user.push_token is not None
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("detail", "Login failed")
                )
                
    except httpx.RequestError as e:
        logger.error(f"Mobile login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")

# ============= MOBILE FACILITY ROUTES =============

@app.get("/mobile/facilities/nearby")
async def get_nearby_facilities(
    lat: float,
    lng: float,
    radius: int = 5000,  # radius in meters
    device_info: dict = Depends(get_device_info)
):
    """Get facilities near user's location (mobile-specific)"""
    logger.info(f"Nearby facilities requested for location: {lat}, {lng}")
    
    # This would integrate with your facility service to get location-based results
    # For now, returning mock data
    return {
        "facilities": [
            {
                "id": "1",
                "name": "Tennis Court A",
                "description": "Professional tennis court",
                "distance_meters": 150,
                "coordinates": {"lat": lat + 0.001, "lng": lng + 0.001}
            },
            {
                "id": "2", 
                "name": "Basketball Court",
                "description": "Outdoor basketball court",
                "distance_meters": 300,
                "coordinates": {"lat": lat + 0.002, "lng": lng + 0.001}
            }
        ],
        "search_location": {"lat": lat, "lng": lng},
        "search_radius": radius
    }

@app.get("/mobile/facilities/{facility_id}")
async def get_mobile_facility(facility_id: str):
    """Get facility details with mobile-optimized data"""
    # Here you would call your gRPC facility service
    # For demonstration, returning mock data with mobile-specific fields
    
    logger.info(f"Mobile facility details requested: {facility_id}")
    
    return {
        "id": facility_id,
        "name": "Tennis Court A",
        "description": "Professional tennis court with lighting",
        "mobile_optimized": True,
        "images": ["thumb_1.jpg", "thumb_2.jpg"],  # Mobile-optimized thumbnails
        "available_times_today": [
            {"start": "09:00", "end": "10:00", "available": True},
            {"start": "10:00", "end": "11:00", "available": False},
            {"start": "11:00", "end": "12:00", "available": True}
        ],
        "rating": 4.5,
        "amenities": ["Lighting", "Equipment rental", "Parking"]
    }

@app.get("/mobile/facilities/{facility_id}/availability")
async def get_facility_availability(
    facility_id: str,
    date: Optional[str] = None
):
    """Get real-time availability for mobile quick booking"""
    logger.info(f"Availability check for facility {facility_id}")
    
    # This would integrate with your facility gRPC service
    return {
        "facility_id": facility_id,
        "date": date or datetime.now().strftime("%Y-%m-%d"),
        "available_slots": [
            {"start": "09:00", "end": "10:00", "price": 25.00},
            {"start": "11:00", "end": "12:00", "price": 25.00},
            {"start": "14:00", "end": "15:00", "price": 30.00},
            {"start": "16:00", "end": "17:00", "price": 35.00}
        ],
        "currency": "EUR"
    }

# ============= MOBILE RESERVATION ROUTES =============

@app.post("/mobile/reservations")
async def create_mobile_reservation(reservation: MobileReservation):
    """Create reservation with mobile-specific features"""
    try:
        async with httpx.AsyncClient() as client:
            # Prepare payload for reservation service
            reservation_payload = {
                "facilityId": reservation.facility_id,
                "userEmail": reservation.user_email,
                "startTime": reservation.start_time,
                "endTime": reservation.end_time,
                "notes": reservation.notes or ""
            }
            
            response = await client.post(
                f"{RESERVATION_SERVICE_URL}/reservations",
                json=reservation_payload
            )
            
            if response.status_code == 200:
                logger.info(f"Mobile reservation created for user: {reservation.user_email}")
                result = response.json()
                # Add mobile-specific response data
                result["mobile_booking"] = True
                result["push_notification_sent"] = True
                result["calendar_invite_available"] = True
                return result
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to create reservation"
                )
                
    except httpx.RequestError as e:
        logger.error(f"Mobile reservation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Reservation service unavailable")

@app.post("/mobile/reservations/quick-book")
async def quick_book_facility(
    booking: QuickBookingRequest,
    device_info: dict = Depends(get_device_info)
):
    """Quick booking feature for mobile - book next available slot"""
    logger.info(f"Quick booking requested for facility: {booking.facility_id}")
    
    # This would find the next available slot and create reservation
    # For demo purposes, returning success response
    
    return {
        "reservation_id": "quick_12345",
        "facility_id": booking.facility_id,
        "start_time": "14:00",
        "end_time": "15:00",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "status": "confirmed",
        "quick_booking": True,
        "price": 30.00,
        "currency": "EUR",
        "confirmation_code": "QB12345"
    }

@app.get("/mobile/reservations/user/{user_email}")
async def get_user_reservations_mobile(user_email: str):
    """Get user reservations with mobile-optimized response"""
    logger.info(f"Mobile reservations requested for user: {user_email}")
    
    # This would call your reservation service
    return {
        "user_email": user_email,
        "reservations": [
            {
                "id": "res_123",
                "facility_name": "Tennis Court A",
                "date": "2025-06-12",
                "start_time": "14:00",
                "end_time": "15:00",
                "status": "confirmed",
                "can_cancel": True,
                "facility_image": "thumb_tennis.jpg"
            }
        ],
        "upcoming_count": 1,
        "mobile_optimized": True
    }

@app.delete("/mobile/reservations/{reservation_id}")
async def cancel_mobile_reservation(reservation_id: str):
    """Cancel reservation with mobile-specific handling"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{RESERVATION_SERVICE_URL}/reservations/{reservation_id}"
            )
            
            if response.status_code == 200:
                logger.info(f"Mobile reservation cancelled: {reservation_id}")
                return {
                    "message": "Reservation cancelled successfully",
                    "reservation_id": reservation_id,
                    "refund_processed": True,
                    "mobile_notification_sent": True
                }
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to cancel reservation"
                )
                
    except httpx.RequestError as e:
        logger.error(f"Mobile cancellation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Reservation service unavailable")

# ============= MOBILE-SPECIFIC FEATURES =============

@app.get("/mobile/user/profile")
async def get_mobile_user_profile(
    user_email: str,
    device_info: dict = Depends(get_device_info)
):
    """Get user profile with mobile-specific data"""
    logger.info(f"Mobile profile requested for: {user_email}")
    
    return {
        "email": user_email,
        "mobile_preferences": {
            "push_notifications": True,
            "location_services": True,
            "quick_booking_enabled": True
        },
        "recent_facilities": ["facility_1", "facility_2"],
        "favorite_facilities": ["facility_1"],
        "total_bookings": 15,
        "loyalty_points": 150
    }

@app.post("/mobile/notifications/register")
async def register_push_notifications(
    user_email: str,
    push_token: str,
    device_info: dict = Depends(get_device_info)
):
    """Register device for push notifications"""
    logger.info(f"Push notification registered for: {user_email}")
    
    # Here you would store the push token for the user
    return {
        "message": "Push notifications registered successfully",
        "user_email": user_email,
        "device_registered": True
    }

@app.get("/mobile/health")
async def mobile_health_check():
    """Health check for mobile gateway"""
    return {
        "status": "OK",
        "gateway": "Mobile API Gateway",
        "timestamp": datetime.now().isoformat(),
        "mobile_features": [
            "location_services",
            "push_notifications", 
            "quick_booking",
            "offline_support"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "mobile_gateway:app",
        host="0.0.0.0",
        port=3001,
        log_level="info",
        reload=True
    )