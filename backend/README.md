# Secure Sync Commands

### Docker Backend Build

```bash
docker-compose up --build
```

### Docker Attack from different IP

Open different terminal and perform

```bash
# Find docker username
docker network ls 

# Launch Attach container / replace backend_default with your actual network name
docker run --rm -it --network backend_default curlimages/curl sh

# Execute the spoof attack
curl -X POST http://backend:8000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "plant_email": "manager@gwalior.com",
    "data_type": "inventory",
    "payload": {"steel": "50 tons", "coal": "100 tons"}
  }'
```



