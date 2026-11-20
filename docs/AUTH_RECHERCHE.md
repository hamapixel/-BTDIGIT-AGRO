# Spécifications prioritaires : inscription et recherche intelligente

Ce document décrit les critères de développement, pas des fonctions déjà disponibles.

## A. Inscription et connexion par téléphone OU email

### Parcours
1. Écran d'accueil : boutons « Continuer avec un numéro de téléphone » et « Continuer avec une adresse email ».
2. Le formulaire n'affiche que les champs pertinents pour le canal sélectionné.
3. Téléphone : indicatif pays (+223 proposé pour le Mali), saisie et normalisation E.164 via bibliothèque spécialisée, vérification du numéro.
4. Email : normalisation et vérification de l'adresse via lien signé ou code.
5. Créer le compte avec mot de passe suffisamment robuste ; ne pas autoriser un compte actif sans contact principal vérifié selon la politique du produit.
6. Choix du profil : producteur individuel, coopérative, acheteur professionnel ou transporteur.
7. Création du profil/organisation ; accès au tableau de bord correspondant.
8. Après inscription, autoriser l'ajout et la vérification d'un second canal sans fusionner automatiquement deux comptes distincts.

### Modèle et sécurité
- User avec UUID, email nullable unique si non-null, phone_e164 nullable unique si non-null, états de vérification séparés.
- Au moins un canal fourni ; validations applicatives et contraintes de base appropriées.
- Ne jamais identifier un compte par nom, prénom ou date de naissance : seul l'ID immuable fait foi.
- OTP : durée courte (p. ex. 5 min), tentatives limitées, délai avant renvoi, compteur par contact/IP, hachage des codes au repos, aucun OTP dans les logs de production.
- Réponses d'authentification évitant l'énumération des utilisateurs.
- Session protégée, cookies HttpOnly/Secure en production, CSRF si authentification par cookies.
- Séparation des rôles et contrôle objet/organisation à chaque API.
- OTP SMS via fournisseur effectivement souscrit/configuré. Email via SMTP effectivement configuré. Un simulateur n'est autorisé qu'en environnement de test clairement marqué. Sans fournisseur SMS, désactiver l'envoi réel et signaler le canal indisponible ; ne pas mentir sur la livraison.

### Tests de sortie
- Un utilisateur s'inscrit avec email, vérifie et se connecte.
- Un utilisateur s'inscrit avec téléphone, vérifie et se connecte avec prestataire configuré ou environnement test explicitement isolé.
- Doublons téléphone/email, OTP expiré, mauvais code, attaques répétées, renvoi et perte de session.
- Deux personnes ayant les mêmes noms ne partagent jamais un compte ou une organisation.
- Les données privées d'une organisation sont inaccessibles à une autre.

## B. Recherche instantanée et filtrage intelligent

### Expérience attendue
- Barre de recherche globale disponible depuis la page publique, le catalogue et les espaces acheteur.
- Suggestions après quelques caractères : produits, catégories, variétés, fournisseurs publics et localités, avec libellés désambiguïsés.
- Tolérance aux accents, casse, espaces et fautes légères ; correspondance exacte prioritaire.
- Déclenchement après délai de 200 à 300 ms, annulation des requêtes anciennes et contrôle du résultat le plus récent.
- État de chargement léger, message « aucun résultat », retour explicite si réseau indisponible.
- Filtres accessibles via panneau desktop ou bottom sheet mobile, réinitialisation en un geste.
- Filtrage combiné ET, avec nombre de résultats et pastilles de filtres actifs.
- Persistance des filtres dans l'URL pour le partage et le retour arrière.
- Prix toujours en FCFA, unités explicites ; conversion d'unité uniquement si connue et traçable.

### Filtres disponibles
Produit, catégorie, variété, région, cercle, commune, prix minimum/maximum, quantité minimale, unité, grade, statut vérifié, disponibilité, date de récolte, possibilité de livraison, prix négociable.

Tris : pertinence (par défaut), prix croissant/décroissant, plus récent, disponibilité.

### Contrat API prévu
GET /api/v1/search/suggestions/?q=riz
GET /api/v1/listings/?q=riz&region=...&category=...&min_price=...&max_price=...&sort=relevance&page=1&page_size=20

Les paramètres seront validés avec des schémas explicites, un plafond de taille de page et des résultats limités aux annonces publiques et réellement disponibles selon les règles métier.

### Stratégie PostgreSQL
1. Canonicalisation des noms de produits et synonymes agricoles administrables (ex. maïs, mais).
2. Index B-tree pour catégorie, statut, région, prix, date et disponibilité, selon EXPLAIN ANALYZE.
3. Extension PostgreSQL pg_trgm activée par migration versionnée ; index GIN trigram sur champs de recherche pertinents.
4. Recherche exacte/prefixe prioritaire, puis similarité trigram avec seuil ajusté sur tests ; éviter un classement surprenant.
5. Recherche full-text si elle améliore les performances et la pertinence mesurée.
6. Pagination côté API, préchargement ciblé des relations ; jamais charger des milliers de produits dans React pour les filtrer en local.
7. Tri stable, nettoyage de saisie, limites de requêtes, suivi des temps p50/p95 sans conserver abusivement des données personnelles.
8. Ne pas montrer une disponibilité en stock comme garantie si elle n'est pas réservée.

### Tests de sortie
- Recherches : riz, Riz, maïs, mais, variantes d'accents et fautes fréquentes mesurées.
- Combinaisons de filtres, bornes de prix, unités incompatibles, pages vides.
- Milliers d'annonces de test, requêtes SQL analysées, N+1 évités, résultats cohérents entre mobile et PC.
- Requête ancienne arrivant après nouvelle : ne doit pas remplacer le dernier résultat.
- URL partagée : restitue les mêmes filtres.
- Aucun résultat privé ou brouillon dans le catalogue public.
