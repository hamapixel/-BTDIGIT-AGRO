# Roadmap officielle BTDIGIT AGRO — progression sans sauts

Date de création : 20 novembre 2026. Chaque case reste non cochée tant qu'elle n'a pas été réellement validée. Aucun résultat n'est considéré acquis à la seule lecture de ce document.

## PHASE 0 — Préparation et environnement (TERMINÉE le 20/11/2026)
- [x] Vérifier dépôt GitHub, statut de main, outils locaux (Git, Docker, Python, Node) : Git 2.55, Docker Compose 5.6, Node 24.19, npm 11.17, Python 3.14.6 et 3.12 disponibles via le lanceur py. La commande `python` est masquée par `C:\\Windows\\System32\\python` ; utiliser `py -3.12`.
- [x] Cloner le dépôt sur le PC Windows.
- [x] Créer un fichier .env local ignoré par Git ; changement du mot de passe exposé confirmé par l'utilisateur.
- [x] Démarrer PostgreSQL via Docker Compose ; créer la base par variables POSTGRES_DB/POSTGRES_USER.
- [x] Vérifier par commande SQL que la base btdigit_agro existe et est accessible.
- [x] Valider docker compose config et vérifier .env ignoré/non suivi par Git.
- [x] Confirmer l'authentification PostgreSQL via `psql -h db -W` : réponse SQL `1`, code de sortie `0`.
- [x] Confirmer que l'ancien mot de passe PostgreSQL divulgué a été remplacé dans la base ET dans `.env` (déclaration explicite de l'utilisateur, sans publication du secret).
- [x] Consigner la réussite de l'installation ; phase 1 ouverte après validation du test SQL réseau (`1`, code `0`).
**Sortie** : capture ou sortie des commandes git status, docker compose ps, SELECT current_database() ; installation reproductible sur PC.

## PHASE 1 — Socle technique et identité visuelle (ACTIVE)
- [ ] Initialiser Django + DRF avec configuration PostgreSQL et API /api/v1/health/.
- [ ] Initialiser React + TypeScript + Vite + Tailwind, routes et composants accessibles.
- [ ] Définir identité BTDIGIT AGRO : vert forêt #145C3B, vert agricole #78A344, or #D5A335, ivoire #F7F5EC, vert nuit #24392D.
- [ ] Créer layout public, header/sticky desktop, sidebar fixe, barre mobile inférieure et thèmes clair/sombre.
- [ ] Créer modèle utilisateur personnalisé AVANT les premières migrations.
- [ ] Ajouter tests backend/frontend initiaux, formatage, CI GitHub Actions.
- [ ] Vérifier affichage téléphone/tablette/PC et performances de base.
**Sortie** : API et frontend démarrables, migrations reproductibles, tests et CI verts.

## PHASE 2 — Authentification, profils et organisations
- [ ] Choix explicite inscription par téléphone OU email.
- [ ] Téléphone normalisé E.164 (dont +223), email normalisé et un contact principal vérifié.
- [ ] OTP SMS via prestataire réel ou OTP/lien email via SMTP réel ; mode test isolé.
- [ ] Mots de passe sûrs, expiration/limites d'OTP, récupération de compte, gestion sessions.
- [ ] Choix du rôle (producteur, coopérative, acheteur professionnel, transporteur).
- [ ] Création organisation, membres et permissions côté API ; super admin distinct.
- [ ] Tester non-divulgation entre organisations, changements de profil et refus d'accès.
**Sortie** : inscription, vérification et connexion réelles avec tests ; canaux non configurés signalés indisponibles.

