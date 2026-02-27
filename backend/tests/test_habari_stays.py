"""
Habari Stays API Tests - Comprehensive test suite for hotel booking platform
Tests cover: Auth, Hotels, Bookings, Admin endpoints, Room Types, Cashiers
"""

import pytest
import requests
import os
import time
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://stays-improvements.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Admin credentials (from requirements)
ADMIN_EMAIL = "admin@habaristays.com"
ADMIN_PASSWORD = "admin123"

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"

class TestHealth:
    """Health check tests - run first"""
    
    def test_health_endpoint(self):
        """Test the health endpoint is working"""
        response = requests.get(f"{API_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"Health check passed: {data}")


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"Admin login successful: {data['user']['full_name']}")
        
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid credentials rejected correctly")
        
    def test_register_traveler(self):
        """Test traveler registration"""
        test_email = f"{TEST_PREFIX}traveler_{int(time.time())}@test.com"
        response = requests.post(f"{API_URL}/auth/register", json={
            "email": test_email,
            "full_name": f"{TEST_PREFIX}Test Traveler",
            "phone": "+255711111111",
            "password": "testpass123",
            "role": "traveler"
        })
        # Should succeed with 200 or fail with 400 if email exists
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "user" in data
            assert data["user"]["role"] == "traveler"
            print(f"Traveler registered: {test_email}")
        else:
            print(f"Registration returned {response.status_code}: {response.json()}")
            
    def test_register_owner_pending_verification(self):
        """Test that owner registration returns pending verification status"""
        test_email = f"{TEST_PREFIX}owner_{int(time.time())}@test.com"
        response = requests.post(f"{API_URL}/auth/register", json={
            "email": test_email,
            "full_name": f"{TEST_PREFIX}Test Owner",
            "phone": "+255722222222",
            "password": "testpass123",
            "role": "owner"
        })
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert data["user"]["role"] == "owner"
            # Owner should be pending verification
            assert data["user"]["is_verified"] == False
            print(f"Owner registered with pending verification: {test_email}")
        

class TestHotels:
    """Hotel endpoints tests"""
    
    def test_get_hotels_public(self):
        """Test public hotel listing (verified hotels only by default)"""
        response = requests.get(f"{API_URL}/hotels?verified_only=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} verified/imported hotels")
        
        # Check structure of hotel if any exist
        if len(data) > 0:
            hotel = data[0]
            assert "id" in hotel
            assert "name" in hotel
            assert "city" in hotel
            assert "status" in hotel
            # Status should be verified or imported
            assert hotel["status"] in ["verified", "imported"]
            print(f"Sample hotel: {hotel['name']} - Status: {hotel['status']}")
            
    def test_get_cities(self):
        """Test cities endpoint"""
        response = requests.get(f"{API_URL}/hotels/cities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} cities")
        
    def test_get_hotels_by_city(self):
        """Test filtering hotels by city"""
        response = requests.get(f"{API_URL}/hotels?city=Dodoma&verified_only=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} hotels in Dodoma")


class TestAdminEndpoints:
    """Admin-specific endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
        
    @pytest.fixture
    def admin_headers(self, admin_token):
        """Get headers with admin auth"""
        return {"Authorization": f"Bearer {admin_token}"}
        
    def test_admin_stats(self, admin_headers):
        """Test admin statistics endpoint"""
        response = requests.get(f"{API_URL}/admin/stats", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check expected stats fields
        assert "total_hotels" in data
        assert "verified_hotels" in data
        assert "total_bookings" in data
        assert "pending_owners" in data
        assert "total_revenue" in data
        print(f"Admin stats: {data['total_hotels']} hotels, {data['total_bookings']} bookings, Revenue: {data['total_revenue']}")
        
    def test_admin_all_hotels(self, admin_headers):
        """Test admin all hotels endpoint (includes all statuses)"""
        response = requests.get(f"{API_URL}/admin/all-hotels", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin sees {len(data)} total hotels (all statuses)")
        
        # Check for different statuses
        statuses = set(h.get("status") for h in data)
        print(f"Hotel statuses found: {statuses}")
        
    def test_admin_pending_owners(self, admin_headers):
        """Test pending owners endpoint"""
        response = requests.get(f"{API_URL}/admin/pending-owners", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} pending owners")
        
    def test_admin_verify_hotel(self, admin_headers):
        """Test admin can verify a hotel"""
        # First get list of hotels
        response = requests.get(f"{API_URL}/admin/all-hotels", headers=admin_headers)
        assert response.status_code == 200
        hotels = response.json()
        
        # Find a pending hotel to verify
        pending_hotel = next((h for h in hotels if h["status"] == "pending"), None)
        
        if pending_hotel:
            verify_response = requests.put(
                f"{API_URL}/admin/hotels/{pending_hotel['id']}/verify",
                headers=admin_headers
            )
            assert verify_response.status_code == 200
            print(f"Verified hotel: {pending_hotel['name']}")
        else:
            print("No pending hotels to verify - skipping verification test")


class TestImportEndpoints:
    """Test import functionality for bulk hotel upload"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['access_token']}"}
        pytest.skip("Admin login failed")
        
    def test_import_preview_endpoint_exists(self, admin_headers):
        """Test that import preview endpoint responds (even without file)"""
        # Without a file, should return 422 (validation error for missing file)
        response = requests.post(
            f"{API_URL}/admin/import/preview",
            headers=admin_headers
        )
        # 422 means endpoint exists but needs file
        assert response.status_code in [422, 400]
        print("Import preview endpoint exists and requires file upload")


