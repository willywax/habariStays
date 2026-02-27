"""
Backend API tests for Hotel Edit Feature - Iteration 5
Tests the new room_type_count and has_default_rooms fields in hotel endpoints
Tests admin all-hotels, owner hotels, hotel full detail, and PATCH hotel endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@habaristays.com"
ADMIN_PASSWORD = "admin123"

@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, f"No access_token in response: {data}"
    return data["access_token"]


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client


class TestAdminAllHotels:
    """Test GET /api/admin/all-hotels endpoint - should return room_type_count and has_default_rooms"""

    def test_admin_all_hotels_returns_200(self, auth_client):
        """Admin can fetch all hotels"""
        response = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of hotels"
        print(f"✓ GET /api/admin/all-hotels returns 200 with {len(data)} hotels")

    def test_admin_all_hotels_has_room_type_count(self, auth_client):
        """Hotels should have room_type_count field"""
        response = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) > 0, "Should have at least one hotel"
        first_hotel = data[0]
        
        assert "room_type_count" in first_hotel, f"Missing room_type_count field. Keys: {first_hotel.keys()}"
        assert isinstance(first_hotel["room_type_count"], int), "room_type_count should be an integer"
        print(f"✓ First hotel has room_type_count: {first_hotel['room_type_count']}")

    def test_admin_all_hotels_has_default_rooms_field(self, auth_client):
        """Hotels should have has_default_rooms boolean field"""
        response = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) > 0, "Should have at least one hotel"
        first_hotel = data[0]
        
        assert "has_default_rooms" in first_hotel, f"Missing has_default_rooms field. Keys: {first_hotel.keys()}"
        assert isinstance(first_hotel["has_default_rooms"], bool), "has_default_rooms should be a boolean"
        print(f"✓ First hotel has has_default_rooms: {first_hotel['has_default_rooms']}")

    def test_admin_all_hotels_contains_expected_fields(self, auth_client):
        """Hotels should contain all expected fields"""
        response = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) > 0
        first_hotel = data[0]
        
        expected_fields = ["id", "name", "city", "status", "room_type_count", "has_default_rooms", "total_rooms", "has_rooms", "photo_count"]
        for field in expected_fields:
            assert field in first_hotel, f"Missing field '{field}'. Available: {list(first_hotel.keys())}"
        print(f"✓ All expected fields present in admin/all-hotels response")


class TestHotelFullDetail:
    """Test GET /api/hotels/:hotelId/full endpoint"""

    def test_hotel_full_returns_200(self, api_client, auth_client):
        """Can fetch full hotel detail"""
        # First get a hotel ID
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        assert hotels_res.status_code == 200
        hotels = hotels_res.json()
        assert len(hotels) > 0
        
        hotel_id = hotels[0]["id"]
        response = api_client.get(f"{BASE_URL}/api/hotels/{hotel_id}/full")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/hotels/{hotel_id}/full returns 200")

    def test_hotel_full_has_room_types(self, api_client, auth_client):
        """Full hotel detail should include room_types array"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/hotels/{hotel_id}/full")
        assert response.status_code == 200
        data = response.json()
        
        assert "room_types" in data, f"Missing room_types. Keys: {data.keys()}"
        assert isinstance(data["room_types"], list), "room_types should be a list"
        print(f"✓ Hotel full detail has room_types: {len(data['room_types'])} types")

    def test_hotel_full_has_default_rooms_field(self, api_client, auth_client):
        """Full hotel detail should have has_default_rooms boolean"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/hotels/{hotel_id}/full")
        assert response.status_code == 200
        data = response.json()
        
        assert "has_default_rooms" in data, f"Missing has_default_rooms. Keys: {data.keys()}"
        assert isinstance(data["has_default_rooms"], bool), "has_default_rooms should be boolean"
        
        # Also verify room_type_count
        assert "room_type_count" in data, "Missing room_type_count"
        assert isinstance(data["room_type_count"], int), "room_type_count should be integer"
        print(f"✓ Hotel full has has_default_rooms={data['has_default_rooms']}, room_type_count={data['room_type_count']}")

    def test_hotel_full_has_expected_fields(self, api_client, auth_client):
        """Full hotel detail should contain all expected fields"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/hotels/{hotel_id}/full")
        assert response.status_code == 200
        data = response.json()
        
        expected_fields = ["id", "name", "city", "room_types", "has_default_rooms", "room_type_count", 
                         "total_rooms", "available_rooms", "reviews", "average_rating"]
        for field in expected_fields:
            assert field in data, f"Missing field '{field}'. Available: {list(data.keys())}"
        print("✓ All expected fields present in hotel full detail")


