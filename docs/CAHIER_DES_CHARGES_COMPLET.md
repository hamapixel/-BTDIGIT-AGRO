# PROMPT MAÎTRE — CRÉATION DE BTDIGIT AGRO DE A À Z

## 1. MISSION

Tu es un ingénieur logiciel senior full-stack, architecte SaaS, expert Django/PostgreSQL, développeur PWA, UX/UI designer premium et spécialiste de la cybersécurité.

Ta mission est de concevoir, développer, tester et préparer au déploiement une plateforme professionnelle complète appelée **BTDIGIT AGRO**.

**Créateur : BTDIGIT**

**Pays de lancement : Mali**

**Concept :** marketplace agricole B2B connectant producteurs, coopératives, grossistes, commerçants, entreprises agroalimentaires, restaurants, hôtels, distributeurs et transporteurs.

**Ambition :** moderniser l'approvisionnement et la commercialisation des produits agricoles au Mali, puis permettre une extension dans d'autres pays africains.

Ne réalise pas une simple maquette. Construis une application réellement fonctionnelle avec backend, base de données, frontend responsive, authentification, gestion des permissions, transactions commerciales, administration, tests et configuration de production.

Ne prétends jamais qu'une fonctionnalité fonctionne avant son implémentation et sa vérification.

## 2. EXPÉRIENCE UTILISATEUR

L'application doit donner l'impression d'utiliser une application mobile native moderne.

Elle doit être :

- Premium, élégante et professionnelle.
- Mobile-first et parfaitement responsive.
- Installable en PWA sur les plateformes compatibles.
- Optimisée pour les téléphones Android courants au Mali.
- Adaptée aux iPhone, tablettes, ordinateurs Windows, macOS et Linux via leurs navigateurs compatibles.
- Rapide et légère sur les connexions Internet lentes ou instables.
- Accessible, lisible et intuitive.
- Adaptée aux personnes peu habituées aux logiciels.
- Sécurisée et fiable.
- Compatible avec les écrans tactiles, souris et clavier.

La simplicité est prioritaire. L'utilisateur doit pouvoir trouver un produit agricole et envoyer une demande de devis sans parcours compliqué.

### Navigation sur téléphone

Créer une interface mobile premium avec :

- Header compact et fixe.
- Logo BTDIGIT AGRO.
- Recherche accessible.
- Icône de notifications.
- Avatar et menu du profil.
- Barre de navigation inférieure fixe.
- Maximum cinq entrées principales selon le rôle.
- Icônes élégantes avec libellés.
- Boutons de grande taille.
- Cartes produits adaptées au tactile.
- Modales ou bottom sheets mobiles.
- Transitions fluides et discrètes.
- Respect des zones de sécurité des iPhone.
- Absence de défilement horizontal parasite.
- Contenu jamais caché derrière la navigation fixe.

### Navigation sur ordinateur

Prévoir :

- Sidebar gauche fixe et élégante.
- Header supérieur sticky.
- Recherche globale.
- Menu utilisateur.
- Zone de contenu aérée.
- Tableaux professionnels avec filtres.
- Cartes de statistiques.
- Grilles adaptatives.
- Menus contextuels.
- Modales modernes.
- Absence de mouvements indésirables du menu pendant le scroll.

### Navigation sur tablette

Prévoir une interface intermédiaire, avec grilles adaptatives, sidebar rétractable, menus tactiles et lisibilité optimale en portrait comme en paysage.

Masquer visuellement les barres de défilement lorsque cela ne nuit pas à l'accessibilité, tout en conservant le défilement fonctionnel.

## 3. IDENTITÉ GRAPHIQUE

Créer un véritable design system agricole premium.

### Palette principale

- Vert forêt : #145C3B
- Vert agricole : #78A344
- Or récolte : #D5A335
- Blanc ivoire : #F7F5EC
- Vert nuit : #24392D
- Blanc : #FFFFFF
- Gris secondaire : #728078

Les couleurs fonctionnelles (erreur, succès, alerte) doivent rester clairement compréhensibles et accessibles.

### Style visuel

- Typographie Inter ou Manrope avec polices de secours.
- Cartes élégantes aux coins arrondis.
- Ombres très légères.
- Grands espaces de respiration.
- Icônes Lucide.
- Illustrations agricoles professionnelles.
- Photos authentiques de cultures et de produits agricoles avec droits d'utilisation vérifiés.
- Animations discrètes avec Framer Motion ou équivalent si pertinent.
- Skeleton loaders.
- Toasts élégants.
- Confirmations SweetAlert2 adaptées au thème.
- Mode clair et mode sombre complets.
- Contraste WCAG AA.
- Animation réduite selon les préférences système.

