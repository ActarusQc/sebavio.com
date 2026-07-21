# Sécurité FDE

- Clé uniquement dans `.env` serveur (`FDE_API_KEY`).
- Interdit : `NEXT_PUBLIC_*`, bundle client, logs, réponses API.
- Appels FDE uniquement depuis `src/integrations/fde` (backend).
- Anti-SSRF : en production, `FDE_BASE_URL` limité à `fde.monteregia.com` + HTTPS.
- L’API publique Sebavio n’accepte pas d’URL FDE cliente.
- Rate-limit Redis : 30 req/h/utilisateur (`fde:rl:*`).
- Coordonnées / rayon / limite bornés côté serveur.
