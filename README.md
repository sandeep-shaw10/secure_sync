# SecureSync

A secure Industrial IoT (IIoT) simulation system that protects plant data ingestion using a **Dual-Layer Security Architecture**:
1.  **JWT Authentication:** Role-based access control (Admin vs. Plant).
2.  **IP Whitelisting:** Network-layer verification ensuring data comes from authorized physical locations only.

This project demonstrates that **stolen credentials are not enough** to breach the system if the attacker is not on the whitelisted network.

---

## 🛠️ Tech Stack

* **Backend:** FastAPI (Python), Beanie (ODM), JWT, Passlib (Bcrypt)
* **Database:** MongoDB (Running in Docker)
* **Frontend:** Next.js 14 (App Router), Tailwind CSS, Axios
* **Infrastructure:** Docker & Docker Compose

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Docker Desktop** installed and running.

### 2. Build & Run
Open a terminal in the project root (where `docker-compose.yml` is located) and run:

```bash
docker-compose up --build
```
Wait for a few minutes. Once the logs stop scrolling, the services are ready.

---

## 🌐 Accessing the System

| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Admin Dashboard** | `http://localhost:3000` | **User:** `admin`<br>**Pass:** `admin123` |
| **Plant Login** | `http://localhost:3000/plant/login` | Created by Admin (see below) |
| **Backend API Docs** | `http://localhost:8000/docs` | Swagger UI for testing API |
| **MongoDB** | `mongodb://localhost:27017` | Accessible via Compass |

---

## 🧪 Usage Guide

### Step 1: Admin Setup
1.  Go to the **Admin Dashboard** (`http://localhost:3000`).
2.  Login with default credentials.
3.  Use the form on the left to **Register a New Plant**.
    * *Example Name:* `Gwalior Factory`
    * *Example Email:* `manager@gwalior.com`
    * *Example Password:* `manager@gwalior.com`
4.  **Important:** Check your Docker Terminal logs. You will see a simulated email with a **Verification Link**.
5.  **Click the Link:** This adds your current Docker Host IP (usually `172.x.x.x`) to the whitelist.

### Step 2: Plant Operation (Success Case)
1.  Go to the **Plant Login** (`http://localhost:3000/plant/login`).
2.  Login with the credentials you just created.
3.  You will be redirected to the **Plant Console**.
4.  Click **"Transmit Secure Data"**.
5.  ✅ **Result:** "Data Logged Successfully" (Because your IP is whitelisted).

---

## ⚔️ Simulating an Attack (The Demo)

This procedure demonstrates that an attacker with **Valid Credentials** but a **Different IP** cannot access the system.

### 1. Prepare the Environment
1.  Ensure the backend is running.
2.  Find your Docker Network name:
    ```bash
    docker network ls
    ```
    *(Look for the network name ending in `_default`, e.g., `secure_sync_default`)*.

### 2. Launch the Attacker
Open a **new terminal window** and run this command to start a temporary container (acting as a hacker on a different machine):

```bash
# Replace 'secure_sync_default' with your actual network name
docker run --rm -it --network secure_sync_default curlimages/curl sh
```

### 3. Execute the Attack
Inside the attacker terminal, run the following commands.

**Step A: Login (Theft)**
Use the valid credentials to get a token.

```bash
curl -X POST http://backend:8000/auth/plant/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@gwalior.com",
    "password": "manager@gwalior.com"
  }'
```
Copy the access_token from the response.

**Step B: Data Injection (Spoofing)** 
Try to send data using the stolen token. Replace `<PASTE_TOKEN>` with the token you copied.

```bash
curl -X POST http://backend:8000/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <PASTE_TOKEN>" \
  -d '{
    "plant_email": "manager@gwalior.com",
    "data_type": "inventory",
    "payload": {"HACK": "MALICIOUS DATA"}
  }'
```

### 4. The Result
⛔ Access Denied:
```json
{"detail":"Access Denied: IP 172.x.x.x is not whitelisted."}
```
The backend rejects the request because the attacker container has a different IP address than the authorized plant.

- - -

## 📂 Project Structure

```bash
secure_sync/
├── backend/            # FastAPI Application
│   ├── app/            # Routes, Models, Auth Logic
│   ├── Dockerfile      # Python Environment
│   └── requirements.txt
├── frontend/           # Next.js Application
│   ├── src/app/        # React Pages (Admin & Plant)
│   └── Dockerfile      # Node.js Environment
└── docker-compose.yml  # Orchestration
```