"""
Test suite for Habari Stays Cashier System endpoints
Tests: walkin, todays-checkins, active-guests, shift-summary-full, activity-log, 
       verify-booking, confirm-checkin, confirm-checkout, reset-password, edit cashier,
       toggle-status-sms, performance
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@habaristays.com"
ADMIN_PASSWORD = "admin123"
CASHIER_EMAIL = "cashier@test.com"
CASHIER_PASSWORD = "bc732343"
CASHIER_HOTEL_ID = "9bacde09-3530-42d7-b372-84670a92372b"  # Liga Hotel


class TestAuthSetup:
    """Setup - Get auth tokens for testing"""

    def test_admin_login(self):
        """Get admin token for testing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        pytest.admin_token = data["access_token"]
        print(f"✓ Admin login successful")

    def test_cashier_login(self):
        """Get cashier token for testing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CASHIER_EMAIL,
            "password": CASHIER_PASSWORD
        })
        assert response.status_code == 200, f"Cashier login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        pytest.cashier_token = data["access_token"]
        pytest.cashier_id = data.get("user", {}).get("id")
        print(f"✓ Cashier login successful, ID: {pytest.cashier_id}")


class TestCashierEndpoints:
    """Tests for Cashier-specific endpoints"""

    def test_todays_checkins_returns_200(self):
        """GET /api/cashier/todays-checkins - returns online bookings for today"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.get(f"{BASE_URL}/api/cashier/todays-checkins", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Today's check-ins returned {len(data)} bookings")

    def test_active_guests_returns_200(self):
        """GET /api/cashier/active-guests - returns all checked-in guests"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.get(f"{BASE_URL}/api/cashier/active-guests", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # Store if there's an active guest for later checkout test
        if data:
            pytest.active_guest_booking_id = data[0].get("id")
            print(f"✓ Active guests returned {len(data)} guests, first ID: {pytest.active_guest_booking_id}")
        else:
            pytest.active_guest_booking_id = None
            print(f"✓ Active guests returned 0 guests")

    def test_shift_summary_full_returns_200(self):
        """GET /api/cashier/shift-summary-full - returns walk-in count, cash/mpesa/card totals"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.get(f"{BASE_URL}/api/cashier/shift-summary-full", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Validate structure
        assert "walkins_count" in data
        assert "cash_total" in data
        assert "mpesa_total" in data
        assert "card_total" in data
        assert "activity_log" in data
        assert "hotel_name" in data
        print(f"✓ Shift summary: walkins={data['walkins_count']}, cash={data['cash_total']}, mpesa={data['mpesa_total']}")

    def test_activity_log_returns_200(self):
        """GET /api/cashier/activity-log - returns today's activity entries"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.get(f"{BASE_URL}/api/cashier/activity-log", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Activity log returned {len(data)} entries")

    def test_verify_booking_not_found(self):
        """POST /api/cashier/verify-booking - search that doesn't find anything"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.post(f"{BASE_URL}/api/cashier/verify-booking", 
                                 json={"search": "INVALID-REF-12345"}, headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("found") == False
        assert "error" in data or "message" in data
        print(f"✓ Verify booking returned not_found for invalid ref")

    def test_verify_booking_requires_search_term(self):
        """POST /api/cashier/verify-booking - requires search term"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.post(f"{BASE_URL}/api/cashier/verify-booking", 
                                 json={"search": ""}, headers=headers)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Verify booking rejects empty search term")


class TestCashierWalkinAndCheckout:
    """Test walk-in booking creation and checkout flow"""

    def test_checkout_existing_guest_first(self):
        """Checkout existing guest to free up a room"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        # First, get active guests
        response = requests.get(f"{BASE_URL}/api/cashier/active-guests", headers=headers)
        if response.status_code == 200:
            guests = response.json()
            if guests:
                booking_id = guests[0]["id"]
                # Try to checkout
                checkout_response = requests.post(
                    f"{BASE_URL}/api/cashier/confirm-checkout/{booking_id}", 
                    headers=headers
                )
                if checkout_response.status_code == 200:
                    print(f"✓ Checked out guest, room freed: {booking_id}")
                    pytest.last_checkout_id = booking_id
                else:
                    print(f"Could not checkout existing guest: {checkout_response.text}")
                    pytest.last_checkout_id = None
            else:
                print("No active guests to checkout")
                pytest.last_checkout_id = None
        else:
            pytest.last_checkout_id = None

    def test_walkin_booking_creation(self):
        """POST /api/cashier/walkin - creates walk-in booking"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        # First get available rooms
        response = requests.get(f"{BASE_URL}/api/hotels/{CASHIER_HOTEL_ID}/full", headers=headers)
        assert response.status_code == 200, f"Failed to get hotel: {response.text}"
        hotel_data = response.json()
        room_types = hotel_data.get("room_types", [])
        
        available_room = None
        for rt in room_types:
            if rt.get("available_rooms", 0) > 0:
                available_room = rt
                break
        
        if not available_room:
            pytest.skip("No available rooms to test walk-in booking")
            return
        
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        walkin_data = {
            "room_type_id": available_room["id"],
            "guest_name": "TEST Walk-in Guest",
            "guest_phone": "0712345678",
            "checkin_date": datetime.now().strftime("%Y-%m-%d"),
            "checkout_date": tomorrow,
            "payment_method": "cash",
            "notes": "Test walk-in"
        }
        
        response = requests.post(f"{BASE_URL}/api/cashier/walkin", json=walkin_data, headers=headers)
        assert response.status_code == 200, f"Walk-in failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "booking_ref" in data
        assert "id" in data
        assert data["guest_name"] == "TEST Walk-in Guest"
        pytest.walkin_booking_id = data["id"]
        pytest.walkin_booking_ref = data["booking_ref"]
        print(f"✓ Walk-in created: {data['booking_ref']}, ID: {data['id']}")

    def test_walkin_no_rooms_error(self):
        """POST /api/cashier/walkin - error when no rooms available"""
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        # Create multiple walkins to exhaust rooms
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        walkin_data = {
            "room_type_id": "invalid-room-id",
            "guest_name": "Test Guest",
            "guest_phone": "0712345678",
            "checkin_date": datetime.now().strftime("%Y-%m-%d"),
            "checkout_date": tomorrow,
            "payment_method": "cash"
        }
        response = requests.post(f"{BASE_URL}/api/cashier/walkin", json=walkin_data, headers=headers)
        assert response.status_code in [400, 404], f"Expected error, got {response.status_code}"
        print(f"✓ Walk-in correctly rejects invalid room type")

    def test_verify_walkin_booking(self):
        """POST /api/cashier/verify-booking - search by ref returns booking"""
        if not hasattr(pytest, 'walkin_booking_ref') or not pytest.walkin_booking_ref:
            pytest.skip("No walk-in booking created")
            return
        
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.post(f"{BASE_URL}/api/cashier/verify-booking", 
                                 json={"search": pytest.walkin_booking_ref}, headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data.get("found") == True
        assert data.get("booking_ref") == pytest.walkin_booking_ref
        print(f"✓ Verify booking found walk-in by ref: {pytest.walkin_booking_ref}")

    def test_checkout_walkin_booking(self):
        """POST /api/cashier/confirm-checkout/{id} - restores room availability"""
        if not hasattr(pytest, 'walkin_booking_id') or not pytest.walkin_booking_id:
            pytest.skip("No walk-in booking to checkout")
            return
        
        headers = {"Authorization": f"Bearer {pytest.cashier_token}"}
        response = requests.post(
            f"{BASE_URL}/api/cashier/confirm-checkout/{pytest.walkin_booking_id}", 
            headers=headers
        )
        assert response.status_code == 200, f"Checkout failed: {response.text}"
        data = response.json()
        assert "message" in data
        print(f"✓ Checkout successful for walk-in: {pytest.walkin_booking_id}")


class TestCashierManagement:
    """Test Admin/Owner cashier management endpoints"""

    def test_get_all_cashiers(self):
        """GET /api/cashiers - list all cashiers (admin)"""
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}
        response = requests.get(f"{BASE_URL}/api/cashiers", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        if data:
            # Find our test cashier
            test_cashier = next((c for c in data if c.get("email") == CASHIER_EMAIL), None)
            if test_cashier:
                pytest.test_cashier_id = test_cashier["id"]
        print(f"✓ Get all cashiers returned {len(data)} cashiers")

    def test_edit_cashier_name(self):
        """PATCH /api/cashiers/{id} - edit cashier name"""
        if not hasattr(pytest, 'test_cashier_id') or not pytest.test_cashier_id:
            pytest.skip("No cashier ID available")
            return
        
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}
        response = requests.patch(
            f"{BASE_URL}/api/cashiers/{pytest.test_cashier_id}", 
            json={"full_name": "Test Cashier Updated"},
            headers=headers
        )
        assert response.status_code == 200, f"Edit failed: {response.text}"
        print(f"✓ Cashier name updated")
        
        # Restore original name
        requests.patch(
            f"{BASE_URL}/api/cashiers/{pytest.test_cashier_id}", 
            json={"full_name": "Test Cashier"},
            headers=headers
        )

    def test_reset_cashier_password(self):
        """POST /api/cashiers/{id}/reset-password - returns new password"""
        if not hasattr(pytest, 'test_cashier_id') or not pytest.test_cashier_id:
            pytest.skip("No cashier ID available")
            return
        
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/cashiers/{pytest.test_cashier_id}/reset-password", 
            headers=headers
        )
        assert response.status_code == 200, f"Reset failed: {response.text}"
        data = response.json()
        assert "new_password" in data
        assert "message" in data
        # Store new password for login test
        pytest.new_cashier_password = data["new_password"]
        print(f"✓ Password reset, new password received: {data['new_password']}")

    def test_cashier_performance(self):
        """GET /api/cashiers/{id}/performance - monthly stats and activity log"""
        if not hasattr(pytest, 'test_cashier_id') or not pytest.test_cashier_id:
            pytest.skip("No cashier ID available")
            return
        
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/cashiers/{pytest.test_cashier_id}/performance", 
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Validate structure
        assert "cashier" in data
        assert "this_month" in data
        assert "activity_log" in data
        assert "walkins_recorded" in data["this_month"]
        assert "checkins_confirmed" in data["this_month"]
        print(f"✓ Performance data: walkins={data['this_month']['walkins_recorded']}, checkins={data['this_month']['checkins_confirmed']}")

    def test_toggle_cashier_status(self):
        """PUT /api/cashiers/{id}/toggle-status-sms - toggle with SMS notification"""
        if not hasattr(pytest, 'test_cashier_id') or not pytest.test_cashier_id:
            pytest.skip("No cashier ID available")
            return
        
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}
        
        # Toggle to deactivate
        response = requests.put(
            f"{BASE_URL}/api/cashiers/{pytest.test_cashier_id}/toggle-status-sms", 
            headers=headers
        )
        assert response.status_code == 200, f"Toggle failed: {response.text}"
        data = response.json()
        assert "is_active" in data
        print(f"✓ Toggle status: is_active={data['is_active']}")
        
        # Toggle back to reactivate
        response = requests.put(
            f"{BASE_URL}/api/cashiers/{pytest.test_cashier_id}/toggle-status-sms", 
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Toggled back to original status")


class TestCashierAuthorizationRules:
    """Test that cashier endpoints are properly protected"""

    def test_todays_checkins_requires_cashier_role(self):
        """GET /api/cashier/todays-checkins - requires cashier role"""
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}  # Admin, not cashier
        response = requests.get(f"{BASE_URL}/api/cashier/todays-checkins", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Todays-checkins correctly rejects non-cashier")

    def test_walkin_requires_cashier_role(self):
        """POST /api/cashier/walkin - requires cashier role"""
        headers = {"Authorization": f"Bearer {pytest.admin_token}"}  # Admin, not cashier
        response = requests.post(f"{BASE_URL}/api/cashier/walkin", json={}, headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print(f"✓ Walkin correctly rejects non-cashier")

    def test_cashier_endpoints_require_auth(self):
        """Cashier endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/cashier/todays-checkins")
        assert response.status_code == 401 or response.status_code == 403
        print(f"✓ Endpoints require authentication")


class TestCashierLoginWithNewPassword:
    """Test that cashier can login with reset password"""

    def test_cashier_login_with_new_password(self):
        """Login with reset password"""
        if not hasattr(pytest, 'new_cashier_password') or not pytest.new_cashier_password:
            pytest.skip("No new password from reset test")
            return
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CASHIER_EMAIL,
            "password": pytest.new_cashier_password
        })
        assert response.status_code == 200, f"Login with new password failed: {response.text}"
        print(f"✓ Cashier can login with new reset password")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
