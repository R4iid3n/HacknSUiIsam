# 📦 ScanHack Installation Guide

Complete step-by-step installation instructions for ScanHack.

---

## Prerequisites

### Required Software:

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **DFX SDK (ICP Development Kit)**
   - Installation: `sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"`
   - Verify: `dfx --version`

3. **Git**
   - Usually pre-installed on macOS/Linux
   - Verify: `git --version`

---

## Installation Steps

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd scanhack
```

### Step 2: Run Setup Script

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

This will:
- Check if DFX SDK is installed (install if needed)
- Install frontend dependencies (`npm install`)

### Step 3: Start Local ICP Network

```bash
dfx start --background
```

Wait for the network to start (about 10-15 seconds).

### Step 4: Deploy Canisters

```bash
./scripts/deploy.sh
```

This will:
- Build the frontend
- Deploy all canisters (registry, missions, grantvault, backend, frontend)
- Generate `frontend/.env.local` with canister IDs

### Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## Configuration

### Environment Variables

After deployment, `frontend/.env.local` is automatically generated. If you need to update it manually:

```env
NEXT_PUBLIC_REGISTRY_CANISTER_ID=<canister-id>
NEXT_PUBLIC_MISSIONS_CANISTER_ID=<canister-id>
NEXT_PUBLIC_GRANTVAULT_CANISTER_ID=<canister-id>
NEXT_PUBLIC_BACKEND_CANISTER_ID=<canister-id>
NEXT_PUBLIC_IC_HOST=http://localhost:8000
NEXT_PUBLIC_IC_IDENTITY_PROVIDER=http://localhost:8080?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai
```

### Get Canister IDs

```bash
dfx canister id registry
dfx canister id missions
dfx canister id grantvault
dfx canister id backend
dfx canister id frontend
```

---

## First-Time Setup

### 1. Create an Event

1. Open the frontend: `http://localhost:3000`
2. Login with Internet Identity
3. Go to Admin panel
4. Create an event:
   - Event ID: `dorahacks-2024`
   - Initial Vault Cycles: `1000000`

### 2. Create a Mission

1. In Admin panel, go to "Create Mission" tab
2. Fill in:
   - Event ID: `dorahacks-2024`
   - Title: `Complete Workshop`
   - Description: `Attend the workshop`
   - Reward: `10000` cycles
3. Click "Create Mission"

### 3. Generate QR Code

1. In Admin panel, go to "Generate QR" tab
2. Select the mission
3. Set expiration (default: 3600 seconds = 1 hour)
4. Click "Generate QR Code"
5. Download or print the QR code

### 4. Test the Flow

1. Open Dashboard (or use a different browser/incognito)
2. Login with Internet Identity
3. Go to Scan page
4. Scan the QR code you generated
5. Mission should complete successfully
6. Check Passport to see your HackPass and Attestation

---

## Troubleshooting

### Issue: DFX not found

**Solution:**
```bash
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
export PATH="$HOME/bin:$PATH"
```

### Issue: Canister deployment fails

**Solution:**
```bash
# Stop and restart DFX
dfx stop
dfx start --background

# Try deploying again
dfx deploy
```

### Issue: Frontend can't connect to canisters

**Solution:**
1. Check that canisters are deployed: `dfx canister list`
2. Verify `.env.local` has correct canister IDs
3. Make sure `NEXT_PUBLIC_IC_HOST` is set to `http://localhost:8000`
4. Restart frontend dev server

### Issue: Internet Identity not working

**Solution:**
- For local development, use: `http://localhost:8080?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`
- Make sure Internet Identity canister is running: `dfx canister id internet_identity`

### Issue: QR scanner not working

**Solution:**
1. Make sure you're using HTTPS or localhost (required for camera access)
2. Grant camera permissions in browser
3. Try a different browser (Chrome recommended)

---

## Production Deployment

### Deploy to ICP Mainnet

1. **Get cycles:**
   ```bash
   dfx wallet --network ic balance
   ```

2. **Deploy canisters:**
   ```bash
   dfx deploy --network ic
   ```

3. **Update frontend/.env.local:**
   ```env
   NEXT_PUBLIC_IC_HOST=https://ic0.app
   NEXT_PUBLIC_IC_IDENTITY_PROVIDER=https://identity.ic0.app
   ```

4. **Build and deploy frontend:**
   ```bash
   cd frontend
   npm run build
   dfx deploy frontend --network ic
   ```

---

## Additional Resources

- **ICP Documentation:** https://internetcomputer.org/docs/
- **Motoko Language:** https://internetcomputer.org/docs/current/motoko/main/motoko
- **DFX Commands:** https://internetcomputer.org/docs/current/references/cli-reference/dfx-parent
- **Internet Identity:** https://internetcomputer.org/docs/current/tokenomics/identity-auth/what-is-ii

---

## Support

For issues or questions:
1. Check the documentation in `docs/` directory
2. Review error messages in browser console
3. Check DFX logs: `dfx logs`

---

**Happy Hacking! 🚀**

