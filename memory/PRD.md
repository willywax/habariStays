# Habari Stays - Product Requirements Document

## Overview
Hotel booking & management platform for Tanzania. Multi-hotel owners, cashier management, walk-in bookings, Cloudinary image management, Beem SMS, bulk Excel import.

## Architecture
- **Frontend**: React.js + Tailwind CSS + Recharts, lazy-loaded pages
- **Backend**: FastAPI (Python) - monolithic server.py (~3300 lines)
- **Database**: MongoDB (motor async driver)
- **Images**: Cloudinary (cloud: diupey6vs, preset: habari_stays_upload)
- **SMS**: Beem Africa (REAL - PLUTO sender ID)
- **Auth**: JWT-based
- **Payments**: Mock M-Pesa (Selcom prepared, waiting credentials)

## Roles
1. **Traveler** - Browse, search, book hotels, contact imported hotels
2. **Hotel Owner** - Manage hotels, rooms, cashiers, upload photos
3. **Cashier** - Walk-in bookings, check-in/out, booking verification, shift summary
4. **Admin** - Full CRUD on hotels, bulk import, owner approval, cashier/photo management

## What's Been Implemented

### Cashier System Complete Overhaul (Feb 27, 2026)
- **5-page Cashier Dashboard**: Today's Check-ins, Verify Booking, Walk-in Booking, Active Guests, Shift Summary
- **Today's Check-ins**: Filter tabs (All/Awaiting/Checked In/Checked Out), search by name/ref, confirm arrival/departure modals with activity logging
- **Verify Booking**: Search by booking ref, phone, or name. Validates payment status, dates, hotel, check-in status. Shows clear error messages in Swahili for each error type
- **Walk-in Booking**: 3-step flow (Select Room → Guest Details & Payment → Confirm & Record). Printable receipt, decrements room availability, logs activity, sends SMS to owner
- **Active Guests**: All checked-in guests (online + walk-in), nights-left color coding (green/amber/red), checkout with room restoration
- **Shift Summary**: Revenue cards by payment method (Cash/M-Pesa/Card), activity log table, printable shift report
- **Cashier Activity Log**: Audit trail (`cashier_activity_log` collection) for every action. Visible to cashier (today), owner, admin
- **Live clock + shift tracking** in header

### Admin/Owner Cashier Management (Feb 27, 2026)
- **Add Cashier**: Form with name, email, phone, hotel dropdown. Auto-generates 8-char temp password. SMS sent to cashier
- **Edit Cashier**: Update name, phone, reassign hotel (email cannot be changed)
- **Reset Password**: Confirm modal → generates new password → shows once with copy button → SMS sent
- **Deactivate/Reactivate**: Toggle with confirmation modal, SMS notification on status change
- **Performance View**: Click cashier name → monthly stats (walk-ins, check-ins, checkouts, revenue) + activity log table

### Language Toggle EN/SW (Feb 27, 2026)
- **[SW | EN] pill toggle** in Admin, Owner, and Cashier dashboard sidebars/headers
- Persists in localStorage across page refresh
- Translations cover all dashboard labels, buttons, status badges, form labels (dashboards only, not public pages yet)

### Hotel Edit Page Refactor (Feb 27, 2026)
- Dedicated `HotelEditPage` for both Admin and Owner dashboards (replaced modal editing)
- Admin hotel list shows room type count and "Sasisha" warning for default rooms
- Permission logic: admin can edit name/city, owner cannot
- Default room warning disappears after first edit

### Earlier Completed Work
- Excel Import with Cloudinary photos
- Admin Hotel CRUD
- Reusable PhotoManager component
- Public landing, search, hotel detail
- 4-step booking flow with mock M-Pesa
- Beem SMS (REAL)
- Booking expiry background task

## Key API Endpoints

### Cashier Endpoints
- `GET /api/cashier/todays-checkins` - Today's online bookings for cashier's hotel
- `GET /api/cashier/active-guests` - All checked-in guests
- `GET /api/cashier/shift-summary-full` - Revenue breakdown + activity log
- `GET /api/cashier/activity-log` - Today's activity entries
- `POST /api/cashier/confirm-checkin/{id}` - Validates payment/hotel/status, logs activity
- `POST /api/cashier/confirm-checkout/{id}` - Restores room availability, logs activity
- `POST /api/cashier/walkin` - Creates walk-in booking, decrements rooms, sends SMS, logs activity
- `POST /api/cashier/verify-booking` - Search by ref/phone/name, returns validation status

### Cashier Management
- `POST /api/cashiers/{id}/reset-password` - Returns new_password, sends SMS
- `PATCH /api/cashiers/{id}` - Edit name, phone, hotel
- `PUT /api/cashiers/{id}/toggle-status-sms` - Toggle active/inactive with SMS
- `GET /api/cashiers/{id}/performance` - Monthly stats + activity log

## Code Architecture
```
/app/
├── backend/
│   ├── server.py         # ~3300 lines
│   └── tests/
│       └── test_cashier_system.py
├── frontend/
│   └── src/
│       ├── App.js         # Router + translations + LanguageToggle
│       ├── components/
│       │   ├── HotelEditPage.js
│       │   └── PhotoManager.js
│       └── pages/
│           ├── AdminDashboard.js    # Admin with cashier CRUD
│           ├── OwnerDashboard.js    # Owner with staff CRUD
│           ├── CashierDashboard.js  # 5-page cashier system
│           ├── BookingFlow.js
│           └── AuthPages.js
└── memory/
    └── PRD.md
```

## Backlog
### P1 - UPCOMING
- [ ] Mock Selcom M-Pesa payment flow (2-min countdown, webhook ready)
- [ ] Booking expiry logic improvements for unpaid online bookings
- [ ] Admin approval for hotel owners (pending state enforcement)

### P2 - FUTURE
- [ ] Google Social Auth (Emergent-managed)
- [ ] EN/SW Language Toggle for public pages (home, search, hotel detail, booking flow)
- [ ] SEO-friendly slugs, custom 404/500 pages, room calendar
- [ ] Password reset flow

### P3 - BACKLOG
- [ ] Export reports, dark mode, push notifications
- [ ] Backend refactoring (break server.py into routes/models/services)

## Test Accounts
- Admin: admin@habaristays.com / admin123
- Cashier: cashier@test.com / (use admin reset-password endpoint)
