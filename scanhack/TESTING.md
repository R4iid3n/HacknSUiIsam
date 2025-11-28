# 🧪 Guide de Test ScanHack

## Problème connu avec DFX

Il y a un problème connu avec dfx et les couleurs du terminal qui cause des crashes. **Mais les canisters peuvent quand même être déployés !**

## Solution : Tester dans ton terminal

Ouvre un **nouveau terminal** et exécute :

```bash
# 1. Charger le PATH pour dfx
export PATH="$HOME/Library/Application Support/org.dfinity.dfx/bin:$PATH"

# 2. Aller dans le dossier scanhack
cd scanhack

# 3. Démarrer le réseau ICP (si pas déjà démarré)
dfx start --background

# 4. Attendre quelques secondes
sleep 5

# 5. Déployer tous les canisters
dfx deploy

# 6. Récupérer les IDs des canisters
dfx canister id registry
dfx canister id missions
dfx canister id grantvault
dfx canister id backend

# 7. Mettre à jour frontend/.env.local avec ces IDs
# (Le script deploy.sh le fait automatiquement)

# 8. Tester un canister
dfx canister call registry register

# 9. Lancer le frontend
cd frontend
npm run dev
```

## Tests à effectuer

### ✅ Test 1: Canisters déployés
```bash
dfx canister call registry register
# Devrait retourner un User
```

### ✅ Test 2: Créer un événement
```bash
dfx canister call backend createEvent '("dorahacks-2024", 1_000_000)'
```

### ✅ Test 3: Créer une mission
```bash
dfx canister call missions createMission '("dorahacks-2024", "Test Mission", "Description", 10_000)'
```

### ✅ Test 4: Frontend
1. Ouvrir http://localhost:3000
2. Login avec Internet Identity
3. Vérifier le Dashboard
4. Tester le Scan QR
5. Tester l'Admin panel

## Si dfx crash encore

Essaie avec :
```bash
NO_COLOR=1 dfx deploy
```

Ou désactive les couleurs dans ton terminal temporairement.

## URLs importantes

- **Frontend local:** http://localhost:3000
- **ICP Network:** http://localhost:8000
- **Internet Identity local:** http://localhost:8080

## Vérification rapide

```bash
# Vérifier que dfx fonctionne
dfx --version

# Vérifier que le réseau tourne
curl http://localhost:8000/api/v2/status

# Vérifier les canisters
dfx canister status --all
```

---

**Note:** Le problème de couleur est un bug connu de dfx dans certains environnements. Les canisters fonctionnent normalement malgré ce message d'erreur.

