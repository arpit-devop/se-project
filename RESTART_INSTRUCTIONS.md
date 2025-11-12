# Restart Instructions

## Backend sudah running ✓
Backend server sudah berjalan di http://localhost:8000

## Frontend - RESTART REQUIRED!

1. **Stop frontend server:**
   - Di PowerShell window frontend, tekan `Ctrl+C`

2. **Start ulang:**
   ```powershell
   cd frontend
   npm start
   ```

3. **Tunggu sampai compile selesai** (30-60 detik)

## Setelah restart:

- ✅ WebSocket akan connect ke port 3000 (bukan 443)
- ✅ Frontend akan connect ke http://localhost:8000
- ✅ Signup/Login akan bekerja

## Test signup:
1. Buka http://localhost:3000
2. Klik "Switch to register"
3. Isi form:
   - Email: test@example.com
   - Full name: Test User
   - Role: Pharmacist
   - Password: test123
4. Klik "Create account"

## Jika masih error:
- Pastikan backend running (check http://localhost:8000/docs)
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

