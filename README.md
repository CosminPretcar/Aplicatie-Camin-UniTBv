# Camin

Platforma web pentru administrarea și utilizarea serviciilor unui cămin. Proiectul include o interfață React, un API Express, o bază de date PostgreSQL și un serviciu Flask pentru chatbot.

## Structura proiectului

- `frontend/my-react-app` - aplicația React + Vite
- `backend` - API-ul Express și gestionarea autentificării, sesizărilor, forumului și programărilor
- `chatbot-flask` - API Flask pentru răspunsurile chatbotului
- `cypress` - teste end-to-end
- `docker-compose.yml` - configurarea serviciilor PostgreSQL, backend și frontend

## Cerințe

Pentru rulare locală:

- Node.js și npm
- PostgreSQL, dacă baza de date nu este pornită prin Docker
- Python 3.10 pentru serviciul chatbot
- Docker Desktop, opțional, pentru rularea întregului stack

## Configurare

Completează valorile goale din `docker-compose.yml` sau creează un fișier `.env` în `backend` cu variabilele utilizate de aplicație:

> Nu publica niciodată fișierul `.env` și nu introduce parole, tokenuri sau parole de aplicație reale în README, `docker-compose.yml` ori în cod. Fișierele `.env` sunt ignorate de Git prin `.gitignore`.

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=parola
DB_NAME=camin
DB_PORT=5433
SESSION_SECRET=schimba-aceasta-valoare
PORT=4000
EMAIL_USER=adresa@example.com
EMAIL_PASS=parola-sau-app-password
```

Valorile pentru email sunt necesare doar pentru funcționalitățile care trimit notificări.

## Rulare cu Docker Compose

Din directorul rădăcină:

```bash
docker compose up --build
```

Serviciile vor fi disponibile la:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- PostgreSQL: `localhost:5433`

Pentru oprire:

```bash
docker compose down
```

## Rulare locală

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

Într-un terminal separat:

```bash
cd frontend/my-react-app
npm install
npm run dev
```

Frontend-ul va porni la http://localhost:3000.

### Chatbot

Instalează dependențele în mediul Python al proiectului și verifică existența fișierelor modelului (`chatbot_model.keras`, `vectorizer.pickle` și `label_encoder.pickle`) în `chatbot-flask`.

```bash
cd chatbot-flask
python -m pip install flask tensorflow numpy
python chatbot_api.py
```

API-ul chatbotului expune endpointul `POST /chat` și rulează implicit pe portul Flask `5000`.

Exemplu de cerere:

```bash
curl -X POST http://localhost:5000/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Cum fac o sesizare?\"}"
```

## Testare

Instalează dependențele Cypress din rădăcina proiectului:

```bash
npm install
```

Rulează testele în modul interactiv:

```bash
npx cypress open
```

Sau în modul headless:

```bash
npx cypress run
```

Testele presupun că frontend-ul rulează la `http://localhost:3000`.

## Comenzi utile

```bash
# Verificare și build frontend
cd frontend/my-react-app
npm run lint
npm run build
```
