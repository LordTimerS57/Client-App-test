# Client-App-test

Client React/Vite pour `Java-Services-Test`.

## Démarrage

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:5173. En développement, les appels `/api` sont relayés vers `http://localhost:8080/ExServ` par Vite. Ajustez `VITE_API_SERVER` si le contexte de déploiement Java est différent :

```bash
VITE_API_SERVER=http://localhost:8080/ExServ npm run dev
```

Pour une URL d'API publique ou un reverse proxy, copiez `.env.example` vers `.env` et définissez `VITE_API_URL`.

## API consommée

Le backend Jersey expose son mapping sous `/api` :

- `GET/POST /api/users`
- `GET/PUT/DELETE /api/users/:matricule`
- `GET /api/users/:matricule/messages`
- `GET/POST /api/messages`
- `GET/PUT/DELETE /api/messages/:id`
- `PUT /api/messages/:id/signaler`
- `PUT /api/messages/:id/masquer`

Le formulaire de création de message utilise l'utilisateur sélectionné comme envoyeur. Le matricule d'un destinataire est facultatif pour créer un message public.