Ne surcharge jamais les pages avec des effets 3D ou des animations lourdes.

## 4. TECHNOLOGIES ET ARCHITECTURE

Construire une architecture évolutive, cohérente et maintenable.

### Backend

- Python avec une version stable maintenue.
- Django avec une version LTS maintenue.
- Django REST Framework pour les API.
- PostgreSQL.
- Redis lorsque nécessaire.
- Celery pour les tâches asynchrones.
- Authentification sécurisée.
- Permissions serveur par rôle et par organisation.
- Stockage privé pour les documents sensibles.
- Génération PDF des documents commerciaux.
- API versionnée et documentée avec OpenAPI.

### Frontend

- React avec TypeScript et Vite.
- Tailwind CSS.
- Bibliothèque de composants accessible et personnalisable.
- React Router.
- TanStack Query pour les données distantes.
- React Hook Form et Zod pour les formulaires.
- PWA avec service worker et stratégie de cache contrôlée.

Séparer clairement frontend, API, services métier, modèles, permissions, tâches et tests.

### Infrastructure

- Docker et Docker Compose.
- Environnements développement, test et production.
- Variables d'environnement.
- Git et GitHub.
- CI GitHub Actions.
- Déploiement sur VPS avec Coolify et Traefik.
- HTTPS obligatoire.
- Domaine et sous-domaines configurables.
- Sauvegardes PostgreSQL chiffrées.
- Stockage persistant des médias.
- Journalisation structurée.
- Surveillance de disponibilité.
- Procédure de restauration documentée.

Ne jamais exposer PostgreSQL, Redis, les secrets ou les interfaces internes d'administration sur Internet sans protection adaptée.

## 5. RÔLES UTILISATEURS

Prévoir les rôles suivants :

1. Visiteur public.
2. Producteur individuel.
3. Coopérative agricole.
4. Acheteur professionnel.
5. Transporteur.
6. Gestionnaire d'organisation.
7. Employé autorisé d'une organisation.
8. Support BTDIGIT.
9. Administrateur BTDIGIT.
10. Super administrateur BTDIGIT.

Un utilisateur peut appartenir à plusieurs organisations avec des rôles distincts.

Les permissions doivent toujours être validées côté backend.

Une organisation ne doit jamais accéder aux dossiers, commandes, documents ou données privées d'une autre organisation, sauf dans le cadre explicite d'une transaction qui les relie.

## 6. MODULE D'INSCRIPTION ET DE CONNEXION

Créer :

- Inscription par téléphone et/ou email.
- Vérification par OTP avec fournisseur réellement configuré.
- Connexion par mot de passe.
- Réinitialisation sécurisée.
- Gestion des sessions.
- Déconnexion de tous les appareils.
- Double authentification pour les comptes administratifs sensibles.
- Protection contre les tentatives abusives.
- Gestion du profil et des appareils actifs.

### Formulaire d'organisation

Champs configurables :

- Nom commercial.
- Type d'organisation.
- Téléphone.
- Email.
- Région.
- Cercle et commune.
- Localisation.
- Adresse.
- Photo ou logo.
- Description de l'activité.
- Documents professionnels facultatifs ou requis selon le niveau de vérification.
- Identifiants d'entreprise selon les obligations applicables.

Ne pas exiger de manière uniforme des documents administratifs qu'un petit producteur individuel ne possède pas nécessairement.

Créer trois états de vérification : non vérifié, vérification en cours, vérifié.

## 7. ESPACE PRODUCTEUR ET COOPÉRATIVE

Créer un tableau de bord agricole avec :

- Mes produits.
- Mes récoltes disponibles.
- Mes annonces publiées.
- Mes demandes reçues.
- Mes devis.
- Mes commandes.
- Mes livraisons.
- Mon chiffre d'affaires confirmé.
- Mes clients professionnels.
- Mon abonnement.
- Mes notifications.
- Mon profil.

### Publication de produits

Formulaire comprenant :

