# 🔧 CORS & Ports Configuration Guide

## ⚠️ Common CORS/Port Issues & Solutions

### Problem: CORS Error in Browser Console

```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Solution:**

1. **Check backend .env** has correct CORS_ORIGIN:
```env
# backend/.env
CORS_ORIGIN=http://localhost:5173
```

2. **Restart backend** after changing .env:
```bash
cd backend
npm run dev
```

---

### Problem: Connection Refused / Network Error

```
Failed to fetch: ERR_CONNECTION_REFUSED
```

**Solution:**

1. **Verify backend is running** on correct port:
```bash
# Backend should show:
🚀 Server: http://0.0.0.0:4000
```

2. **Check frontend API_BASE** matches backend port:
```env
# frontend/.env
VITE_API_BASE=http://localhost:4000
```

3. **Restart frontend** after changing .env:
```bash
cd frontend
npm run dev
```

---

## 📋 Correct Configuration

### Default Setup (Recommended)

**Backend** (`backend/.env`):
```env
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# IMPORTANT: Set to false for blockchain mode
MOCK_MODE=false

# Your deployed contract
PACKAGE_ID=0x...

# Your sponsor account
SPONSOR_PRIVATE_KEY=...
SPONSOR_ADDRESS=...
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE=http://localhost:4000
VITE_EVENT_ID=0x...
```

**Frontend Port** (default Vite = 5173):
- No configuration needed, Vite uses 5173 by default

---

### Custom Ports Setup

If you need different ports:

1. **Change backend port**:
```env
# backend/.env
PORT=3000
CORS_ORIGIN=http://localhost:5173  # Keep frontend port
```

2. **Update frontend API_BASE**:
```env
# frontend/.env
VITE_API_BASE=http://localhost:3000  # Match backend PORT
```

3. **Change frontend port** (in vite.config.ts):
```typescript
export default defineConfig({
  server: {
    port: 8080,  // Custom frontend port
  },
  // ...
})
```

4. **Update backend CORS**:
```env
# backend/.env
CORS_ORIGIN=http://localhost:8080  # Match frontend port
```

---

## ✅ Quick Verification Checklist

### Before Starting Development:

- [ ] **Backend .env exists** (`cp backend/.env.example backend/.env`)
- [ ] **Frontend .env exists** (`cp frontend/.env.example frontend/.env`)
- [ ] **CORS_ORIGIN** in backend matches frontend URL
- [ ] **VITE_API_BASE** in frontend matches backend URL
- [ ] **MOCK_MODE=false** in backend (for blockchain mode)
- [ ] **PACKAGE_ID** is set (from `sui client publish`)
- [ ] **SPONSOR_PRIVATE_KEY** is set
- [ ] **Sponsor account is funded** (check with `sui client balance`)

### After Configuration:

1. **Test backend** is accessible:
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","mode":"production",...}
```

2. **Check CORS** is configured:
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:4000/api/login
# Should return CORS headers
```

3. **Open browser console** (F12) and look for:
- ❌ No CORS errors
- ❌ No connection refused errors
- ✅ Successful API calls

---

## 🚀 Production Deployment

### Frontend on Different Domain:

If frontend is deployed to `https://lemanflow.app`:

```env
# backend/.env (production)
CORS_ORIGIN=https://lemanflow.app
```

```env
# frontend/.env.production
VITE_API_BASE=https://api.lemanflow.app
```

### Using Reverse Proxy (nginx):

```nginx
# Serve frontend
server {
  listen 80;
  server_name lemanflow.app;

  location / {
    root /var/www/frontend/dist;
  }

  # Proxy API requests
  location /api {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_set_header Origin http://localhost:4000;
  }
}
```

No CORS needed! Frontend and API on same domain.

---

## 🔍 Debugging Tips

### Enable Verbose Logging:

**Backend:**
```env
# backend/.env
NODE_ENV=development
```

Logs will show all requests and CORS headers.

**Frontend Console:**
```javascript
// Check API_BASE is correct
console.log('API_BASE:', import.meta.env.VITE_API_BASE);

// Check event ID
console.log('EVENT_ID:', import.meta.env.VITE_EVENT_ID);
```

### Network Tab (Browser DevTools):

1. Open DevTools (F12)
2. Go to Network tab
3. Try an API call
4. Click on failed request
5. Check:
   - **Request URL**: Should be `http://localhost:4000/api/...`
   - **Response Headers**: Should include `Access-Control-Allow-Origin`
   - **Status**: Should be 200, not 0 or ERR_CONNECTION_REFUSED

---

## 📞 Port Reference

| Service | Default Port | Environment Variable | Config File |
|---------|-------------|---------------------|-------------|
| Backend | 4000 | `PORT` | `backend/.env` |
| Frontend | 5173 | - | `vite.config.ts` |
| Sui RPC (testnet) | 443 | `SUI_RPC_URL` | `backend/.env` |

---

## 🆘 Still Having Issues?

1. **Restart everything**:
```bash
# Stop all terminals (Ctrl+C)

# Backend
cd backend
rm -rf node_modules/.vite  # Clear cache
npm run dev

# Frontend (new terminal)
cd frontend
rm -rf node_modules/.vite  # Clear cache
npm run dev
```

2. **Check firewall/antivirus** isn't blocking ports 4000 or 5173

3. **Try different ports** if defaults are in use:
```bash
# Check if port is in use
lsof -i :4000
lsof -i :5173
```

4. **Verify .env files are loaded**:
```bash
# Backend - should show your config
cd backend
npm run dev
# Look for: "📋 Configuration loaded"
```

---

**Remember:** Any change to `.env` files requires restarting the service!