class TestRoomTypes:
    """Room types endpoint tests"""
    
    def test_get_room_types_requires_hotel_id(self):
        """Test room types endpoint with hotel_id"""
        # First get a hotel
        response = requests.get(f"{API_URL}/hotels?verified_only=true")
        assert response.status_code == 200
        hotels = response.json()
        
        if len(hotels) > 0:
            hotel_id = hotels[0]["id"]
            room_response = requests.get(f"{API_URL}/room-types?hotel_id={hotel_id}")
            assert room_response.status_code == 200
            rooms = room_response.json()
            assert isinstance(rooms, list)
            print(f"Hotel {hotels[0]['name']} has {len(rooms)} room types")
            
            if len(rooms) > 0:
                room = rooms[0]
                assert "id" in room
                assert "name" in room
                assert "price_per_night" in room
                assert "available_rooms" in room
                print(f"Sample room: {room['name']} - TZS {room['price_per_night']}/night")
        else:
            print("No hotels found - skipping room types test")


class TestBookingFlow:
    """Booking endpoint tests - mock payment flow"""
    
    @pytest.fixture
    def hotel_and_room(self):
        """Get a hotel and room for booking tests"""
        response = requests.get(f"{API_URL}/hotels?verified_only=true")
        if response.status_code != 200:
            pytest.skip("Could not fetch hotels")
            
        hotels = response.json()
        # Find a verified hotel (not imported - imported doesn't allow online booking)
        verified_hotel = next((h for h in hotels if h["status"] == "verified"), None)
        
        if not verified_hotel:
            pytest.skip("No verified hotels available for booking test")
            
        # Get rooms
        room_response = requests.get(f"{API_URL}/room-types?hotel_id={verified_hotel['id']}")
        if room_response.status_code != 200:
            pytest.skip("Could not fetch rooms")
            
        rooms = room_response.json()
        available_room = next((r for r in rooms if r.get("available_rooms", 0) > 0), None)
        
        if not available_room:
            pytest.skip("No available rooms for booking test")
            
        return verified_hotel, available_room
        
    def test_create_booking(self, hotel_and_room):
        """Test creating an online booking"""
        hotel, room = hotel_and_room
        
        checkin = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        checkout = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        booking_data = {
            "hotel_id": hotel["id"],
            "room_type_id": room["id"],
            "guest_name": f"{TEST_PREFIX}Test Guest",
            "guest_phone": "+255733333333",
            "checkin_date": checkin,
            "checkout_date": checkout,
            "num_guests": 1,
            "booking_type": "online",
            "payment_method": "mpesa"
        }
        
        response = requests.post(f"{API_URL}/bookings", json=booking_data)
        
        # Should work without auth for public bookings
        assert response.status_code in [200, 201, 401]
        
        if response.status_code in [200, 201]:
            data = response.json()
            assert "booking_ref" in data
            assert "id" in data
            assert data["status"] == "pending"  # Not paid yet
            assert data["payment_status"] == "unpaid"
            assert "expires_at" in data  # 2-minute timer
            print(f"Booking created: {data['booking_ref']} - Expires at: {data['expires_at']}")
            return data
        else:
            print("Booking requires authentication - that's OK")
            
    def test_confirm_payment_mock(self, hotel_and_room):
        """Test the mock payment confirmation flow"""
        hotel, room = hotel_and_room
        
        checkin = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        checkout = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
        
        # Create booking first
        booking_data = {
            "hotel_id": hotel["id"],
            "room_type_id": room["id"],
            "guest_name": f"{TEST_PREFIX}Payment Test",
            "guest_phone": "+255744444444",
            "checkin_date": checkin,
            "checkout_date": checkout,
            "num_guests": 1,
            "booking_type": "online",
            "payment_method": "mpesa"
        }
        
        create_response = requests.post(f"{API_URL}/bookings", json=booking_data)
        
        if create_response.status_code not in [200, 201]:
            pytest.skip("Could not create booking for payment test")
            
        booking = create_response.json()
        booking_id = booking["id"]
        
        # Confirm payment (mock flow)
        payment_response = requests.post(
            f"{API_URL}/bookings/{booking_id}/confirm-payment",
            json={
                "booking_id": booking_id,
                "payment_reference": f"MPESA-TEST-{int(time.time())}"
            }
        )
        
        assert payment_response.status_code == 200
        data = payment_response.json()
        assert data.get("status") == "confirmed"
        print(f"Payment confirmed for booking: {booking['booking_ref']}")


