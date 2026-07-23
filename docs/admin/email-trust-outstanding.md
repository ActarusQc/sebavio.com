# Validations restantes — confiance publique & messagerie (interne)

Date : 2026-07-23  
Lot : SEO 2.1  
Statut : non public (ne pas servir via Next.js)

## Identité légale (à compléter)

- [ ] Raison sociale / forme juridique
- [ ] Adresse légale
- [ ] Responsable des renseignements personnels
- [ ] Juridiction / tribunaux (validation juridique)
- [ ] Révision juridique des pages Confidentialité et Conditions

## Politique commerciale

- [ ] Politique de remboursement officielle (délais, exclusions, procédure)
- [ ] Portail client d’annulation d’abonnement (si souhaité)
- [ ] Parcours libre-service « supprimer mon compte »

## Conservation des données

- [ ] Durées de conservation formalisées au-delà des règles techniques actuelles
- [ ] Politique de purge des soft-deletes

## SMTP2GO / délivrabilité (sebavia.com)

- [ ] Domaine `sebavia.com` validé comme domaine d’envoi dans SMTP2GO
- [ ] Adresse `bonjour@sebavia.com` autorisée comme expéditeur (From)
- [ ] SPF : inclure les mécanismes SMTP2GO recommandés (aujourd’hui SPF
      limité à `a mx ip4:…` sans include smtp2go)
- [ ] DKIM : enregistrements SMTP2GO pour sebavia.com (si distincts du
      sélecteur `default` déjà présent)
- [ ] DMARC : passer de `p=none` à une politique plus stricte après tests
- [ ] Alias / boîte `bonjour@sebavia.com` confirmée côté messagerie
      (réception réelle)

## From technique actuel (prod, lot 2.1)

- `CONTACT_EMAIL` / `EMAIL_REPLY_TO` : `bonjour@sebavia.com`
- `EMAIL_FROM` : conserve l’expéditeur actuellement présent en `.env`
  (domaine historique `@sebavio.com`) — **ne pas basculer vers**
  `bonjour@sebavia.com` tant que le domaine / l’adresse ne sont pas
  autorisés dans SMTP2GO **et** que l’authentification SMTP fonctionne.
- Authentification SMTP testée le 2026-07-23 depuis Contabo :
  ports 2525 / 587 / 8025 → **échec 535 Incorrect authentication data**.
  Les identifiants `SMTP_USER` / `SMTP_PASSWORD` doivent être régénérés
  dans le tableau de bord SMTP2GO (ne pas les coller dans Git).
- Réseau : DNS `mail.smtp2go.com` OK ; TCP 2525/587 joignables.
- SPF `sebavia.com` : `v=spf1 a mx ip4:… ~all` — **pas d’include SMTP2GO**
  (modification DNS à autoriser explicitement).
- DMARC : `p=none` ; DKIM sélecteur `default` présent (à confirmer vs
  enregistrements SMTP2GO).

## Retour arrière SMTP

1. Restaurer `/var/www/sebavio.com/.env.backup-smtp-20260723`
2. Redémarrer PM2 `sebavio`
3. Ne pas supprimer l’ancien backup tant que la livraison n’est pas
   confirmée.
