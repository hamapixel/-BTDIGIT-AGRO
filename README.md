# BTDIGIT AGRO

Marketplace agricole B2B professionnelle pour le Mali, créée par **BTDIGIT**.

## Objectif
Mettre en relation producteurs, coopératives, acheteurs professionnels et transporteurs, avec des annonces vérifiables, des demandes de devis, des commandes sécurisées et une interface mobile-first installable en PWA.

## Situation du projet
**Phase 0 — cadrage et installation : en cours.**
Ce dépôt est en cours d'initialisation. Aucun backend, frontend, OTP ou paiement ne doit être présenté comme fonctionnel à ce stade.

## Stack cible
- Backend : Django LTS + Django REST Framework, Python, PostgreSQL
- Frontend : React + TypeScript + Vite + Tailwind CSS
- Infrastructure : Docker Compose en local, GitHub Actions, puis Coolify et Traefik
- Mobile : PWA progressive pour téléphone, tablette et ordinateur
- Langues prévues : français, bambara, anglais ; monnaie : FCFA (XOF)

## Documentation
- [Roadmap séquentielle](docs/ROADMAP.md)
- [Consignes obligatoires pour Codex et les développeurs](AGENTS.md)
- [Installation locale sous Windows](docs/INSTALLATION_WINDOWS.md)
- [Spécification inscription et recherche](docs/AUTH_RECHERCHE.md)
- [Architecture cible et sécurité](docs/ARCHITECTURE.md)

## Règle de développement
**Une phase = implémentation réelle + tests + vérification mobile/tablette/PC + rapport + Pull Request + validation, puis seulement passage à la phase suivante.**

Pour toute modification : créer une branche, développer/tester, ouvrir une Pull Request, fusionner après validation puis synchroniser son PC avec git pull --ff-only origin main.

Ne jamais committer de secrets, de fichiers .env réels, de sauvegardes ni de données personnelles.
