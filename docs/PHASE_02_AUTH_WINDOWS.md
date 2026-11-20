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

## 2 bis. Vérifier les dimensions du login corrigé

Ouvrir `http://127.0.0.1:15173/connexion` puis `/inscription`.

- Sur PC 12–16 pouces (notamment 1366×768 et 1920×1080) : carte de connexion recentrée et compacte ; bouton principal et lien « Créer un compte » visibles.
- Sur téléphone 320, 375 et 430 px : logo horizontal compact ; champs et bouton visibles, sans défilement horizontal. Un défilement vertical reste autorisé sur petits appareils/avec clavier affiché.
- Sur tablette : les deux colonnes passent à une seule sans laisser un panneau vert de pleine hauteur.
- Les formulaires doivent rester entièrement utilisables au clavier, sans texte ni champ coupés.
- Si le serveur Vite tournait déjà, un rechargement forcé `Ctrl + F5` suffit après `git pull` (le dossier frontend est monté en volume Docker).

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


## Mise à jour de la phase 2 — WhatsApp, récupération et organisations

### Nouvelles adresses
- `http://127.0.0.1:15173/inscription` : contact email ou téléphone, avec choix WhatsApp/SMS pour le téléphone.
- `http://127.0.0.1:15173/connexion` : connexion avec un contact vérifié et mot de passe.
- `http://127.0.0.1:15173/recuperation` : récupération du mot de passe par contact déjà vérifié.
- `http://127.0.0.1:15173/espace` : **vrai espace connecté** ; création d'organisation, adhésions et ajout d'un second contact vérifié.
- `http://127.0.0.1:15173/superadmin` : inventaire des organisations, réservé aux comptes `is_superuser` et `is_staff`.
- `http://127.0.0.1:15173/apercu` : reste la maquette publique non connectée de la phase 1.

### Configurer WhatsApp Business Cloud API (Meta) — officiel

Pré-requis hors code :
1. Créer ou utiliser une entreprise Meta, une application Meta avec le produit WhatsApp et un compte WhatsApp Business Platform.
2. Enregistrer un numéro expéditeur approprié. Récupérer le **Phone Number ID numérique**, qui est différent du numéro WhatsApp écrit avec un `+`.
3. Configurer un jeton d'accès de compte système avec les permissions WhatsApp Business Messaging et une gestion sécurisée de sa rotation.
4. Créer et faire approuver un modèle de catégorie **AUTHENTICATION**, avec bouton **Copy Code / Copier le code** (et la langue souhaitée). Le nom et la langue doivent correspondre exactement aux variables ci-dessous.
5. Consulter les conditions Meta et le tarif par conversation/modèle, et vérifier l'éligibilité aux destinataires du Mali. Le destinataire doit choisir WhatsApp et consentir à y recevoir son code.

Dans le fichier privé `.env` **sur le PC ou sur le serveur uniquement**, ajouter (valeurs ci-dessous non fonctionnelles) :

~~~dotenv
AGRO_WHATSAPP_VERIFICATION_ENABLED=true
META_WHATSAPP_ACCESS_TOKEN=JETON_PRIVE_ICI
META_WHATSAPP_PHONE_NUMBER_ID=IDENTIFIANT_NUMERIQUE_DE_META
META_WHATSAPP_OTP_TEMPLATE=nom_exact_du_modele_approuve
META_WHATSAPP_TEMPLATE_LANGUAGE=fr
META_GRAPH_API_VERSION=v25.0
~~~

L'intégration envoie le même code aléatoire à six chiffres dans le champ BODY et dans le bouton d'authentification COPY_CODE au moyen du Cloud API. La requête acceptée par Meta n'atteste **pas** de la livraison : il faut constater la réception réelle sur le téléphone test. Ne jamais créer de lien `wa.me` prétendant être une vérification OTP.

