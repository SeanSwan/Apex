# 🚀 QUICK FIX GUIDE - APEX AI PLATFORM SETUP

## Step-by-Step Instructions:

### 1. **Stop the Current Server**
Press `Ctrl+C` in the terminal where the server is running

### 2. **Create the Database**
```bash
cd C:\Users\ogpsw\Desktop\defense\backend
node setup-database.mjs
```

### 3. **Start the Server Again**
```bash
npm start
```

### 4. **Test the APIs**
```bash
node test-apex-ai-apis.mjs
```

## What We Fixed:

✅ **Database Issue**: Created the "apex" database with essential tables  
✅ **Model Association Error**: Simplified models to prevent conflicts  
✅ **node-fetch Issue**: Updated test script to use built-in fetch  
✅ **Missing Dependencies**: No additional packages needed  

## Expected Results:

After running `setup-database.mjs`, you should see:
```
✅ Database connection successful
✅ Database "apex" created successfully!
✅ Created table: cameras
✅ Created table: guards
✅ Created table: ai_alerts_log
✅ Created table: guard_dispatches
✅ Created table: security_events
✅ Sample data inserted successfully!
🎉 Database setup completed successfully!
```

After running `npm start`, you should see:
```
✅ Database connection established successfully.
Server is running on port 5000
Health check available at: http://localhost:5000/api/health
```

After running `test-apex-ai-apis.mjs`, you should see mostly passing tests!

## Next Steps:

Once the basic server is running:
1. Test your frontend - the Enhanced AI Dispatch buttons should work
2. Check the browser console for successful API calls  
3. Open multiple browser tabs to see real-time updates

## If You Still Get Errors:

1. **Check PostgreSQL is running**: `pg_ctl status`
2. **Verify .env database settings** are correct
3. **Check if port 5000 is available**: `netstat -an | findstr 5000`

Run these commands in order and let me know the output! 🚀