- Nom du produit.
- Catégorie agricole.
- Variété.
- Photos.
- Description.
- Région de production.
- Quantité disponible.
- Unité : kg, tonne, sac, caisse, etc.
- Poids net pour les conditionnements variables.
- Prix par unité.
- Prix négociable ou fixe.
- Quantité minimale de commande.
- Qualité et grade.
- Date de récolte.
- Disponibilité immédiate ou future.
- Durée de validité de l'annonce.
- Possibilité de livraison.
- Conditions de stockage.
- Informations de traçabilité si disponibles.

Permettre l'enregistrement en brouillon et la modification des annonces.

### Catégories agricoles initiales

- Céréales : riz, mil, maïs, sorgho.
- Légumes : oignons, tomates, pommes de terre, carottes.
- Fruits : mangues, bananes, agrumes.
- Légumineuses : arachides, niébé.
- Sésame et oléagineux.
- Autres produits agricoles configurables.

Les catégories doivent être modifiables dans l'administration.

Ne jamais inventer de certifications qualité ou de labels.

## 8. ESPACE ACHETEUR PROFESSIONNEL

Créer un espace pour les grossistes, magasins, hôtels, restaurants, transformateurs et entreprises.

Fonctionnalités :

- Catalogue agricole professionnel.
- Recherche instantanée.
- Filtres par produit, région, prix, disponibilité, qualité, quantité et unité.
- Fiche fournisseur.
- Vérification des informations professionnelles.
- Favoris.
- Comparaison des offres.
- Demande de devis.
- Demandes d'achat en volume.
- Historique des fournisseurs.
- Gestion des bons de commande.
- Suivi des livraisons.
- Suivi des dépenses.
- Documents PDF.
- Notifications de disponibilité.

### Fonction « Je recherche un produit »

Un acheteur peut publier une demande :

Exemple :

Produit : oignons.
Quantité : 2 tonnes.
Lieu de livraison : Bamako.
Date souhaitée : configurable.
Budget indicatif : facultatif.
Exigences de qualité : configurables.

Les fournisseurs correspondant aux critères peuvent envoyer des propositions.

## 9. MOTEUR DE MISE EN RELATION B2B

Créer une recherche performante permettant de rapprocher offres et demandes.

Critères :

- Produit.
- Catégorie.
- Quantité.
- Unité.
- Région.
- Disponibilité.
- Prix.
- Grade.
- Possibilités logistiques.
- Statut de vérification du fournisseur.

Les recommandations doivent rester explicables et ne pas présenter une estimation comme une disponibilité garantie.

Éviter qu'une commande soit validée sur une quantité inexistante.

Prévoir des réservations de stock transactionnelles pour éviter les doubles ventes.

## 10. SYSTÈME DE DEVIS ET NÉGOCIATION

Créer un véritable circuit commercial :

1. L'acheteur consulte une offre.
2. Il envoie une demande.
3. Le fournisseur répond.
4. Les deux parties négocient si autorisé.
5. Une proposition définitive est émise.
6. Le devis précise son expiration.
7. L'acheteur accepte.
8. Le fournisseur confirme.
9. La commande est créée.
10. La livraison et la réception sont suivies.

Chaque modification importante des conditions doit être historisée.

Un devis accepté doit conserver un instantané des produits, prix, unités, taxes applicables, parties et conditions.

## 11. COMMANDES ET DOCUMENTS

Statuts de commande :

- Brouillon.
- En attente de confirmation.
- Confirmée.
- En préparation.
- Prête pour enlèvement.
- En livraison.
- Livrée.
- Réception partielle.
- Réception confirmée.
- Annulée.
- En litige.

Prévoir des transitions autorisées, avec permissions, motifs et traces d'audit.

Documents A4 professionnels :

- Demande de devis.
- Devis.
- Bon de commande.
- Bon de livraison.
- Accusé de réception.
- Facture commerciale lorsque légalement applicable.
- Reçu de paiement lorsque confirmé.
- Avoir ou document correctif si nécessaire.

Tous les documents doivent comporter des numéros uniques par organisation et type, les données commerciales correctes et une mise en page imprimable.

## 12. MODULE DE TRANSPORT

Prévoir une première version simple :

- Adresse de chargement.
- Adresse de livraison.
- Date souhaitée.
- Nature des marchandises.
- Poids.
- Volume facultatif.
- Besoin de véhicule.
- Devis de transport.
- Transporteur attribué.
- Statut de transport.
- Confirmation d'enlèvement.
- Preuve de livraison.
- Réclamation.

La position GPS et le suivi en temps réel ne seront ajoutés qu'avec consentement approprié et services réellement disponibles.

