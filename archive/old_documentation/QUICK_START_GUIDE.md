# 🚀 APEX AI SECURITY PLATFORM - QUICK START GUIDE

## Installation & Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Python 3.8+ (for AI server)

### 1. Backend Setup
```bash
cd C:\Users\ogpsw\Desktop\defense

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Start backend server
npm run start
```
**Backend will run on:** http://localhost:3001

### 2. Frontend Setup
```bash
cd C:\Users\ogpsw\Desktop\defense\frontend

# Install dependencies
npm install

# Start frontend development server
npm run start
```
**Frontend will run on:** http://localhost:3000

### 3. AI Server Setup (Optional - for AI features)
```bash
cd C:\Users\ogpsw\Desktop\defense\backend\flask_server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start AI server
python app.py
```
**AI Server will run on:** http://localhost:5001

## 🎯 Platform Access Points

### Main Platform
- **🏠 Platform Landing:** http://localhost:3000/
- **🔴 Live AI Monitoring:** http://localhost:3000/live-monitoring
- **📡 Guard Operations:** http://localhost:3000/guard-operations
- **⚙️ Admin Dashboard:** http://localhost:3000/admin
- **📱 Guard Mobile App:** http://localhost:3000/guard-mobile
- **📊 Enhanced Reports:** http://localhost:3000/reports/new

### Legacy Routes (for compatibility)
- **📊 Legacy Reports:** http://localhost:3000/reports/legacy
- **📄 Report Details:** http://localhost:3000/reports/:id

## 🔧 Development Commands

### Backend
```bash
# Start development server with hot reload
npm run dev

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Run tests
npm test
```

### Frontend
```bash
# Start development server
npm run start

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### AI Server
```bash
# Start with debug mode
python app.py --debug

# Run AI model tests
python -m pytest tests/

# Check model performance
python scripts/benchmark.py
```

## 📱 Mobile Testing

The Guard Mobile App is optimized for mobile devices. To test:

1. **Chrome DevTools:**
   - Open http://localhost:3000/guard-mobile
   - Press F12 → Click device toolbar
   - Select iPhone/Android device simulation

2. **Real Device Testing:**
   - Find your computer's IP address
   - Access http://[YOUR_IP]:3000/guard-mobile from mobile device
   - Ensure firewall allows connections on port 3000

## 🗄️ Database Schema

The platform uses PostgreSQL with the following main tables:
- **Users** - All platform users (admins, guards, dispatchers)
- **Clients** - Customer companies and properties
- **Guards** - Guard employee information
- **Properties** - Client properties and camera systems
- **Incidents** - Security incidents and reports
- **Alerts** - AI-generated alerts
- **Shifts** - Guard scheduling
- **Reports** - Generated security reports

## 🔐 Default Access

### Development Mode
- All routes are accessible without authentication
- Demo data is pre-loaded for testing
- No login required for development

### Production Setup
- Enable authentication in AuthContext
- Configure role-based access control
- Set up secure JWT secrets
- Enable HTTPS

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 3001
npx kill-port 3001
```

**Database Connection Issues:**
- Check PostgreSQL is running
- Verify .env database credentials
- Ensure database exists

**AI Server Issues:**
- Check Python version (3.8+)
- Verify virtual environment is activated
- Install missing dependencies with pip

**Frontend Build Issues:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

### Support
For technical support or questions:
1. Check console logs for error messages
2. Verify all services are running
3. Ensure ports 3000, 3001, and 5001 are available
4. Check network connectivity between services

## 📚 Component Documentation

### Live Monitoring Dashboard
- Real-time camera feeds with AI detection overlays
- Alert management and guard dispatch
- WebSocket connections for live updates

### Guard Operations Center
- Interactive property maps
- Incident management system
- Guard communication and dispatch

### Admin Dashboard
- User and client management
- Guard scheduling and payroll
- Business analytics and reporting

### Guard Mobile App
- Time clock functionality
- AI alert reception
- Incident reporting with media upload

### Enhanced Report Builder
- AI-powered report generation
- Client delivery and analytics
- Comprehensive data visualization

---

**🎉 Your Apex AI Security Platform is now ready for use! Start with the Platform Landing page at http://localhost:3000/ to explore all modules.**