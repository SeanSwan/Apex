🔧 APEX AI DATABASE SETUP - TERMINAL COMMANDS
=============================================

## STEP 1: Navigate to your project directory
```bash
cd "C:\Users\ogpsw\Desktop\defense"
```

## STEP 2: Run the AI database setup script
```bash
# Option A: Run the SQL script directly
psql -U swanadmin -d apex -f backend/APEX_AI_DATABASE_SETUP.sql

# Option B: If you need to specify host/port
psql -h localhost -p 5432 -U swanadmin -d apex -f backend/APEX_AI_DATABASE_SETUP.sql

# Option C: If you need password prompt
psql -U swanadmin -d apex -W -f backend/APEX_AI_DATABASE_SETUP.sql
```

## STEP 3: Verify the setup worked
```bash
# Connect to database and check tables
psql -U swanadmin -d apex

# Then run these commands inside psql:
\dt                    # List all tables
SELECT COUNT(*) FROM cameras;
SELECT COUNT(*) FROM ai_alerts_log;  
SELECT COUNT(*) FROM guards;
\q                     # Quit psql
```

## STEP 4: Start your APEX AI system
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (new terminal window)
cd frontend  
npm run dev
```

## 🚨 TROUBLESHOOTING:

### If you get "command not found: psql"
```bash
# Add PostgreSQL to your PATH, or use full path:
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U swanadmin -d apex -f backend/APEX_AI_DATABASE_SETUP.sql
```

### If you get "database does not exist"
```bash
# Create the apex database first:
psql -U postgres -c "CREATE DATABASE apex;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE apex TO swanadmin;"
```

### If you get authentication errors:
```bash
# Try with postgres user first:
psql -U postgres -d apex -f backend/APEX_AI_DATABASE_SETUP.sql
```

## ✅ SUCCESS VERIFICATION:

After running the script, you should see:
- "APEX AI Database Setup Complete!" message
- Table count summary showing your new AI tables
- Sample alert data in ai_alerts_log table

Then your sophisticated AI platform will be 100% ready! 🚀