Le transport doit pouvoir être organisé par un partenaire externe, sans obliger la plateforme à posséder des véhicules.

## 13. PAIEMENTS ET MONÉTISATION

Devise de référence : FCFA (XOF).

Utiliser des valeurs monétaires entières et des calculs décimaux précis pour les quantités et les taux.

### Modèles économiques configurables

- Inscription producteur gratuite.
- Abonnement acheteur.
- Abonnement entreprise avancé.
- Commission sur transactions éligibles.
- Services de mise en relation ou de visibilité.
- Services logistiques proposés par partenaires.

Les tarifs sont configurés par le super administrateur.

Ne pas facturer automatiquement une commission et un abonnement sur la même opération sans règles commerciales explicites.

### Paiements

Pour le MVP, permettre un suivi des paiements réalisés directement entre parties, avec preuves facultatives et validation explicite.

Ne jamais considérer une capture d'écran comme preuve définitive d'un paiement.

Prévoir une architecture d'intégration pour les opérateurs de paiement agréés, sans inventer d'API ni conserver les fonds des clients sur les comptes propres à la plateforme.

Étudier et respecter les règles BCEAO, les obligations fiscales et celles de protection des données applicables avant l'activation d'un encaissement automatisé.

## 14. MESSAGERIE ET NOTIFICATIONS

Créer une messagerie liée aux offres et commandes.

Fonctions :

- Discussions acheteur-fournisseur.
- Historique.
- Pièces jointes contrôlées.
- Blocage et signalement.
- Notifications de nouveaux messages.
- Notifications de devis reçus.
- Notifications de commandes.
- Notifications de livraison.
- Notifications d'expiration.
- Notifications de paiement confirmé.
- Notifications de litige.

Canaux possibles :

- Notifications dans l'application.
- Email.
- SMS.
- WhatsApp Business avec intégration autorisée.

N'activer que les canaux disposant de fournisseurs réellement configurés. Prévoir les consentements et préférences de communication.

## 15. SUPER ADMIN BTDIGIT

Créer un back-office premium, distinct des espaces commerciaux.

Modules :

- Vue d'ensemble.
- Utilisateurs.
- Organisations.
- Producteurs.
- Coopératives.
- Acheteurs.
- Transporteurs.
- Vérifications.
- Produits et annonces.
- Devis.
- Commandes.
- Livraisons.
- Litiges.
- Abonnements.
- Commissions.
- Facturation de la plateforme.
- Paiements de services.
- Support.
- Notifications.
- Catégories.
- Régions et localités.
- Paramètres.
- Journaux de sécurité.
- Rapports et statistiques.

Le super administrateur doit pouvoir :

- Approuver ou refuser les vérifications.
- Suspendre des comptes avec motif.
- Modérer des annonces.
- Consulter les historiques autorisés.
- Traiter les signalements.
- Gérer les politiques de commissions.
- Gérer les abonnements.
- Superviser les commandes.
- Exporter les rapports.
- Gérer les collaborateurs internes.

Les employés du support ne doivent pas disposer automatiquement des droits de super administrateur.

Chaque action administrative sensible doit être journalisée.

## 16. RAPPORTS ET TABLEAUX DE BORD

Créer des tableaux de bord adaptés à chaque rôle.

### Producteur

- Quantités disponibles.
- Quantités vendues.
- Commandes confirmées.
- Chiffre d'affaires confirmé.
- Produits les plus demandés.
- Évolution des ventes.

### Acheteur

- Achats par période.
- Dépenses.
- Fournisseurs.
- Commandes en cours.
- Produits achetés.
- Délais de livraison.

### Super administrateur

- Organisations inscrites.
- Organisations vérifiées.
- Annonces actives.
- Devis émis.
- Commandes confirmées.
- Volume de transactions enregistré.
- Commissions effectivement dues.
- Revenus de la plateforme effectivement encaissés.
- Litiges.
- Taux de conversion.

Filtres : jour, semaine, mois, année et période personnalisée.

Exports CSV, Excel et PDF selon les besoins.

Aucune statistique fictive en production.

## 17. PWA — INSTALLATION SUR TOUS LES ÉCRANS

C'est une priorité absolue.

### Téléphone

Construire une PWA installable, avec :

