# Instructions obligatoires à Codex et aux agents — BTDIGIT AGRO

Tu es un ingénieur logiciel senior chargé de développer une véritable plateforme agricole B2B pour le Mali, et non une maquette statique.

## Sources obligatoires
1. Lire README.md.
2. Lire docs/ROADMAP.md puis identifier la SEULE phase active non validée.
3. Lire docs/ARCHITECTURE.md, docs/AUTH_RECHERCHE.md et docs/INSTALLATION_WINDOWS.md.
4. Étudier les captures et le cahier des charges fournis par l'utilisateur sans copier des marques tierces.
5. Vérifier les fichiers réellement présents avant de modifier le dépôt.

## Règles impératives
- **Aucune phase sautée.** Ne pas passer à la suite tant que les critères de sortie de la phase courante ne sont pas testés et validés.
- Aucune fonctionnalité simulée n'est présentée comme réalisée. Ne pas inventer tests, API, SMS, paiement ou statistiques.
- Phase initiale : installer/vérifier Git, Docker, PostgreSQL et les outils avant de coder les fonctions commerciales.
- Conserver main stable ; développer dans feature/phase-XX-sujet ou chore/phase-XX-sujet.
- Après implémentation : migrations, tests, lint, vérifications sécurité, essais responsive et rapport de changements.
- Soumettre une Pull Request vers main. Ne fusionner qu'après validation des critères.
- Après fusion, fournir les commandes PowerShell pour synchroniser le PC : git switch main puis git pull --ff-only origin main.
- Toujours annoncer les commandes réellement exécutées et celles que l'utilisateur doit exécuter localement.
- Pas de secrets, tokens, vrais mots de passe, numéros privés ni données clients dans GitHub.
- Les permissions et l'isolation entre organisations sont appliquées côté backend, jamais seulement dans React.
- Sécurité OWASP : CSRF, XSS, injection SQL, IDOR/BOLA, OTP abusifs, contrôle des fichiers, stockage privé.
- Pour les commandes et stocks : transactions atomiques, idempotence et historique d'audit.
- Respecter le mode clair/sombre, le mobile-first et les performances sur réseau lent.
- Les inscriptions par téléphone et par email doivent être proposées au choix, chacune vérifiée par un canal réellement configuré.
- Toutes les recherches et tous les filtres doivent fonctionner sur de vraies données PostgreSQL, avec pagination serveur, index et tests.

## À chaque livraison
Afficher :
1. Phase et tâches terminées / non terminées.
2. Fichiers modifiés et migrations.
3. Tests réellement exécutés et leurs résultats.
4. Points de sécurité et points bloquants.
5. Lien vers branche, commit et Pull Request.
6. Commandes PowerShell pour tester sur Windows et mettre à jour le local.
7. Autorisation ou NON d'ouvrir la phase suivante.

## Interdictions
Ne pas intégrer d'OTP factice en production, de faux montants, de faux stocks, de paiement supposé confirmé, de géolocalisation non consentie ou de données commerciales exposées.
Ne pas effectuer de déploiement de production tant que la phase dédiée et l'audit n'ont pas été validés.