class TestPatchHotel:
    """Test PATCH /api/hotels/:hotelId endpoint with admin permissions"""

    def test_admin_can_patch_hotel_name(self, auth_client):
        """Admin can update hotel name"""
        # Get a hotel
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        original_name = hotels[0]["name"]
        
        # Patch the name
        test_name = f"TEST_PATCH_{original_name}"
        response = auth_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"name": test_name})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == test_name, f"Name not updated. Expected: {test_name}, Got: {data['name']}"
        print(f"✓ Admin can patch hotel name")
        
        # Restore original name
        restore_res = auth_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"name": original_name})
        assert restore_res.status_code == 200

    def test_admin_can_patch_hotel_city(self, auth_client):
        """Admin can update hotel city"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        original_city = hotels[0]["city"]
        
        # Patch the city
        response = auth_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"city": "Arusha"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["city"] == "Arusha", f"City not updated. Got: {data['city']}"
        print(f"✓ Admin can patch hotel city")
        
        # Restore original city
        auth_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"city": original_city})

    def test_admin_can_patch_hotel_description(self, auth_client):
        """Admin can update hotel description"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        
        test_description = "Test description from pytest"
        response = auth_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"description": test_description})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("description") == test_description, f"Description not updated"
        print(f"✓ Admin can patch hotel description")

    def test_admin_can_patch_hotel_amenities(self, auth_client):
        """Admin can update hotel amenities"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        
        test_amenities = ["WiFi", "Parking"]
        response = auth_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"amenities": test_amenities})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("amenities") == test_amenities, f"Amenities not updated correctly"
        print(f"✓ Admin can patch hotel amenities")

    def test_patch_hotel_requires_auth(self, api_client, auth_client):
        """Patch hotel requires authentication"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        hotel_id = hotels[0]["id"]
        
        # Try without auth
        plain_client = requests.Session()
        plain_client.headers.update({"Content-Type": "application/json"})
        response = plain_client.patch(f"{BASE_URL}/api/hotels/{hotel_id}", json={"name": "Test"})
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ PATCH hotel requires authentication (returns {response.status_code})")

    def test_patch_nonexistent_hotel_returns_404(self, auth_client):
        """Patch non-existent hotel returns 404"""
        response = auth_client.patch(f"{BASE_URL}/api/hotels/nonexistent-hotel-id-12345", json={"name": "Test"})
        assert response.status_code == 404, f"Expected 404 for nonexistent hotel, got {response.status_code}"
        print("✓ PATCH nonexistent hotel returns 404")


class TestOwnerHotelsEndpoint:
    """Test GET /api/owner/hotels endpoint returns room_type_count and has_default_rooms"""

    def test_owner_hotels_returns_data_for_admin(self, auth_client):
        """Admin can access owner hotels endpoint (sees all hotels)"""
        response = auth_client.get(f"{BASE_URL}/api/owner/hotels")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/owner/hotels returns 200 with {len(data)} hotels")

    def test_owner_hotels_has_room_type_count(self, auth_client):
        """Owner hotels endpoint should have room_type_count field"""
        response = auth_client.get(f"{BASE_URL}/api/owner/hotels")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            first_hotel = data[0]
            assert "room_type_count" in first_hotel, f"Missing room_type_count. Keys: {first_hotel.keys()}"
            assert isinstance(first_hotel["room_type_count"], int)
            print(f"✓ Owner hotels has room_type_count: {first_hotel['room_type_count']}")
        else:
            print("⚠ No hotels in owner endpoint response")

    def test_owner_hotels_has_default_rooms_field(self, auth_client):
        """Owner hotels endpoint should have has_default_rooms field"""
        response = auth_client.get(f"{BASE_URL}/api/owner/hotels")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            first_hotel = data[0]
            assert "has_default_rooms" in first_hotel, f"Missing has_default_rooms. Keys: {first_hotel.keys()}"
            assert isinstance(first_hotel["has_default_rooms"], bool)
            print(f"✓ Owner hotels has has_default_rooms: {first_hotel['has_default_rooms']}")
        else:
            print("⚠ No hotels in owner endpoint response")


class TestDefaultRoomsLogic:
    """Test that has_default_rooms accurately reflects room type is_default status"""

    def test_has_default_rooms_matches_room_types(self, api_client, auth_client):
        """has_default_rooms should match actual room type is_default values"""
        hotels_res = auth_client.get(f"{BASE_URL}/api/admin/all-hotels")
        hotels = hotels_res.json()
        
        # Find a hotel that has_default_rooms = true
        hotel_with_defaults = None
        for hotel in hotels:
            if hotel.get("has_default_rooms"):
                hotel_with_defaults = hotel
                break
        
        if hotel_with_defaults:
            # Verify by getting full detail
            full_res = api_client.get(f"{BASE_URL}/api/hotels/{hotel_with_defaults['id']}/full")
            assert full_res.status_code == 200
            full_data = full_res.json()
            
            has_default_in_rooms = any(r.get("is_default") for r in full_data.get("room_types", []))
            assert has_default_in_rooms == full_data.get("has_default_rooms"), \
                f"Mismatch: room_types is_default={has_default_in_rooms}, has_default_rooms={full_data.get('has_default_rooms')}"
            print(f"✓ has_default_rooms correctly matches room types is_default status")
        else:
            print("⚠ No hotel with has_default_rooms=true found, skipping verification")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
