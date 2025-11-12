# MongoDB Atlas Connection Troubleshooting

## Error: SSL/TLS Alert Internal Error

This error usually means one of these issues:

### 1. ⚠️ Password Not Updated

**Check:** Open `backend-node/.env` and verify the password is replaced:

```env
# ❌ WRONG (still has placeholder):
MONGO_URL=mongodb+srv://arpitalwar:<db_password>@cluster0.9alz22c.mongodb.net/

# ✅ CORRECT (actual password):
MONGO_URL=mongodb+srv://arpitalwar:YOUR_ACTUAL_PASSWORD@cluster0.9alz22c.mongodb.net/
```

**Fix:** Replace `<db_password>` with your actual MongoDB Atlas password.

### 2. 🌐 IP Address Not Whitelisted

MongoDB Atlas blocks connections from IPs that aren't whitelisted.

**Fix:**
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click on **Network Access** (left sidebar)
3. Click **Add IP Address**
4. Choose one:
   - **Add Current IP Address** (recommended for security)
   - **Allow Access from Anywhere** (`0.0.0.0/0`) - for development only
5. Click **Confirm**

**Wait 1-2 minutes** for changes to propagate, then try again.

### 3. 👤 Database User Issues

**Check:**
1. Go to MongoDB Atlas → **Database Access**
2. Verify user `arpitalwar` exists
3. Verify the password matches what's in `.env`
4. Ensure user has **Read and write to any database** permissions

**Fix:** If user doesn't exist or password is wrong:
1. Create new user or reset password
2. Update `.env` with correct password

### 4. 🔒 Connection String Format

**Correct format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database
```

**Your connection string should be:**
```
mongodb+srv://arpitalwar:YOUR_PASSWORD@cluster0.9alz22c.mongodb.net/pharmaventory
```

## Quick Test

After fixing the above, test the connection:

```powershell
cd backend-node
npm start
```

You should see:
```
✓ MongoDB connected: pharmaventory
✓ Server running on http://localhost:8000
```

## Still Not Working?

1. **Double-check password** - Copy/paste from MongoDB Atlas to avoid typos
2. **Check MongoDB Atlas status** - Make sure cluster is running
3. **Try from MongoDB Atlas Compass** - Test connection directly
4. **Check firewall** - Make sure your firewall isn't blocking MongoDB

## Alternative: Use Local MongoDB

If Atlas continues to have issues, you can use local MongoDB:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=pharmaventory
```

Then install and run MongoDB locally.

