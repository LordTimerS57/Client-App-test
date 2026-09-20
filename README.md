# Client-App-test

## Connexion au backend

En développement, configurez le proxy Vite avec `VITE_API_SERVER` (par défaut `http://localhost:8080/ExServ`) puis lancez :

```bash
npm install
VITE_API_SERVER=http://localhost:8080/ExServ 
npm run dev
```

Le frontend appelle `/api`; le proxy transmet vers le backend Java. En production, définissez `VITE_API_URL` avec l'URL complète, par exemple `http://localhost:8080/ExServ/api`, ou placez le frontend derrière le même reverse proxy.

## Endpoints compte

Le client utilise les endpoints suivants : `POST /api/auth/register`, `POST /api/auth/login`, `PUT /api/users/{matricule}/profile`, `PUT /api/users/{matricule}/email` et `PUT /api/users/{matricule}/password`.