## PHASE 3 — Catalogue, annonces et recherche intelligente (PRIORITÉ PRODUIT)
- [ ] Catégories, régions/cercles/communes administrables, annonces, récoltes, photos et unités.
- [ ] Recherche instantanée réelle et suggestions, noms proches, accents, fautes simples.
- [ ] Filtres cumulables : catégorie, produit, région, cercle, prix min/max, quantité, unité, qualité, disponibilité, fournisseur vérifié, livraison.
- [ ] Tri pertinence, prix, disponibilité, nouveauté ; pagination serveur.
- [ ] PostgreSQL : index B-tree et GIN/pg_trgm, vérification EXPLAIN ANALYZE.
- [ ] Frontend : debounce, annulation requêtes obsolètes, état des filtres dans l'URL et interface tactile.
- [ ] Benchmarks réalistes avec milliers d'annonces ; aucun filtrage de la totalité du catalogue uniquement en navigateur.
**Sortie** : tests fonctionnels et de charge ciblés, résultats cohérents et recherche performante mesurée.

## PHASE 4 — Mise en relation et commerce B2B
- [ ] Demandes d'achat, propositions, messagerie reliée aux demandes.
- [ ] Devis négociables, dates d'expiration, historique et instantané des prix.
- [ ] Commandes, états métier, réservations de quantités en transaction atomique.
- [ ] Bons de commande/devis/livraison A4 PDF, numérotation unique par organisation.
- [ ] Tests concurrence, isolation des données, annulation et réception partielle.
**Sortie** : parcours complet producteur → acheteur → devis → commande sans incohérence de stock.

## PHASE 5 — Transport et notifications
- [ ] Demandes de transport, cotations, attribution, preuves de réception et litiges.
- [ ] Notifications internes, email et SMS uniquement si les prestataires sont configurés.
- [ ] Consentements, préférences et audit des communications.
**Sortie** : livraison documentée et suivie, sans fausse promesse de tracking GPS.

## PHASE 6 — Administration et tableaux de bord
- [ ] Back-office BTDIGIT séparé avec contrôle strict des droits.
- [ ] Modération, vérification des fournisseurs, support et audit.
- [ ] Rapports producteurs, acheteurs et administrateurs, filtres dates, exports.
**Sortie** : statistiques réelles, actions sensibles journalisées, tests multi-rôles.

## PHASE 7 — PWA et expérience multi-appareils
- [ ] Manifest, icônes, service worker et installation sur navigateurs compatibles.
- [ ] Navigation mobile de type application native ; tablettes portrait/paysage ; PC.
- [ ] Fonctionnement dégradé hors ligne, brouillons, resynchronisation sûre.
- [ ] Tests Android, iPhone/Safari compatible, tablette et desktop.
**Sortie** : PWA installable lorsque prise en charge, avec limitations documentées.

## PHASE 8 — Monétisation et services évolués
- [ ] Plans acheteurs, abonnements, commissions explicites, facturation plateforme.
- [ ] Suivi paiements externes, vérification réelle et litiges.
- [ ] Contrôles réglementaires BCEAO, protection des données et fiscalité avant encaissement automatisé.
**Sortie** : modèles de revenus testés, sans garde de fonds ni faux paiements.

## PHASE 9 — Préproduction et lancement pilote
- [ ] Audit sécurité, revues d'autorisations, tests intégration/e2e et charge.
- [ ] Sauvegardes PostgreSQL chiffrées et test réel de restauration.
- [ ] Préparer production Docker/Coolify/Traefik, HTTPS et domaine.
- [ ] Monitoring, logs, alertes, politique de retour arrière et documentation.
- [ ] Vérifier sur appareils et réseaux réels au Mali.
**Sortie** : feu vert pilote uniquement sur preuves ; lancement massif à évaluer séparément.

## Rituel obligatoire pour chaque phase
1. Analyser l'existant et annoncer le périmètre.
2. Créer branche GitHub dédiée.
3. Développer et migrer la base si nécessaire.
4. Écrire/exécuter tests, auditer permissions et tester écrans.
5. Ouvrir une PR avec preuves et checklist.
6. Valider, fusionner sur main et mettre à jour le local.
7. Cocher les cases prouvées, documenter ce qui reste, puis passer à la phase suivante.

**Règle absolue : ne jamais marquer une étape comme validée sans preuve d'exécution.**
