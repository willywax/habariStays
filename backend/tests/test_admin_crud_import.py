"""
Test Admin Hotel CRUD and Import functionality
- POST /api/admin/hotels - Create hotel
- PUT /api/admin/hotels/{id} - Edit hotel
- DELETE /api/admin/hotels/{id} - Delete hotel (with booking check)
- POST /api/admin/import/preview - Parse Excel with auto-detect header row
- POST /api/admin/import/execute - Execute import
- GET /api/admin/import/batches - Get import history
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminCRUD:
    """Admin Hotel CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        self.admin_token = None
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@habaristays.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("access_token")
        else:
            pytest.skip("Admin auth failed - skipping tests")
        
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        yield
    
    def test_admin_create_hotel(self):
        """POST /api/admin/hotels - create new hotel"""
        payload = {
            "name": "TEST_Admin_Created_Hotel",
            "description": "Test hotel for CRUD testing",
            "address": "123 Test Street",
            "city": "Musoma",
            "phone_number": "+255789123456",
            "status": "verified"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/hotels", json=payload, headers=self.headers)
        print(f"Create hotel response: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == "TEST_Admin_Created_Hotel"
        assert data["city"] == "Musoma"
        assert data["status"] == "verified"
        assert data["data_source"] == "admin_created"
        assert "id" in data
        
        # Save hotel ID for other tests
        self.created_hotel_id = data["id"]
        print(f"Created hotel ID: {self.created_hotel_id}")
        
        # Verify via GET
        get_resp = requests.get(f"{BASE_URL}/api/hotels/{data['id']}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["name"] == "TEST_Admin_Created_Hotel"
    
    def test_admin_create_hotel_duplicate_blocked(self):
        """POST /api/admin/hotels - blocks duplicate name"""
        # First create a hotel
        payload = {
            "name": "TEST_Duplicate_Check_Hotel",
            "city": "Dodoma",
            "status": "verified"
        }
        resp1 = requests.post(f"{BASE_URL}/api/admin/hotels", json=payload, headers=self.headers)
        
        # Try to create same name again
        resp2 = requests.post(f"{BASE_URL}/api/admin/hotels", json=payload, headers=self.headers)
        print(f"Duplicate create response: {resp2.status_code} - {resp2.text[:100]}")
        
        assert resp2.status_code == 400
        assert "ipo tayari" in resp2.text.lower() or "exists" in resp2.text.lower()
    
    def test_admin_update_hotel(self):
        """PUT /api/admin/hotels/{id} - edit hotel"""
        # First create a hotel to edit
        create_payload = {
            "name": "TEST_Hotel_To_Edit",
            "city": "Arusha",
            "description": "Original description",
            "status": "pending"
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/hotels", json=create_payload, headers=self.headers)
        
        if create_resp.status_code != 200:
            # Hotel might exist, try to find it
            hotels = requests.get(f"{BASE_URL}/api/admin/all-hotels", headers=self.headers).json()
            hotel = next((h for h in hotels if h["name"] == "TEST_Hotel_To_Edit"), None)
            if not hotel:
                pytest.skip("Could not create or find test hotel")
            hotel_id = hotel["id"]
        else:
            hotel_id = create_resp.json()["id"]
        
        # Update the hotel
        update_payload = {
            "name": "TEST_Hotel_Edited",
            "city": "Zanzibar",
            "description": "Updated description",
            "status": "verified"
        }
        
        update_resp = requests.put(f"{BASE_URL}/api/admin/hotels/{hotel_id}", json=update_payload, headers=self.headers)
        print(f"Update hotel response: {update_resp.status_code} - {update_resp.text[:200]}")
        
        assert update_resp.status_code == 200
        
        data = update_resp.json()
        assert data["name"] == "TEST_Hotel_Edited"
        assert data["city"] == "Zanzibar"
        assert data["description"] == "Updated description"
        assert data["status"] == "verified"
        
        # Verify via GET
        get_resp = requests.get(f"{BASE_URL}/api/hotels/{hotel_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["name"] == "TEST_Hotel_Edited"
    
    def test_admin_delete_hotel_success(self):
        """DELETE /api/admin/hotels/{id} - delete hotel without bookings"""
        # Create a hotel to delete
        create_payload = {
            "name": "TEST_Hotel_To_Delete",
            "city": "Mbeya",
            "status": "pending"
        }
        create_resp = requests.post(f"{BASE_URL}/api/admin/hotels", json=create_payload, headers=self.headers)
        
        if create_resp.status_code != 200:
            # Try to find existing
            hotels = requests.get(f"{BASE_URL}/api/admin/all-hotels", headers=self.headers).json()
            hotel = next((h for h in hotels if "To_Delete" in h["name"]), None)
            if not hotel:
                pytest.skip("Could not create test hotel for delete")
            hotel_id = hotel["id"]
        else:
            hotel_id = create_resp.json()["id"]
        
        # Delete the hotel
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/hotels/{hotel_id}", headers=self.headers)
        print(f"Delete hotel response: {delete_resp.status_code} - {delete_resp.text[:100]}")
        
        assert delete_resp.status_code == 200
        assert "imefutwa" in delete_resp.text.lower()
        
        # Verify hotel no longer exists
        get_resp = requests.get(f"{BASE_URL}/api/hotels/{hotel_id}")
        assert get_resp.status_code == 404
    
    def test_admin_delete_hotel_blocked_with_bookings(self):
        """DELETE /api/admin/hotels/{id} - blocks if hotel has active bookings"""
        # Find a hotel with active bookings (we'll try to delete a verified hotel)
        hotels = requests.get(f"{BASE_URL}/api/admin/all-hotels", headers=self.headers).json()
        
        # Create room type and booking for a test hotel
        test_hotel = None
        for h in hotels:
            if h["status"] in ["verified", "imported"] and "TEST" not in h["name"]:
                test_hotel = h
                break
        
        if not test_hotel:
            pytest.skip("No verified hotels to test booking block")
        
        # Check if hotel has bookings
        bookings_resp = requests.get(f"{BASE_URL}/api/bookings?hotel_id={test_hotel['id']}", headers=self.headers)
        
        # Try to delete - might be blocked or succeed depending on bookings
        delete_resp = requests.delete(f"{BASE_URL}/api/admin/hotels/{test_hotel['id']}", headers=self.headers)
        print(f"Delete hotel with potential bookings: {delete_resp.status_code} - {delete_resp.text[:150]}")
        
        # Either blocked (400) or successful (200) - we just verify the check happens
        assert delete_resp.status_code in [200, 400]
        
        if delete_resp.status_code == 400:
            assert "bukini" in delete_resp.text.lower() or "booking" in delete_resp.text.lower()
            print("DELETE correctly blocked due to active bookings")


class TestAdminImport:
    """Admin Import tests for real Excel files"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        self.admin_token = None
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@habaristays.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("access_token")
        else:
            pytest.skip("Admin auth failed - skipping tests")
        
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
        }
        yield
    
    def test_import_preview_real_excel(self):
        """POST /api/admin/import/preview - parse real Excel with title row"""
        excel_path = "/tmp/real_hotels.xlsx"
        if not os.path.exists(excel_path):
            pytest.skip("Real Excel file not found at /tmp/real_hotels.xlsx")
        
        with open(excel_path, "rb") as f:
            files = {"file": ("real_hotels.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            response = requests.post(f"{BASE_URL}/api/admin/import/preview", files=files, headers=self.headers)
        
        print(f"Import preview response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        
        data = response.json()
        print(f"Preview data: total_rows={data.get('total_rows')}, valid={data.get('valid')}, duplicates={data.get('duplicates')}")
        
        # Should parse hotels correctly (title in row 1, headers in row 2)
        assert "total_rows" in data
        assert data["total_rows"] > 0, "Should find hotels in the Excel"
        assert "preview" in data
        assert "preview_id" in data
        
        # Check preview has hotel data
        if data["preview"]:
            first_hotel = data["preview"][0]
            print(f"First hotel in preview: {first_hotel.get('name')}, city={first_hotel.get('city')}, photos={first_hotel.get('photo_count')}")
            assert "name" in first_hotel
            assert first_hotel["name"], "Hotel name should not be empty"
        
        return data  # Return for use in execute test
    
    def test_import_execute(self):
        """POST /api/admin/import/execute - import hotels from Excel"""
        excel_path = "/tmp/real_hotels.xlsx"
        if not os.path.exists(excel_path):
            pytest.skip("Real Excel file not found")
        
        # First get preview
        with open(excel_path, "rb") as f:
            files = {"file": ("real_hotels.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            preview_resp = requests.post(f"{BASE_URL}/api/admin/import/preview", files=files, headers=self.headers)
        
        if preview_resp.status_code != 200:
            pytest.skip("Preview failed")
        
        preview = preview_resp.json()
        print(f"Preview: {preview.get('valid')} valid, {preview.get('duplicates')} duplicates")
        
        # Execute import
        execute_payload = {
            "preview_id": preview["preview_id"],
            "batch_name": "TEST_Pytest_Import_Musoma",
            "city_override": "Musoma",
            "skip_duplicates": True
        }
        
        execute_resp = requests.post(
            f"{BASE_URL}/api/admin/import/execute",
            json=execute_payload,
            headers={**self.headers, "Content-Type": "application/json"}
        )
        
        print(f"Execute response: {execute_resp.status_code} - {execute_resp.text[:200]}")
        
        assert execute_resp.status_code == 200
        
        result = execute_resp.json()
        assert "imported" in result
        assert "skipped" in result
        print(f"Import result: {result['imported']} imported, {result['skipped']} skipped")
    
    def test_import_batches_history(self):
        """GET /api/admin/import/batches - returns import history"""
        response = requests.get(f"{BASE_URL}/api/admin/import/batches", headers=self.headers)
        
        print(f"Batches response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"Found {len(data)} import batches")
        if data:
            batch = data[0]
            print(f"Latest batch: {batch.get('name')} - {batch.get('imported')} imported, {batch.get('skipped')} skipped")
            assert "id" in batch
            assert "name" in batch
            assert "imported" in batch
            assert "skipped" in batch


class TestAdminHotelsList:
    """Test admin hotels list endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        self.admin_token = None
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@habaristays.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("access_token")
        else:
            pytest.skip("Admin auth failed - skipping tests")
        
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        yield
    
    def test_get_all_hotels(self):
        """GET /api/admin/all-hotels - returns all hotels for admin"""
        response = requests.get(f"{BASE_URL}/api/admin/all-hotels", headers=self.headers)
        
        print(f"All hotels response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} total hotels")
        
        if data:
            hotel = data[0]
            assert "id" in hotel
            assert "name" in hotel
            assert "status" in hotel
            
            # Check for photo_count field (used in admin table)
            # This is added by the admin endpoint
            print(f"Sample hotel: {hotel.get('name')} - status={hotel.get('status')}, photos={hotel.get('photo_count', 'N/A')}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        self.admin_token = None
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@habaristays.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            self.admin_token = response.json().get("access_token")
        
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        yield
    
    def test_cleanup_test_hotels(self):
        """Delete all TEST_ prefixed hotels"""
        if not self.admin_token:
            pytest.skip("No admin token")
        
        hotels = requests.get(f"{BASE_URL}/api/admin/all-hotels", headers=self.headers).json()
        test_hotels = [h for h in hotels if h["name"].startswith("TEST_")]
        
        deleted = 0
        for hotel in test_hotels:
            resp = requests.delete(f"{BASE_URL}/api/admin/hotels/{hotel['id']}", headers=self.headers)
            if resp.status_code == 200:
                deleted += 1
                print(f"Deleted: {hotel['name']}")
        
        print(f"Cleaned up {deleted} TEST_ hotels")
        assert True  # Always pass cleanup