- Manifest complet.
- Nom et nom court.
- Icônes 192 et 512 pixels.
- Icônes maskable.
- Icône Apple Touch.
- Mode standalone.
- Splash screen selon les capacités du système.
- Couleur du thème.
- Service worker.
- Interface mobile plein écran adaptée.
- Instructions d'installation.
- Notification des mises à jour disponibles.

Sur les navigateurs compatibles, proposer le bouton « Installer l'application ».

Pour les plateformes ne permettant pas une invitation automatique, afficher les étapes d'ajout à l'écran d'accueil.

### Tablette

Assurer le fonctionnement tactile, la rotation, le mode paysage, le mode portrait et une navigation adaptée.

### Ordinateur

Proposer l'installation PWA lorsque le navigateur la prend en charge.

Permettre l'ouverture dans une fenêtre dédiée, sans les éléments habituels du navigateur lorsque cette fonction est disponible.

Ne pas promettre un fichier APK, IPA ou EXE natif par défaut : la PWA est le premier mode de distribution. Étudier un emballage natif seulement si nécessaire.

### Mode hors connexion

Prévoir :

- Affichage des ressources applicatives déjà installées.
- Lecture de certaines données précédemment synchronisées et autorisées.
- Brouillons d'annonces hors ligne.
- Brouillons de formulaires hors ligne.
- Indicateur de connexion.
- État de synchronisation.
- Reprise contrôlée après reconnexion.
- Gestion des erreurs et conflits.

Ne pas confirmer hors ligne une commande, un stock, un paiement ou une transaction nécessitant une validation serveur.

Ne pas mettre en cache les documents d'identité, les secrets ni les informations sensibles dans un cache public.

## 18. LANGUES ET LOCALISATION

Langue par défaut : français.

Préparer l'internationalisation pour :

- Français.
- Bambara.
- Anglais.

Utiliser une architecture de traduction centralisée.

Éviter les textes codés en dur.

Prévoir des formulations courtes et compréhensibles pour les utilisateurs peu familiarisés avec l'informatique.

Fuseau horaire par défaut : Africa/Bamako.

Devise : XOF.

Formats de dates : adaptés au contexte local.

Les régions, cercles et communes doivent être administrables, afin de suivre l'évolution de l'organisation territoriale.

## 19. SÉCURITÉ AVANCÉE

Priorité absolue : protéger les utilisateurs, les organisations, les paiements et les données commerciales.

Implémenter :

- HTTPS.
- Contrôles d'accès backend.
- Isolation des données par organisation.
- Protection CSRF.
- Protection XSS.
- Prévention des injections SQL via ORM et requêtes paramétrées.
- Protection contre l'accès non autorisé aux objets (IDOR/BOLA).
- Validation stricte des entrées.
- Limitation des tentatives d'authentification.
- Cookies sécurisés et sessions protégées.
- Authentification renforcée pour les administrateurs.
- Gestion sécurisée des secrets.
- Téléversement sécurisé des fichiers.
- Antivirus ou analyse de fichiers lorsque pertinent.
- Protection contre les fichiers exécutables malveillants.
- Autorisation des téléchargements de documents privés.
- Logs et audit.
- Sauvegardes automatisées.
- Tests de restauration.
- Surveillance des erreurs.
- Politique de rétention et de suppression des données.
- Minimisation des données personnelles.

Ne jamais exposer les données privées d'un producteur à un autre producteur.

Ne jamais permettre à un acheteur de modifier les commandes appartenant à un autre acheteur.

Tester systématiquement les permissions avec plusieurs comptes et organisations.

## 20. FIABILITÉ DES DONNÉES COMMERCIALES

Prévoir les contraintes métier suivantes :

- Identifiants uniques.
- Quantités strictement validées.
- Prix numériques valides.
- Conversions d'unités explicites.
- Quantités disponibles jamais négatives.
- Stock réservé séparé du stock disponible.
- Pas de double validation de commande.
- Transactions atomiques.
- Idempotence des opérations sensibles.
- Historique de modifications.
- Annulation avec motif.
- Gestion des offres expirées.
- Contrôle des produits désactivés.
- Gestion des livraisons partielles.
- Gestion de réclamations sur quantité ou qualité.
- Aucun reçu de paiement sans confirmation vérifiable.

Ne jamais utiliser des valeurs flottantes binaires pour les montants financiers.

## 21. SITE PUBLIC ET MARKETING

Créer un site vitrine premium intégré.

Pages :

