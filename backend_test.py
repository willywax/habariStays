#!/usr/bin/env python3
"""
Habari Stays Backend API Test Suite
Tests all major API endpoints for the hotel booking platform
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class HabariStaysAPITester:
    def __init__(self, base_url="https://stays-improvements.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different user roles
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if status == "PASS":
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED {details}")
        else:
            self.failed_tests.append(f"{test_name}: {details}")
            print(f"❌ {test_name}: FAILED - {details}")
            
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, expected_status: int = 200) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.api_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
                
            return {
                'success': response.status_code == expected_status,
                'status_code': response.status_code,
                'data': response.json() if response.text else {},
                'response': response
            }
        except Exception as e:
            return {
                'success': False,
                'status_code': 0,
                'data': {},
                'error': str(e)
            }

    def test_health_check(self):
        """Test health endpoint"""
        result = self.make_request('GET', '/health')
        if result['success'] and result['data'].get('status') == 'healthy':
            self.log_test("Health Check", "PASS")
            return True
        else:
            self.log_test("Health Check", "FAIL", 
                         f"Status: {result.get('status_code')}, Error: {result.get('error', 'Unknown')}")
            return False
    
    def test_user_registration(self):
        """Test user registration for different roles"""
        users = [
            {
                'role': 'owner',
                'email': f'owner_{int(datetime.now().timestamp())}@test.com',
                'full_name': 'Test Owner',
                'phone': '+255712345678',
                'password': 'TestPass123!'
            },
            {
                'role': 'admin',
                'email': f'admin_{int(datetime.now().timestamp())}@test.com',
                'full_name': 'Test Admin',
                'phone': '+255712345679',
                'password': 'TestPass123!'
            }
        ]
        
        for user_data in users:
            result = self.make_request('POST', '/auth/register', user_data, expected_status=200)
            if result['success']:
                token = result['data'].get('access_token')
                user_info = result['data'].get('user')
                if token and user_info:
                    self.tokens[user_data['role']] = token
                    self.test_data[f"{user_data['role']}_user"] = user_info
                    self.log_test(f"Register {user_data['role'].title()}", "PASS")
                else:
                    self.log_test(f"Register {user_data['role'].title()}", "FAIL", "No token/user in response")
                    return False
            else:
                self.log_test(f"Register {user_data['role'].title()}", "FAIL", 
                             f"Status: {result['status_code']}, Data: {result.get('data')}")
                return False
        
        return True
    
    def test_user_login(self):
        """Test login with registered users"""
        if 'owner_user' not in self.test_data:
            self.log_test("Login Test", "SKIP", "No registered users found")
            return False
            
        # Test owner login
        owner = self.test_data['owner_user']
        login_data = {
            'email': owner['email'],
            'password': 'TestPass123!'
        }
        
        result = self.make_request('POST', '/auth/login', login_data)
        if result['success'] and result['data'].get('access_token'):
            self.log_test("Owner Login", "PASS")
            return True
        else:
            self.log_test("Owner Login", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_get_user_profile(self):
        """Test getting current user profile"""
        if 'owner' not in self.tokens:
            self.log_test("Get Profile", "SKIP", "No owner token")
            return False
            
        result = self.make_request('GET', '/auth/me', token=self.tokens['owner'])
        if result['success'] and result['data'].get('id'):
            self.log_test("Get User Profile", "PASS")
            return True
        else:
            self.log_test("Get User Profile", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_create_hotel(self):
        """Test hotel creation"""
        if 'owner' not in self.tokens:
            self.log_test("Create Hotel", "SKIP", "No owner token")
            return False
            
        hotel_data = {
            'name': f'Test Hotel {int(datetime.now().timestamp())}',
            'description': 'A beautiful test hotel in Tanzania',
            'address': '123 Test Street, Upanga',
            'city': 'Dar es Salaam',
            'phone': '+255222123456',
            'email': f'hotel_{int(datetime.now().timestamp())}@test.com',
            'amenities': ['WiFi', 'Restaurant', 'Pool'],
            'images': ['https://example.com/hotel1.jpg']
        }
        
        result = self.make_request('POST', '/hotels', hotel_data, 
                                 token=self.tokens['owner'], expected_status=200)
        if result['success'] and result['data'].get('id'):
            self.test_data['hotel'] = result['data']
            self.log_test("Create Hotel", "PASS", f"Hotel ID: {result['data']['id']}")
            return True
        else:
            self.log_test("Create Hotel", "FAIL", 
                         f"Status: {result['status_code']}, Data: {result.get('data')}")
            return False
    
    def test_get_hotels(self):
        """Test getting hotels list"""
        result = self.make_request('GET', '/hotels')
        if result['success'] and isinstance(result['data'], list):
            self.log_test("Get Hotels List", "PASS", f"Found {len(result['data'])} hotels")
            return True
        else:
            self.log_test("Get Hotels List", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_get_owner_hotels(self):
        """Test getting owner's hotels"""
        if 'owner' not in self.tokens:
            self.log_test("Get Owner Hotels", "SKIP", "No owner token")
            return False
            
        result = self.make_request('GET', '/owner/hotels', token=self.tokens['owner'])
        if result['success'] and isinstance(result['data'], list):
            self.log_test("Get Owner Hotels", "PASS", f"Found {len(result['data'])} hotels")
            return True
        else:
            self.log_test("Get Owner Hotels", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_create_room_type(self):
        """Test creating room types"""
        if 'hotel' not in self.test_data or 'owner' not in self.tokens:
            self.log_test("Create Room Type", "SKIP", "No hotel or owner token")
            return False
            
        room_data = {
            'hotel_id': self.test_data['hotel']['id'],
            'name': 'Deluxe Suite',
            'description': 'Spacious deluxe suite with ocean view',
            'price_per_night': 150000.0,
            'capacity': 2,
            'total_rooms': 5,
            'available_rooms': 5,
            'amenities': ['King Bed', 'Ocean View', 'Balcony']
        }
        
        result = self.make_request('POST', '/room-types', room_data, 
                                 token=self.tokens['owner'])
        if result['success'] and result['data'].get('id'):
            self.test_data['room_type'] = result['data']
            self.log_test("Create Room Type", "PASS", f"Room Type ID: {result['data']['id']}")
            return True
        else:
            self.log_test("Create Room Type", "FAIL", 
                         f"Status: {result['status_code']}, Data: {result.get('data')}")
            return False
    
    def test_get_room_types(self):
        """Test getting room types for hotel"""
        if 'hotel' not in self.test_data:
            self.log_test("Get Room Types", "SKIP", "No hotel created")
            return False
            
        hotel_id = self.test_data['hotel']['id']
        result = self.make_request('GET', f'/room-types?hotel_id={hotel_id}')
        if result['success'] and isinstance(result['data'], list):
            self.log_test("Get Room Types", "PASS", f"Found {len(result['data'])} room types")
            return True
        else:
            self.log_test("Get Room Types", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_create_cashier(self):
        """Test creating a cashier"""
        if 'hotel' not in self.test_data or 'owner' not in self.tokens:
            self.log_test("Create Cashier", "SKIP", "No hotel or owner token")
            return False
            
        cashier_data = {
            'full_name': 'Test Cashier',
            'phone': '+255712345680',
            'email': f'cashier_{int(datetime.now().timestamp())}@test.com',
            'hotel_id': self.test_data['hotel']['id']
        }
        
        result = self.make_request('POST', '/cashiers', cashier_data, 
                                 token=self.tokens['owner'])
        if result['success'] and result['data'].get('id'):
            self.test_data['cashier'] = result['data']
            # Create login credentials for cashier (password is auto-generated)
            self.log_test("Create Cashier", "PASS", f"Cashier ID: {result['data']['id']}")
            return True
        else:
            self.log_test("Create Cashier", "FAIL", 
                         f"Status: {result['status_code']}, Data: {result.get('data')}")
            return False
    
    def test_get_cashiers(self):
        """Test getting cashiers"""
        if 'owner' not in self.tokens:
            self.log_test("Get Cashiers", "SKIP", "No owner token")
            return False
            
        result = self.make_request('GET', '/cashiers', token=self.tokens['owner'])
        if result['success'] and isinstance(result['data'], list):
            self.log_test("Get Cashiers", "PASS", f"Found {len(result['data'])} cashiers")
            return True
        else:
            self.log_test("Get Cashiers", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_create_online_booking(self):
        """Test creating online booking"""
        if 'hotel' not in self.test_data or 'room_type' not in self.test_data:
            self.log_test("Create Online Booking", "SKIP", "No hotel or room type")
            return False
            
        # Create a traveler user first
        traveler_data = {
            'role': 'traveler',
            'email': f'traveler_{int(datetime.now().timestamp())}@test.com',
            'full_name': 'Test Traveler',
            'phone': '+255712345681',
            'password': 'TestPass123!'
        }
        
        reg_result = self.make_request('POST', '/auth/register', traveler_data)
        if not reg_result['success']:
            self.log_test("Create Online Booking", "FAIL", "Could not create traveler")
            return False
            
        traveler_token = reg_result['data'].get('access_token')
        
        # Create booking
        booking_data = {
            'hotel_id': self.test_data['hotel']['id'],
            'room_type_id': self.test_data['room_type']['id'],
            'guest_name': 'Test Guest',
            'guest_phone': '+255712345682',
            'guest_email': 'guest@test.com',
            'check_in_date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'check_out_date': (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
            'num_guests': 2,
            'booking_type': 'online',
            'payment_method': 'mpesa'
        }
        
        result = self.make_request('POST', '/bookings', booking_data, 
                                 token=traveler_token)
        if result['success'] and result['data'].get('id'):
            self.test_data['online_booking'] = result['data']
            self.log_test("Create Online Booking", "PASS", 
                         f"Booking Ref: {result['data']['booking_ref']}")
            return True
        else:
            self.log_test("Create Online Booking", "FAIL", 
                         f"Status: {result['status_code']}, Data: {result.get('data')}")
            return False
    
    def test_get_bookings(self):
        """Test getting bookings"""
        if 'owner' not in self.tokens:
            self.log_test("Get Bookings", "SKIP", "No owner token")
            return False
            
        result = self.make_request('GET', '/bookings', token=self.tokens['owner'])
        if result['success'] and isinstance(result['data'], list):
            self.log_test("Get Bookings", "PASS", f"Found {len(result['data'])} bookings")
            return True
        else:
            self.log_test("Get Bookings", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_analytics_revenue(self):
        """Test revenue analytics"""
        if 'owner' not in self.tokens:
            self.log_test("Revenue Analytics", "SKIP", "No owner token")
            return False
            
        result = self.make_request('GET', '/analytics/revenue', token=self.tokens['owner'])
        if result['success'] and 'total_revenue' in result['data']:
            self.log_test("Revenue Analytics", "PASS", 
                         f"Total Revenue: TZS {result['data']['total_revenue']}")
            return True
        else:
            self.log_test("Revenue Analytics", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_admin_stats(self):
        """Test admin statistics"""
        if 'admin' not in self.tokens:
            self.log_test("Admin Stats", "SKIP", "No admin token")
            return False
            
        result = self.make_request('GET', '/admin/stats', token=self.tokens['admin'])
        if result['success'] and 'total_hotels' in result['data']:
            stats = result['data']
            self.log_test("Admin Stats", "PASS", 
                         f"Hotels: {stats['total_hotels']}, Bookings: {stats['total_bookings']}")
            return True
        else:
            self.log_test("Admin Stats", "FAIL", f"Status: {result['status_code']}")
            return False
    
    def test_hotel_verification(self):
        """Test hotel verification by admin"""
        if 'admin' not in self.tokens or 'hotel' not in self.test_data:
            self.log_test("Hotel Verification", "SKIP", "No admin token or hotel")
            return False
            
        hotel_id = self.test_data['hotel']['id']
        result = self.make_request('PUT', f'/admin/hotels/{hotel_id}/verify', 
                                 token=self.tokens['admin'])
        if result['success']:
            self.log_test("Hotel Verification", "PASS")
            return True
        else:
            self.log_test("Hotel Verification", "FAIL", f"Status: {result['status_code']}")
            return False

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🚀 Starting Habari Stays API Tests...")
        print(f"🔗 Testing against: {self.base_url}")
        print("-" * 60)
        
        # Core tests in order
        test_methods = [
            self.test_health_check,
            self.test_user_registration,
            self.test_user_login,
            self.test_get_user_profile,
            self.test_create_hotel,
            self.test_get_hotels,
            self.test_get_owner_hotels,
            self.test_create_room_type,
            self.test_get_room_types,
            self.test_create_cashier,
            self.test_get_cashiers,
            self.test_create_online_booking,
            self.test_get_bookings,
            self.test_analytics_revenue,
            self.test_admin_stats,
            self.test_hotel_verification
        ]
        
        # Run all tests
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                self.log_test(test_method.__name__, "FAIL", f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Overall Status: GOOD - Most functionality working")
        elif success_rate >= 60:
            print("⚠️  Overall Status: MODERATE - Some issues need attention")
        else:
            print("🚨 Overall Status: POOR - Major issues detected")
        
        return success_rate >= 80


def main():
    """Main test execution"""
    tester = HabariStaysAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())