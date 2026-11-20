# Phase 0 — Installation sur Windows (PowerShell)

**But :** mettre le projet sur le PC, créer PostgreSQL avec Docker, vérifier la base ; ne pas commencer Django/React avant validation. Les commandes ci-dessous sont à exécuter sur le PC de développement, pas dans GitHub.

## 1. Pré-requis
Installer et lancer Docker Desktop (moteur Docker opérationnel), Git, Python maintenu et Node.js LTS. Puis ouvrir PowerShell :

~~~powershell
git --version
docker --version
docker compose version
python --version
node --version
npm --version
~~~

## 2. Cloner le dépôt
~~~powershell
cd "$HOME\Desktop"
git clone https://github.com/hamapixel/-BTDIGIT-AGRO.git btdigit-agro
cd .\btdigit-agro
git status
~~~

Si le dépôt est déjà cloné :
~~~powershell
git switch main
git pull --ff-only origin main
~~~

## 3. Préparer les variables locales
~~~powershell
Copy-Item .env.example .env
notepad .env
~~~

Remplacer POSTGRES_PASSWORD par un secret aléatoire robuste dans le fichier .env ; NE PAS partager ce fichier et NE PAS le pousser sur GitHub. Ne pas modifier POSTGRES_DB/USER sans raison.

## 4. Créer la base PostgreSQL par commande
~~~powershell
docker compose config
docker compose up -d db
docker compose ps
~~~

Au premier démarrage avec un volume vierge, le conteneur PostgreSQL crée automatiquement l'utilisateur et la base indiqués dans .env.

~~~powershell
docker compose exec db psql -U btdigit_agro -d btdigit_agro -c "SELECT current_database(), current_user;"
~~~

Résultat attendu : base btdigit_agro, utilisateur btdigit_agro. Si une autre base existe déjà dans le volume, modifier POSTGRES_DB ne crée PAS rétroactivement une nouvelle base ; utiliser une commande CREATE DATABASE adaptée sans supprimer les données existantes.

## 5. Vérifier et arrêter sans supprimer les données
~~~powershell
docker compose ps
git status --short
docker compose stop
~~~

Pour redémarrer : docker compose up -d db. Ne jamais utiliser docker compose down -v sur une base contenant des données à conserver : cela supprime le volume.

## 6. Workflow de développement après validation
Chaque étape future se fait d'abord sur une branche :

~~~powershell
git switch main
git pull --ff-only origin main
git switch -c feature/phase-01-socle
~~~

Après tests et PR validée/fusionnée sur GitHub, synchronisation du PC :
~~~powershell
git switch main
git pull --ff-only origin main
docker compose up -d
~~~

À partir de la phase 1, des commandes de migration Django seront ajoutées et exécutées conformément à la documentation mise à jour. Ne pas lancer des commandes manage.py inexistantes à ce stade.

## Checklist à renvoyer pour valider la phase 0
1. Sortie de docker compose ps.
2. Résultat SQL de SELECT current_database(), current_user().
3. Sortie de git status --short (ne doit pas révéler .env).
4. Confirmation de fonctionnement Docker sur le PC.

**Aucun test Windows ou SQL n'est déclaré réussi avant son exécution réelle.**
