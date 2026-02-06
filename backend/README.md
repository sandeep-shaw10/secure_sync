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

#The "Theft" (Login to get Token) The attacker uses the stolen credentials to get a valid token.
curl -X POST http://backend:8000/auth/plant/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@gwalior.com",
    "password": "manager@gwalior.com"
  }'

#get response like this {{"access_token":"eyJhb...", ...}}
#The "Spoof" (Try to Send Data) Now the attacker tries to use that valid token to send fake data. Replace <PASTE_TOKEN_HERE> with the token you just copied.
curl -X POST http://backend:8000/api/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtYW5hZ2VyQGd3YWxpb3IuY29tIiwicm9sZSI6InBsYW50IiwiZXhwIjoxNzcwNDY1MzIwfQ.AsBl0ZIWrzYj_3aj5bMF_dpIil46SDG2fkw-i1BuuUw" \
  -d '{
    "plant_email": "manager@gwalior.com",
    "data_type": "inventory",
    "payload": {"steel": "9999 tons", "coal": "0 tons"}
  }'



