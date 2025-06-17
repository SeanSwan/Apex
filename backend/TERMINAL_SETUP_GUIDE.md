# APEX AI - TERMINAL-BASED DATABASE SETUP
# ========================================
# Complete guide for terminal users (no pgAdmin needed)

## 🎯 QUICK TERMINAL SOLUTIONS (Try in order)

### Option 1: Automated Terminal Setup (RECOMMENDED)
```bash
# This finds PostgreSQL automatically and executes SQL
terminal-sql-setup.bat
```

### Option 2: Node.js Authentication Bypass
```bash
# This tries multiple postgres passwords automatically
node execute-sql-nodejs.mjs
```

### Option 3: Advanced Terminal Execution
```bash
# This finds psql and executes with better error handling
node execute-sql-terminal.mjs
```

## 🔧 MANUAL TERMINAL COMMANDS

If you know your PostgreSQL installation path:

### Find PostgreSQL Installation:
```bash
# Common paths to check:
dir "C:\Program Files\PostgreSQL"
dir "C:\Program Files (x86)\PostgreSQL"
```

### Execute SQL manually:
```bash
# Replace with your actual PostgreSQL path
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d apex -f COMPLETE_SETUP.sql

# OR if PostgreSQL is in PATH:
psql -U postgres -d apex -f COMPLETE_SETUP.sql
```

### Common postgres passwords to try:
- Empty (just press Enter)
- postgres
- admin
- 123456
- root

## 🎯 STEP-BY-STEP MANUAL APPROACH

### Step 1: Generate SQL file (if not done)
```bash
node generate-pgadmin-script.mjs
```

### Step 2: Find your PostgreSQL installation
```bash
# Check these directories:
ls "C:\Program Files\PostgreSQL\*\bin\psql.exe"
ls "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
```

### Step 3: Execute with full path
```bash
# Example (replace with your actual path):
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d apex -f COMPLETE_SETUP.sql
```

### Step 4: Verify success
```bash
node verify-database-setup.mjs
```

## ✅ SUCCESS INDICATORS

After successful execution, you should see:
```
Setup completed successfully!
user_count: 3
client_count: 2
property_count: 3
report_count: 0
schedule_count: 0
```

## 🚀 AFTER SUCCESS

### Start Backend:
```bash
npm run dev
```

### Start Frontend:
```bash
cd ../frontend
npm run dev
```

## 🔧 TROUBLESHOOTING

### "psql: command not found"
- PostgreSQL not in PATH
- Use full path to psql.exe
- Try automated scripts above

### "authentication failed"
- Wrong postgres password
- Try empty password first
- Use Node.js method which tries multiple passwords

### "permission denied"
- Run as administrator
- Use Node.js method which handles permissions better

### "database does not exist"
- Wrong database name
- Make sure you're connecting to 'apex' database

## 💡 RECOMMENDED APPROACH

1. **Try automated first**: `terminal-sql-setup.bat`
2. **If that fails**: `node execute-sql-nodejs.mjs`
3. **Manual fallback**: Use full path to psql.exe

The Node.js method is often most reliable because it tries multiple authentication methods automatically.