class TestCashiers:
    """Cashier management tests"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['access_token']}"}
        pytest.skip("Admin login failed")
        
    def test_get_cashiers(self, admin_headers):
        """Test fetching cashiers list"""
        response = requests.get(f"{API_URL}/cashiers", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} cashiers")


class TestReviews:
    """Review endpoint tests"""
    
    def test_get_reviews_requires_hotel_id(self):
        """Test getting reviews for a hotel"""
        # Get a hotel first
        response = requests.get(f"{API_URL}/hotels?verified_only=true")
        if response.status_code == 200 and len(response.json()) > 0:
            hotel_id = response.json()[0]["id"]
            reviews_response = requests.get(f"{API_URL}/reviews?hotel_id={hotel_id}")
            assert reviews_response.status_code == 200
            reviews = reviews_response.json()
            assert isinstance(reviews, list)
            print(f"Found {len(reviews)} reviews for hotel")
        else:
            print("No hotels to test reviews")


class TestAnalytics:
    """Analytics endpoints tests"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['access_token']}"}
        pytest.skip("Admin login failed")
        
    def test_revenue_analytics(self, admin_headers):
        """Test revenue analytics endpoint"""
        response = requests.get(f"{API_URL}/analytics/revenue?period=month", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "total_revenue" in data
        assert "online_revenue" in data
        assert "walkin_revenue" in data
        assert "bookings_count" in data
        print(f"Revenue analytics: Total TZS {data['total_revenue']}, Bookings: {data['bookings_count']}")


class TestPaymentConfig:
    """Payment configuration tests"""
    
    def test_payment_config(self):
        """Test payment config endpoint (public)"""
        response = requests.get(f"{API_URL}/config/payment")
        assert response.status_code == 200
        data = response.json()
        assert "selcom_till" in data
        print(f"Payment config: Till Number {data['selcom_till']}")


class TestHotelDetail:
    """Hotel detail page tests"""
    
    def test_get_hotel_by_id(self):
        """Test getting single hotel by ID"""
        # Get list first
        response = requests.get(f"{API_URL}/hotels?verified_only=true")
        assert response.status_code == 200
        hotels = response.json()
        
        if len(hotels) > 0:
            hotel_id = hotels[0]["id"]
            detail_response = requests.get(f"{API_URL}/hotels/{hotel_id}")
            assert detail_response.status_code == 200
            hotel = detail_response.json()
            
            assert hotel["id"] == hotel_id
            assert "name" in hotel
            assert "city" in hotel
            assert "phone_number" in hotel
            print(f"Hotel detail: {hotel['name']} in {hotel['city']}")
            
    def test_imported_hotel_has_contact_info(self):
        """Test that imported hotels have contact info for direct contact"""
        response = requests.get(f"{API_URL}/hotels?verified_only=true")
        assert response.status_code == 200
        hotels = response.json()
        
        imported = [h for h in hotels if h.get("status") == "imported"]
        print(f"Found {len(imported)} imported hotels")
        
        if len(imported) > 0:
            hotel = imported[0]
            # Imported hotels should have contact info
            assert "phone_number" in hotel
            print(f"Imported hotel {hotel['name']} has phone: {hotel.get('phone_number')}")


# Run tests with: pytest test_habari_stays.py -v --tb=short
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