- Accueil.
- Comment ça marche.
- Produits agricoles.
- Trouver des fournisseurs.
- Vendre sa récolte.
- Solutions pour entreprises.
- Nos tarifs.
- À propos.
- Contact.
- Centre d'aide.
- Conditions d'utilisation.
- Politique de confidentialité.

### Hero principal

Titre :

« Du champ au marché, connectons les professionnels agricoles. »

Sous-titre :

« BTDIGIT AGRO rapproche les producteurs, coopératives et acheteurs professionnels pour faciliter l'approvisionnement agricole au Mali. »

Boutons :

- Explorer les produits.
- Je suis producteur.
- Je suis acheteur.

Utiliser des photos agricoles authentiques.

Créer des sections de présentation des avantages, des catégories et du fonctionnement.

Optimiser le référencement naturel, les performances et le partage sur WhatsApp.

## 22. PAGES ET ÉCRANS À DÉVELOPPER

### Public

- Accueil.
- Catalogue.
- Recherche.
- Détail produit.
- Détail fournisseur public.
- Connexion.
- Inscription.
- Choix du profil.
- Réinitialisation du mot de passe.
- Tarifs.
- Assistance.

### Producteur

- Tableau de bord.
- Mes produits.
- Ajouter un produit.
- Modifier un produit.
- Mes offres.
- Devis reçus.
- Mes commandes.
- Livraisons.
- Messagerie.
- Rapports.
- Profil.
- Paramètres.
- Abonnement.

### Acheteur

- Tableau de bord.
- Catalogue.
- Filtres avancés.
- Demander un devis.
- Mes demandes.
- Mes devis.
- Commandes.
- Fournisseurs favoris.
- Livraisons.
- Messagerie.
- Rapports.
- Profil.

### Transporteur

- Tableau de bord.
- Demandes de transport.
- Mes devis.
- Missions attribuées.
- Livraisons.
- Historique.
- Profil.

### Administration

Tous les modules décrits dans la section super administrateur.

Prévoir aussi les états vides, chargements, erreurs, permissions refusées et absence de connexion.

## 23. MODÈLE DE DONNÉES

Concevoir les modèles et leurs relations avant le développement.

Entités principales :

- User.
- Organization.
- OrganizationMember.
- Role.
- Permission.
- OrganizationVerification.
- Address.
- AdministrativeArea.
- ProductCategory.
- Product.
- ProductVariant ou ProductSpecification.
- ProductImage.
- HarvestLot.
- ProductListing.
- InventoryReservation.
- BuyerRequest.
- RequestProposal.
- Quote.
- QuoteLine.
- Order.
- OrderLine.
- OrderStatusHistory.
- Delivery.
- DeliveryProof.
- TransportQuote.
- PaymentRecord.
- CommissionRule.
- CommissionRecord.
- SubscriptionPlan.
- OrganizationSubscription.
- Conversation.
- Message.
- Notification.
- SupportTicket.
- Dispute.
- AuditLog.
- PlatformSetting.

Définir les clés étrangères, contraintes, indexes, permissions et règles de suppression.

Éviter toute duplication inutile.

Prévoir des migrations versionnées et reproductibles.

## 24. PERFORMANCE

L'application doit rester fluide sur un téléphone Android peu puissant.

Prévoir :

- Images WebP ou AVIF selon compatibilité.
- Compression.
- Lazy loading.
- Pagination serveur.
- Recherche indexée.
- Optimisation des requêtes SQL.
- Prévention des problèmes N+1.
- Cache adapté.
- Chargement différé des modules.
- Bundle frontend réduit.
- Pas de bibliothèque lourde inutile.
- Pagination ou virtualisation des listes volumineuses.
- Tests en réseau lent.
- Tests sur téléphone réel.

Fixer et mesurer des objectifs de performance, notamment les Core Web Vitals.

## 25. TESTS OBLIGATOIRES

Mettre en place des tests automatiques.

### Backend

- Authentification.
- Permissions.
- Isolation des organisations.
- Inscription.
- Vérification.
- Produits.
- Quantités.
- Offres.
- Devis.
- Commandes.
- Réservations.
- Livraisons.
- Paiements enregistrés.
- Abonnements.
- Commissions.
- Audit.
- Sécurité.

### Frontend

- Formulaires.
- Validation.
- Navigation.
- États de chargement.
- Gestion des erreurs.
- Responsive.
- Accessibilité.
- Installation PWA.
- Fonctionnement hors ligne prévu.

### Tests de bout en bout

