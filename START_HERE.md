# 🚀 APEX AI CLIENT PORTAL - COMPLETE SETUP GUIDE
================================================================================

## 📋 OVERVIEW
This guide will set up a fully functional client portal with:
✅ Real PostgreSQL database with test data
✅ Complete backend API server with authentication
✅ Professional React client portal with dashboard, incidents, and evidence
✅ Multi-tenant security (each client sees only their data)
✅ Production-ready architecture

## ⚠️ PREREQUISITES
Before starting, ensure you have:
✅ PostgreSQL installed and running
✅ Node.js installed (version 16+)
✅ Database "apex" created with credentials in backend/.env

## 🎯 EXECUTION STEPS

### PHASE 1: DATABASE SETUP
**Run:** `setup-phase-1.bat`
**Purpose:** Creates all required database tables
**Expected Result:** All core tables (Clients, Properties, Users, Incidents, EvidenceFiles) created
**Time:** ~30 seconds

### PHASE 2: TEST DATA POPULATION  
**Run:** `setup-phase-2.bat`
**Purpose:** Populates database with realistic demo data
**Creates:**
- 3 client companies (Luxe Apartments, Metropolitan Housing, Prestige Properties)
- 6 properties across different property types
- 4 client portal users with different permission levels
- 100+ realistic incidents across 60 days
- Evidence files linked to high/critical incidents
**Time:** ~2 minutes

### PHASE 3: BACKEND SERVER
**Run:** `setup-phase-3.bat`
**Purpose:** Starts the API server on http://localhost:5000
**Features:**
- JWT authentication with sessions
- Client portal API endpoints (/api/client/v1/*)
- Rate limiting and security middleware
- Multi-tenant data isolation
**IMPORTANT:** Keep this window open! Backend must run for portal to work.

### PHASE 4: CLIENT PORTAL
**Run:** `setup-phase-4.bat`
**Purpose:** Starts the client portal on http://localhost:3001
**Features:**
- Professional login interface
- Executive dashboard with KPIs
- Incident browser with search/filter
- Evidence locker with file management
- Role-based permissions

## 🔑 TEST CREDENTIALS

### 🏢 Luxe Apartments Management
**Full Access Admin:**
- Email: sarah.johnson@luxeapartments.com
- Password: Demo123!
- Permissions: Dashboard, Incidents, Evidence, Analytics, Settings

**Limited User:**
- Email: michael.chen@luxeapartments.com
- Password: Demo123!
- Permissions: Dashboard, Incidents only

### 🏢 Metropolitan Housing Group
**Full Access Admin:**
- Email: david.rodriguez@metrohousing.com
- Password: Demo123!
- Permissions: Full access to all features

### 🏢 Prestige Property Partners
**Full Access Admin:**
- Email: alexandra.williams@prestigeproperties.com
- Password: Demo123!
- Permissions: Full access to all features

## 📊 WHAT TO EXPECT

### Dashboard Features:
✅ Real-time incident counts and KPIs
✅ 60-day trend charts with actual data
✅ Property hotspot analysis
✅ AI confidence and performance metrics
✅ Recent critical incidents feed

### Incident Browser:
✅ 15-25 incidents per property
✅ Multiple incident types (theft, vandalism, trespassing, etc.)
✅ Advanced filtering by type, severity, status, date
✅ Detailed incident modals with resolution notes
✅ Evidence file attachments

### Evidence Locker:
✅ Video, image, audio, and document files
✅ Metadata and thumbnails
✅ Secure download capabilities
✅ File size and type information

### Security Features:
✅ Multi-tenant isolation (clients only see their data)
✅ Role-based permissions (admin vs user)
✅ Session management with auto-expiry
✅ Comprehensive audit logging

## 🧪 TESTING WORKFLOW

1. **Start both servers** (Phases 3 & 4)
2. **Navigate to** http://localhost:3001
3. **Login** with sarah.johnson@luxeapartments.com / Demo123!
4. **Explore dashboard** - see real KPIs and trends
5. **Browse incidents** - filter and search functionality
6. **View evidence** - see linked files and metadata
7. **Test permissions** - login as michael.chen (limited access)
8. **Test multi-tenancy** - login as different clients, see isolated data

## 🔧 TROUBLESHOOTING

### Database Connection Issues:
- Verify PostgreSQL is running
- Check credentials in backend/.env
- Ensure "apex" database exists

### Backend Server Issues:
- Check if port 5000 is available
- Verify all dependencies installed (npm install)
- Check console for error messages

### Client Portal Issues:
- Verify backend is running on localhost:5000
- Check if port 3001 is available
- Clear browser cache if needed

### Authentication Issues:
- Verify test data was populated successfully
- Check browser developer tools for API errors
- Confirm backend /api/health endpoint works

## 🎯 SUCCESS INDICATORS

✅ **Backend Health Check:** http://localhost:5000/api/health returns success
✅ **Login Works:** Can authenticate with test credentials
✅ **Dashboard Loads:** KPI cards show real data (not zeros)
✅ **Incidents Display:** Multiple incidents visible with various types
✅ **Evidence Access:** Files show in evidence locker
✅ **Multi-tenancy:** Different clients see different data

## 📞 NEXT STEPS AFTER SETUP

Once everything is working:
1. **Explore all portal features** thoroughly
2. **Test different user roles** and permissions
3. **Verify data isolation** between clients
4. **Check responsive design** on different screen sizes
5. **Test error handling** (invalid credentials, network issues)

================================================================================
🏆 RESULT: Enterprise-grade client portal with real authentication and data!
================================================================================
