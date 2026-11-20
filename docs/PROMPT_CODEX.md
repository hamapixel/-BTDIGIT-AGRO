# Prompt de démarrage à copier dans Codex — BTDIGIT AGRO

Tu développes BTDIGIT AGRO dans le dépôt https://github.com/hamapixel/-BTDIGIT-AGRO.
Le projet est une marketplace agricole B2B pour le Mali, créée par BTDIGIT : producteurs, coopératives, acheteurs professionnels et transporteurs.

Consulte d'abord, dans cet ordre :
1. README.md
2. AGENTS.md
3. docs/ROADMAP.md
4. docs/INSTALLATION_WINDOWS.md
5. docs/ARCHITECTURE.md
6. docs/AUTH_RECHERCHE.md

**Contrainte absolue : ne sauter aucune étape.** Commence par la phase 0 si son environnement local n'a pas été vérifié. N'implémente pas les phases futures « pour gagner du temps ». Respecte la validation humaine des étapes.

Priorités fonctionnelles :
- Inscription au choix par téléphone +223 ou email et vérification réelle du canal.
- Mobile-first : PWA premium Android/iPhone/tablette/PC avec palette agricole.
- Catalogue B2B et recherche instantanée PostgreSQL indexée, filtres intelligents cumulables, rapidité mesurée.
- Permissions multi-organisations sécurisées ; devis, commandes et stocks fiables.
- Back-office super admin BTDIGIT ; rapports réels, documents A4, notifications et logistique.
- Tests, Docker, GitHub, synchronisation Windows, puis Coolify/Traefik uniquement à la phase finale.

Procédure par itération :
A. Examiner l'existant et donner la phase active.
B. Décrire la petite modification à réaliser et ses critères.
C. Créer une branche dédiée, implémenter du vrai code et les tests correspondants.
D. Exécuter les commandes de vérification et afficher les résultats honnêtement.
E. Ouvrir une Pull Request, attendre la validation avant fusion.
F. Fournir les commandes PowerShell pour git switch main / git pull --ff-only origin main, et pour tester.
G. Mettre à jour la roadmap uniquement avec des étapes réellement validées.

N'affirme jamais qu'une application, un OTP, une recherche ou une base de données fonctionne avant d'avoir les preuves correspondantes.