Scénario complet :

Un producteur crée son compte, publie une récolte, un acheteur envoie une demande de devis, le producteur répond, l'acheteur accepte, une commande est confirmée, une livraison est organisée et les deux parties valident la réception.

Ce scénario doit fonctionner de bout en bout.

Utiliser des données fictives uniquement dans l'environnement de développement ou de test.

## 26. PLAN DE RÉALISATION

Ne pas développer toutes les fonctionnalités en une seule modification massive.

Avancer par phases vérifiables.

### Phase 1 — Fondation

- Architecture.
- Docker.
- Base PostgreSQL.
- Authentification.
- Organisations.
- Permissions.
- Design system.
- Structure React.
- Responsive.
- CI.
- Tests initiaux.

### Phase 2 — Catalogue agricole

- Catégories.
- Produits.
- Annonces.
- Photos.
- Recherche.
- Filtres.
- Profils publics.

### Phase 3 — Commerce B2B

- Demandes d'achat.
- Devis.
- Négociation.
- Commandes.
- Historique.
- Documents.
- Réservation de quantités.

### Phase 4 — Administration

- Super admin.
- Vérifications.
- Modération.
- Support.
- Rapports.
- Paramétrages.

### Phase 5 — Installation PWA

- Manifest.
- Service worker.
- Installation.
- Offline contrôlé.
- Synchronisation.
- Optimisation mobile.

### Phase 6 — Monétisation et logistique

- Abonnements.
- Commissions.
- Paiements enregistrés.
- Demandes de transport.
- Suivi des livraisons.

Les modules avancés doivent être activés seulement après validation du circuit commercial principal.

### Phase 7 — Production

- Audit de sécurité.
- Tests complets.
- Performance.
- Sauvegarde/restauration.
- Documentation.
- Docker production.
- Déploiement Coolify.
- HTTPS.
- Monitoring.
- Vérifications post-déploiement.

## 27. MÉTHODE DE TRAVAIL EXIGÉE

À chaque phase :

1. Inspecter le projet et l'existant.
2. Définir les fichiers et modules à modifier.
3. Implémenter les fonctionnalités.
4. Ajouter les migrations.
5. Ajouter les tests.
6. Exécuter les vérifications.
7. Corriger les erreurs.
8. Contrôler le rendu mobile, tablette et desktop.
9. Vérifier la sécurité et les permissions.
10. Fournir un rapport de réalisation.

Ne pas supprimer des fonctionnalités existantes sans raison.

Ne pas remplacer les vraies API par de faux résultats présentés comme réels.

Ne pas inventer de validations, de tests réussis ou de déploiements.

Créer des commits clairs et structurés.

Documenter les commandes de démarrage local et de déploiement.

## 28. CONDITIONS DE VALIDATION FINALE

L'application est considérée prête pour un pilote uniquement lorsque :

- Les utilisateurs peuvent créer leur compte.
- Les organisations peuvent être vérifiées.
- Un producteur peut publier une annonce.
- Un acheteur peut rechercher un produit.
- Une demande de devis peut être envoyée.
- Un producteur peut répondre.
- Une commande peut être confirmée.
- Les quantités restent cohérentes.
- Les documents commerciaux sont générés correctement.
- Les droits des différentes organisations sont sécurisés.
- Le super administrateur dispose des outils de gestion.
- L'application fonctionne sur téléphone, tablette et ordinateur.
- L'installation PWA est validée sur les plateformes compatibles.
- Les tests critiques passent.
- Les sauvegardes et la restauration sont éprouvées.
- Le déploiement de production est documenté et contrôlé.

Ne pas confondre « prêt pour un pilote » avec « prêt pour un déploiement massif » : les fonctionnalités de paiement, les partenariats logistiques et les obligations réglementaires nécessitent des validations complémentaires.

## 29. LIVRABLES

Fournir :

- Code source complet.
- Architecture documentée.
- Modèles de données.
- Migrations.
- API documentée.
- Frontend complet.
- PWA installable.
- Docker Compose.
- Fichier .env.example.
- Tests automatisés.
- Documentation de développement.
- Guide utilisateur.
- Guide super administrateur.
- Procédure de sauvegarde/restauration.
- Procédure de déploiement Coolify.
- Liste des fonctions réalisées.
- Liste des fonctions restantes.
- Rapport de sécurité et de tests.

## 30. INSTRUCTION FINALE

