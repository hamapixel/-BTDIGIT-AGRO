# Architecture cible et UX — BTDIGIT AGRO

Document de conception : l'architecture complète n'est pas encore implémentée.

## 1. Monorepo cible
- backend/ : Django, DRF, applications accounts, organizations, catalog, trade, logistics, payments, support, audit.
- frontend/ : React/TypeScript/Vite, composants UI, routes, pages publiques et espaces métiers.
- docs/ : roadmap, installation, API, guides d'exploitation et décisions d'architecture.
- compose.yaml : services de développement (PostgreSQL à la phase 0, autres services uniquement à partir des phases validées).
- .github/workflows/ : CI à créer à la phase 1.

## 2. Identité visuelle issue des références
Palette : vert forêt #145C3B, vert agricole #78A344, or récolte #D5A335, ivoire #F7F5EC, vert nuit #24392D. Typographie lisible Inter ou Manrope, icônes cohérentes, photos agricoles autorisées, animations sobres, mode sombre complet et contrastes accessibles.

### Site vitrine
Grand hero agricole, recherche bien visible, accès catégories, annonces récoltes et fournisseurs, étapes « rechercher → comparer → demander un devis », CTA producteur et acheteur, footer complet. Pas de copie de marque ou d'interface tierce.

### Mobile
Header compact, recherche prioritaire, cartes récoltes en grille/listes, filtres en bottom sheet, navigation basse (max. 5 entrées selon le rôle), zones tactiles larges, safe-area iPhone et aucun contenu caché par les barres fixes.

### Desktop
Sidebar fixe avec modules du rôle, topbar sticky, tableau de bord avec cartes KPI réelles, graphiques, listes de demandes, tableaux filtrables. Pas de sidebar qui glisse avec le scroll.

### Tablette
Sidebar rétractable, grilles adaptatives, usage portrait et paysage, support tactile.

## 3. Domaines métier et données
- Identité : User(UUID), AuthenticationChallenge, Session, Organization, OrganizationMember, Role, OrganizationVerification.
- Référentiels : AdministrativeArea, ProductCategory, Unit, Product, ProductVariant.
- Catalogue : HarvestLot, ProductImage, ProductListing, Availability.
- Relation commerciale : BuyerRequest, Proposal, Quote, QuoteLine, Order, OrderLine, OrderStatusHistory, InventoryReservation.
- Logistique : Delivery, DeliveryProof, TransportQuote, Dispute.
- Collaboration : Conversation, Message, Notification, SupportTicket.
- Finances : PaymentRecord, SubscriptionPlan, CommissionRule, CommissionRecord.
- Contrôle : AuditLog, PlatformSetting.

L'identité organisationnelle est portée par les enregistrements métier. Les interactions partagées ne donnent accès qu'aux objets nécessaires à la transaction. Les clés UUID empêchent de confondre les utilisateurs, mais ne remplacent jamais l'autorisation côté API.

## 4. Sécurité et cohérence
- Django ORM et SQL paramétré ; isolation multi-organisation vérifiée dans les queryset et services.
- Transactions atomiques avec verrouillage des quantités/réservations, opérations sensibles idempotentes.
- Prix stockés en valeurs exactes (FCFA entiers) ; quantités avec Decimal/Numeric.
- Fichiers privés protégés, contrôle des types/taille, documents commerciaux avec copies figées des conditions.
- HTTPS, CSRF, XSS, CORS strict, entêtes de sécurité, gestion des secrets hors code et MFA admin selon risques.
- Audit des actions sensibles et sauvegarde/restauration testée avant lancement.

## 5. API, stockage, déploiement
- API /api/v1/ documentée en OpenAPI.
- PostgreSQL comme source de vérité. Redis et Celery seulement lorsque nécessaires, puis testés.
- Docker Compose local, CI GitHub, déploiement futur Coolify/Traefik sur VPS, HTTPS et stockage persistant.
- Migration versionnée par phase ; jamais de modification manuelle non documentée sur la base de production.
- PWA : cache des ressources et brouillons publics/autorisés, mais pas de validation hors ligne de vente, stock ou paiement.

## 6. Mesure de qualité
Performance de recherche p50/p95, absence d'accès inter-organisation, tests e2e du parcours complet, accessibilité WCAG AA, appareils Android modestes, bas débit et tests de reprise après coupure réseau.
