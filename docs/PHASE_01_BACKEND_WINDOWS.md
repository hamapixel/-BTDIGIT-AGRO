# Phase 1.1 — Django + PostgreSQL (Windows PowerShell)

**État : CI GitHub et tests Django en local confirmés ; vérification HTTP de l'API Windows encore nécessaire.** Ne pas fusionner tant que les contrôles n'ont pas réussi.

## 1. Récupérer la branche sans modifier main

~~~powershell
cd "$HOME\Desktop\btdigit-agro"
git status --short
git fetch origin
git switch --track origin/feature/phase-01-socle
~~~

Si la branche locale existe déjà : `git switch feature/phase-01-socle`, puis `git pull --ff-only origin feature/phase-01-socle`.

## 2. Préparer l'environnement local SANS écraser .env

~~~powershell
py -3.12 -c "import secrets; print(secrets.token_urlsafe(48))"
notepad .env
~~~

Dans le fichier `.env` existant, **conserver** les quatre paramètres PostgreSQL et leur mot de passe déjà sécurisé. Ajouter les lignes ci-dessous avec une nouvelle clé Django générée par la commande précédente (sans partager la clé) :

~~~dotenv
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=REMPLACER_PAR_UN_SECRET_GENERE
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
~~~

L'accès PostgreSQL dans Docker passe par le service `db` et le port interne `5432` ; sur Windows, l'accès à PostgreSQL est exposé uniquement sur `127.0.0.1:55432`.

## 3. Construire le conteneur Django et tester la configuration

~~~powershell
docker compose config --quiet
docker compose up -d db
docker compose build api
docker compose run --rm api python manage.py check
docker compose run --rm api python manage.py makemigrations --check --dry-run
~~~

**Important :** si `makemigrations --check` signale des écarts, s'arrêter, conserver la sortie complète et faire corriger la migration dans la branche ; ne pas appliquer de migrations partielles en silence.

## 4. Appliquer les migrations et exécuter les tests

~~~powershell
docker compose run --rm api python manage.py migrate --noinput
docker compose run --rm api python manage.py test --verbosity 2
~~~

Il est normal que l'installation initiale crée les tables Django et le modèle utilisateur. Ne jamais supprimer le volume PostgreSQL pour régler une erreur.

## 5. Démarrer l'API

Le port hôte `8000` est déjà occupé par SUGU KURA sur le PC. BTDIGIT AGRO utilise maintenant `127.0.0.1:18080` sans arrêter l'autre projet ; dans le conteneur Django le port reste `8000`.

Si `18080` est également occupé, choisir un autre port libre (ex. `18081`) via `AGRO_API_PORT=18081` dans `.env` puis recréer **seulement** le conteneur `api` avec `docker compose up -d --force-recreate api`. Adapter ensuite l'URL du test HTTP. Ne jamais écraser ou communiquer `.env`.


~~~powershell
docker compose up -d --force-recreate api
docker compose ps
curl.exe http://127.0.0.1:18080/api/v1/health/
~~~

Réponse attendue lorsque PostgreSQL fonctionne :

~~~json
{"status":"ok","database":"ok","service":"btdigit-agro-api"}
~~~

En cas d'erreur : `docker compose logs --tail=100 api`. Ne pas envoyer les secrets et ne pas exposer le contenu de `.env`.

## 6. Ce qui n'est PAS encore construit
- Inscription par téléphone ou email et OTP : phase 2.
- Frontend React et design mobile : prochaine étape 1.2.
- Catalogue/recherche instantanée : phase 3.
- Commandes, paiements, transport et administration : phases ultérieures.

## 7. Validation et synchronisation Git
Fournir les sorties de `check`, `makemigrations --check`, `migrate`, `test` et `curl.exe`. La PR reste en brouillon jusqu'à validation. Une fois fusionnée dans main, seulement alors exécuter :

~~~powershell
git switch main
git pull --ff-only origin main
~~~
