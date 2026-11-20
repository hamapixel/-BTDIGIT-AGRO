# BTDIGIT AGRO — Phase 2 : inscription et connexion sans code OTP

**Version sur la branche `feature/phase-02-authentication` — PR #5 en brouillon.**
À la demande de l'utilisateur, tous les parcours visibles de codes SMS, WhatsApp et email ont été retirés.

## Correctif des refus d'inscription en développement (port 15173)

Si le formulaire affichait un message vague (« Veuillez vérifier les champs
du formulaire »), l'application tournait dans le navigateur sur
`http://127.0.0.1:15173`, mais les paramètres CSRF initiaux autorisaient
seulement `localhost:5173`. Avec le proxy Vite `/api`, Django reçoit un
`Origin` différent de son `Host` interne et peut refuser les POST avec
**HTTP 403** avant de consulter PostgreSQL.

La branche corrige les valeurs par défaut ET le service `api` dans
`compose.yaml`, en respectant le port `AGRO_WEB_PORT`. Pas de désactivation
de CSRF et pas de modification destructive en base.

~~~powershell
cd "$HOME\Desktop\btdigit-agro"
git switch feature/phase-02-authentication
git pull --ff-only origin feature/phase-02-authentication
docker compose config --quiet
docker compose up -d --no-deps --force-recreate api web
docker compose exec api python manage.py check
docker compose exec api python -c "from django.conf import settings; print('Origines CSRF :', settings.CSRF_TRUSTED_ORIGINS); print('Mode debug local :', settings.DEBUG)"
docker compose exec api python manage.py test
docker compose exec web npm test
~~~

L'affichage attendu inclut `http://127.0.0.1:15173` et
`http://localhost:15173`. Le mode DEBUG local doit être vrai pour un
site de développement HTTP (cookies non Secure) ; **ne jamais** activer
DEBUG en production.

Réessayer l'inscription après `Ctrl+F5` en utilisant son propre numéro.
Si une erreur apparaît encore, son texte inclut désormais les champs de
validation ou le code HTTP (par ex. CSRF HTTP 403). Consulter si nécessaire
`docker compose logs --tail=60 api` en masquant toute information sensible.
Ne jamais coller le mot de passe, les cookies, les jetons CSRF ou le fichier
`.env` dans une conversation.

## Parcours attendu

1. Choisir **Téléphone** ou **Email** sur `/inscription`.
2. Saisir un nom, un contact et un mot de passe fort (10 caractères minimum).
3. Cliquer sur **Créer mon compte** : Django crée le compte actif et ouvre une session immédiatement (cookies HttpOnly / CSRF).
4. Utiliser **Accéder à mon espace** : créer une organisation, accepter ses invitations ou gérer ses paramètres.
5. Pour se reconnecter : `/connexion`, contact + mot de passe, sans code supplémentaire.

La connexion n'exige plus de prestataire Meta WhatsApp, Twilio, Brevo, SMTP ou autre.
Les paramètres d'OTP obsolètes dans un `.env` existant ne sont plus utilisés.

## Tester sur Windows

~~~powershell
cd "$HOME\Desktop\btdigit-agro"
git status --short
git switch feature/phase-02-authentication
git pull --ff-only origin feature/phase-02-authentication

docker compose config --quiet
docker compose build api web
docker compose up -d db
docker compose run --rm api python manage.py check
docker compose run --rm api python manage.py makemigrations --check --dry-run
docker compose run --rm api python manage.py migrate --noinput
docker compose up -d --no-deps --force-recreate api
docker compose up -d web
docker compose exec api python manage.py test
docker compose exec web npm run build
docker compose exec web npm test
docker compose ps
~~~

**Ne jamais faire `docker compose down -v` : les données PostgreSQL seraient supprimées.**
Ne partagez jamais le contenu du fichier `.env` ou vos mots de passe.

## Tester le parcours réel

- Vitrine : http://127.0.0.1:15173/
- Inscription : http://127.0.0.1:15173/inscription
- Connexion : http://127.0.0.1:15173/connexion
- Espace connecté : http://127.0.0.1:15173/espace
- Superadmin : http://127.0.0.1:15173/superadmin
- API : http://127.0.0.1:15173/api/v1/health/

Le bouton **Créer mon compte** doit créer un compte et ouvrir une session immédiatement.
L'utilisateur n'a pas à remplir de code, même sans service SMS ou email configuré.
Un doublon d'email ou de téléphone doit être refusé sans écraser l'ancien compte.

## Organisations et invitations

**La possession de l'email ou du numéro n'est pas vérifiée.** Pour éviter
qu'une personne obtienne une invitation basée sur un numéro qu'elle a
simplement déclaré, les invitations reposent sur **l'identifiant UUID du compte**.
Le collaborateur peut le consulter dans **Mon espace**, le partager volontairement
avec son responsable, puis accepter ou refuser l'invitation.
Les permissions continuent d'être contrôlées par Django côté serveur.

## Modifier son compte

- Depuis une session ouverte, **Mon compte** permet de changer le mot de
  passe après saisie du mot de passe actuel.
- L'ajout d'un second contact exige aussi le mot de passe actuel et le
  contact ajouté reste marqué **non vérifié**.
- **Mot de passe oublié :** la récupération automatique publique est
  temporairement indisponible. Ne jamais permettre une réinitialisation
  en donnant simplement un email ou un numéro ; une récupération par lien
  sécurisé ou une vérification d'identité par support sera nécessaire.

## Points de sécurité avant une production publique

Cette simplification facilite la première utilisation, mais le contact
fourni n'est **pas** authentifié : réservation malveillante d'emails ou numéros,
difficultés de récupération du compte et usurpation possible de coordonnées.
Les comptes ne doivent pas recevoir un statut « contact vérifié », et cette
information ne doit pas servir à certifier un fournisseur, une exploitation
ou un acheteur. Conserver la limitation de requêtes ; pour plusieurs instances,
ajouter un cache partagé Redis, protections anti-bots et journaux d'audit.

Les anciennes tables de vérification peuvent rester dans les migrations
historiques pour préserver la compatibilité de la base ; **aucune route
OTP n'est exposée par l'API**.

## Checklist avant fusion de la PR #5

- [ ] Migration et tests Django réussis dans le Docker local.
- [ ] Build et tests React réussis sur Windows.
- [ ] Création d'un compte par email puis téléphone avec ouverture de session.
- [ ] Déconnexion / reconnexion par mot de passe, sans code.
- [ ] Refus de compte dupliqué, de mot de passe incorrect et de contact malformé.
- [ ] Création d'organisation, invitation par UUID et acceptation explicite.
- [ ] Vérification de la navigation et du rendu sur PC, tablette et mobile.
- [ ] Validation finale explicite de l'utilisateur avant fusion dans `main`.