Construis BTDIGIT AGRO comme un véritable produit commercial premium, destiné aux professionnels agricoles du Mali.

Le résultat doit être facile à comprendre pour un agriculteur, efficace pour un grossiste, fiable pour un acheteur et simple à administrer par BTDIGIT.

Privilégie la qualité, la stabilité, la sécurité et une excellente expérience mobile plutôt que la multiplication de fonctionnalités inachevées.

Commence par produire l'architecture technique, les maquettes des écrans essentiels, le schéma de base de données et le découpage des phases, puis implémente réellement la première phase avec son code et ses tests.

Continue phase par phase, sans remplacer le développement réel par de simples descriptions.

---

# ANNEXE V2 — EXIGENCES PRIORITAIRES DU 20 NOVEMBRE 2026

Cette annexe complète le prompt initial. En cas de différence dans le découpage des phases, la roadmap officielle docs/ROADMAP.md fait foi.

## Inscription : téléphone OU email au choix

Présenter deux chemins explicites dès l'écran d'inscription : « Avec mon téléphone » et « Avec mon email ». Le numéro est normalisé au format E.164 (+223 proposé au Mali) ; l'adresse email est normalisée. Vérifier le canal réellement choisi : OTP SMS avec prestataire réel ou vérification par email avec SMTP réellement configuré. Un simulateur n'est permis qu'en test. Un canal non disponible ne doit pas prétendre fonctionner. Gérer doublons, tentatives abusives, récupération, confidentialité, profils et organisations. Autoriser plus tard un second canal vérifié.

## Recherche instantanée PostgreSQL : priorité absolue

Utiliser PostgreSQL comme moteur de référence : index B-tree, extension pg_trgm avec GIN selon les besoins, classement exact/prefixe puis similarité, pagination côté serveur, recherche tolérante aux accents/casse et fautes raisonnables. Frontend : debounce environ 200–300 ms, annulation des demandes précédentes, suggestions, filtres cumulables, URL partageable, bottom sheet sur mobile. Filtres : nom, variété, catégorie, région/cercle/commune, prix, quantité, unité, grade, disponibilité, livraison et fournisseur vérifié. Mesurer EXPLAIN ANALYZE et p95 avec un jeu de milliers d'annonces ; ne pas charger tout le catalogue en navigateur.

## Design inspiré des références du demandeur

Tableau de bord desktop à sidebar fixe et cartes de production/indicateurs réels, application acheteur mobile à recherche et navigation basse, page vitrine à hero photo, catégories et annonces, palette agricole officielle. Ne pas copier les marques ni l'interface de services tiers. Photos légalement utilisables ; aucun chiffre de production inventé.

## PostgreSQL créé par commandes lors de la phase 0

Sous Windows PowerShell : cloner le dépôt, copier .env.example en .env et modifier le mot de passe, docker compose config, docker compose up -d db, docker compose ps, puis vérifier avec psql SELECT current_database(), current_user(). PostgreSQL crée la base définie via POSTGRES_DB au premier démarrage d'un volume vide. Ne pas confondre dépôt initialisé et base effectivement démarrée sur le PC.

## GitHub et synchronisation locale : séquence stricte

1. Finir les prérequis et vérifier PostgreSQL sur le PC.
2. Créer la branche correspondant à la phase actuelle.
3. Développer le code réel, migrations et tests.
4. Publier les changements sur GitHub via une Pull Request.
5. Valider les critères de sortie ; fusionner avec main seulement après validation.
6. Sur le PC : git switch main ; git pull --ff-only origin main ; reconstruire/redémarrer les conteneurs concernés ; lancer migrations si nécessaires.
7. Vérifier localement, cocher les cases effectivement prouvées puis seulement passer à la phase suivante.

Jamais de saut de phase. La création du dépôt et des documents ne constitue pas à elle seule la réussite d'une phase. À chaque livraison fournir les commandes PowerShell, les commits/PR, les tests réellement exécutés, les points bloquants et le statut de la roadmap.

## Documents de contrôle obligatoires

- AGENTS.md
- docs/ROADMAP.md
- docs/INSTALLATION_WINDOWS.md
- docs/ARCHITECTURE.md
- docs/AUTH_RECHERCHE.md
- docs/PROMPT_CODEX.md

**Instruction finale à Codex :** réalise uniquement la prochaine tâche non validée de la phase active. Ne crée aucune fonction d'étape suivante et ne déclare aucun résultat sans preuve.
