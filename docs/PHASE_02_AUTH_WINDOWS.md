# Phase 2.1 — Comptes email / téléphone (guide Windows)

**État : branche de travail, Pull Request #5 en brouillon. Ne pas fusionner.**
La phase 2.1 implémente le début de l'authentification, pas encore les profils/organisations ou la récupération de comptes.

## 1. Récupérer la branche depuis Windows

~~~powershell
cd "$HOME\Desktop\btdigit-agro"
git status --short
git fetch origin
git switch --track origin/feature/phase-02-authentication
~~~

Si la branche existe déjà localement :

~~~powershell
git switch feature/phase-02-authentication
git pull --ff-only origin feature/phase-02-authentication
~~~

**Ne pas exécuter git pull sur main pour récupérer une fonctionnalité encore en brouillon.**

## 2. Construire et vérifier

Le projet PostgreSQL 17 et les services de la phase 1 restent dans les volumes existants.

~~~powershell
docker compose config --quiet
docker compose build api web
docker compose up -d api web
docker compose exec api python manage.py check
docker compose exec api python manage.py makemigrations --check --dry-run
docker compose exec api python manage.py migrate --noinput
docker compose exec api python manage.py test --verbosity 2
docker compose exec web npm run build
docker compose exec web npm test
docker compose ps
~~~

Ne jamais utiliser `docker compose down -v`.

## 3. Vérifier les routes

~~~powershell
curl.exe http://127.0.0.1:18080/api/v1/health/
curl.exe http://127.0.0.1:15173/api/v1/auth/channels/
~~~

Par défaut (tant qu'aucun vrai prestataire n'est connecté) :
~~~json
{"email":false,"phone":false}
~~~

Ouvrir dans le navigateur :

- `http://127.0.0.1:15173/inscription` : choix téléphone ou email ; le canal non configuré indique clairement son indisponibilité.
- `http://127.0.0.1:15173/connexion` : formulaire d'identification ; aucun utilisateur n'est créé automatiquement.
- `http://127.0.0.1:15173/apercu` : reste un aperçu non authentifié, indépendamment des nouveaux comptes.

## 4. Activer un fournisseur réel (optionnel, après configuration)

Le fichier `.env` est privé. Ne jamais le copier dans un message ou un commit. Pour activer la vérification email, utiliser un prestataire SMTP autorisé avec un expéditeur validé, en ajoutant à `.env` :

~~~dotenv
AGRO_EMAIL_VERIFICATION_ENABLED=true
EMAIL_HOST=smtp.mon-fournisseur.example
EMAIL_PORT=587
EMAIL_HOST_USER=identifiant-smtp
EMAIL_HOST_PASSWORD=secret-smtp-prive
EMAIL_USE_TLS=true
EMAIL_USE_SSL=false
DEFAULT_FROM_EMAIL=verification@mon-domaine-valide.example
~~~

Les valeurs ci-dessus sont **des exemples non fonctionnels**. Un envoi réel doit être testé vers une adresse appartenant au testeur et avec le service activé.

Pour SMS, le fournisseur Twilio est intégré comme option :

~~~dotenv
AGRO_SMS_VERIFICATION_ENABLED=true
AGRO_SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC_IDENTIFIANT_REEL
TWILIO_AUTH_TOKEN=SECRET_PRIVE
TWILIO_FROM_NUMBER=NUMERO_EXPEDITEUR_AUTORISE
~~~

Vérifier auprès du prestataire les droits d'envoi et l'acheminement au **Mali** avant d'activer le canal. Les paramètres non configurés doivent rester désactivés et les identifiants ne doivent pas être partagés.

Après mise à jour de `.env`, recréer seulement le conteneur API :

~~~powershell
docker compose up -d --no-deps --force-recreate api
~~~

Les tests unitaires utilisent des prestataires simulés **uniquement dans leur exécution isolée**, sans envoyer de véritables SMS ou emails. Les fonctions de l'API ne se déclarent pas opérationnelles en production sans un test réel de livraison.

## 5. Sécurité intégrée et limites à compléter

- L'identité technique est un UUID ; le nom complet ne détermine pas l'identité d'un compte.
- Numéros normalisés E.164, Mali par défaut (+223), email en minuscules.
- OTP stocké par hachage, expiration 5 minutes, 5 essais maximum, émission après délai minimal 60 secondes.
- Mot de passe jamais enregistré en clair ; comptes inactifs avant vérification.
- Sessions protégées par cookie HttpOnly et CSRF.
- Limitation des requêtes API par IP via cache Django **local au processus seulement** : une solution de cache partagé (par ex. Redis) et des limites renforcées sont requises avant un déploiement public à plusieurs instances.
- La récupération de compte, le renvoi explicite du code, les vérifications d'identité avancées et l'isolation multi-organisation sont prévus aux étapes suivantes de la phase 2.
- Ne pas divulguer le code OTP, les identifiants ou les réponses avec secret.

## 6. À transmettre pour valider l'étape 2.1

- Résultats des migrations et tests backend/frontend.
- Résultat de l'API channels et captures des écrans inscription/connexion.
- Si un fournisseur a été réellement configuré, indiquer seulement « email reçu » ou « SMS reçu », sans le code.
- Confirmer le comportement mobile/tablette/desktop.

**La Pull Request #5 reste en brouillon tant que les étapes 2.1, 2.2 et 2.3 ne sont pas validées.**