Documentation de référence :
- Meta, modèles d'authentification : https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/
- WhatsApp Business Cloud API : https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
- Exemple technique de template AUTHENTICATION et bouton copie : https://aws.amazon.com/blogs/messaging-and-targeting/send-whatsapp-business-messages-with-aws-end-user-messaging-social/

### Configurer un envoi réel par email (SMTP)

Choisir un fournisseur SMTP possédant un domaine expéditeur vérifié. Par exemple, si vous disposez d'un compte Brevo configuré, vous pouvez utiliser son relais SMTP avec les autorisations adaptées. Les variables privées sont :

~~~dotenv
AGRO_EMAIL_VERIFICATION_ENABLED=true
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_HOST_USER=IDENTIFIANT_SMTP_PRIVE
EMAIL_HOST_PASSWORD=CLE_SMTP_PRIVEE
EMAIL_USE_TLS=true
EMAIL_USE_SSL=false
DEFAULT_FROM_EMAIL=verification@domaine-expediteur-valide.example
~~~

Le domaine `example` est un **placeholder**. Ne pas activer tant que l'expéditeur n'est pas validé par le fournisseur. Il ne faut ni utiliser l'API de Gmail personnel pour du mailing automatisé ni placer les identifiants SMTP dans GitHub.

### Vérifier sans afficher de secrets

~~~powershell
git status --short
git switch feature/phase-02-authentication
git pull --ff-only origin feature/phase-02-authentication

docker compose config --quiet
docker compose build api web
docker compose up -d db
docker compose up -d api web
docker compose exec api python manage.py check
docker compose exec api python manage.py makemigrations --check --dry-run
docker compose exec api python manage.py migrate --noinput
docker compose exec api python manage.py test
docker compose exec web npm run build
docker compose exec web npm test

curl.exe http://127.0.0.1:15173/api/v1/auth/channels/
docker compose ps
~~~

Le résultat de `channels/` doit indiquer uniquement les méthodes réellement **configurées**. Si les fournisseurs sont toujours désactivés, le résultat attendu est :
~~~json
{"email":false,"phone":false,"whatsapp":false,"sms":false}
~~~

Pour appliquer **un changement de `.env`**, recréer uniquement l'API :
~~~powershell
docker compose up -d --no-deps --force-recreate api
~~~

Ne pas utiliser `docker compose down -v`, qui supprimerait la base. Ne pas partager `.env`, les OTP, les mots de passe, les captures d'OTP ou les jetons Meta/Twilio.

### Scénarios de validation finale
1. Inscription par email avec vrai code reçu, compte inactif avant vérification ; après vérification, connexion possible.
2. Inscription par WhatsApp avec vrai code reçu sur un numéro malien autorisé ; SMS facultatif en secours.
3. Un code périmé ou consommé est refusé. Une demande répétée trop tôt est limitée.
4. Le renvoi de code invalide l'ancien code et n'envoie pas deux messages lors d'un clic répété.
5. Le code de récupération réinitialise le mot de passe d'un compte vérifié uniquement.
6. Un second contact email ou téléphone ne fonctionne qu'après son propre OTP.
7. Le créateur d'organisation devient propriétaire ; le collaborateur invité ne voit **aucune donnée** tant qu'il n'a pas accepté ; il peut refuser l'invitation.
8. Un compte non membre ne peut pas lire/éditer l'autre organisation, et un collaborateur n'ajoute pas de membres.
9. Seul un véritable superadministrateur Django peut consulter la liste globale des organisations.
10. Vérifier sur PC, tablette et téléphone : menus, formulaires courts, retour clavier, scrolling, absence de débordement.

### Limites avant production
Les envois Meta et SMTP sont **implémentés, mais pas validés par réception réelle** sans comptes/jetons de prestataires. Les limitations de débit DRF utilisent encore un cache non partagé par défaut : avant déploiement multi-instances, mettre en place un cache Redis partagé et une limitation par IP/contact et des protections anti-abus approfondies. Aucune PR ne doit être fusionnée sans validation humaine.
