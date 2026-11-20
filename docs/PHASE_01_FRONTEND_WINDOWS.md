# Phase 1.2 — BTDIGIT AGRO : interface React premium

**État : frontend sur la branche `feature/phase-01-socle`.** Aucun résultat Windows n'est présumé avant les tests réels de l'utilisateur. La Pull Request #3 reste en brouillon.

## Objectif visuel
Créer un socle de site vitrine premium mobile-first avec vert forêt `#145C3B`, vert agricole `#78A344`, or récolte `#D5A335`, ivoire `#F7F5EC`, vert nuit `#24392D`. Les références visuelles sont une page d'accueil de marketplace agricole, un dashboard professionnel et une application mobile avec navigation inférieure.

**Ne pas inventer de produits, de prix, de commandes ou de statistiques réelles.** Cette étape affiche des catégories de référence, une illustration agricole originale, une interface responsive et l'état réel de l'API Django. La connexion et les ventes seront implémentées dans les phases ultérieures.

## Récupérer les fichiers sans écraser les secrets
Depuis PowerShell à la racine du projet :

~~~powershell
git status --short
git switch feature/phase-01-socle
git pull --ff-only origin feature/phase-01-socle
~~~

La branche étant déjà présente, ne pas répéter `git switch --track` (cela échouerait normalement).

## Démarrer la nouvelle interface avec Docker

~~~powershell
docker compose config --quiet
docker compose build web
docker compose up -d --force-recreate api
docker compose up -d web
docker compose ps
~~~

Ouvrir **http://127.0.0.1:15173/** pour le site vitrine, puis **http://127.0.0.1:15173/apercu** pour la prévisualisation de l'espace professionnel (sidebar fixe sur ordinateur, navigation inférieure mobile). Le backend doit toujours être accessible sur **http://127.0.0.1:18080/api/v1/health/**. Le frontend appelle `/api/v1/health/` via le proxy Vite vers le service Docker `api:8000`. La configuration Docker ajoute le nom `api` aux hôtes Django autorisés **en développement uniquement**. Les ports 8000 de SUGU KURA, 8020/8021 de StockPro et 55432 de PostgreSQL ne sont pas modifiés.

Si le port 15173 est occupé, définir `AGRO_WEB_PORT=15174` dans le `.env` non suivi par Git et recréer **seulement** le service web avec `docker compose up -d --no-deps --force-recreate web`. Adapter l'URL en conséquence.

## Vérifier le frontend en local

~~~powershell
docker compose exec web npm run build
docker compose exec web npm test
curl.exe http://127.0.0.1:15173/api/v1/health/
docker compose logs --tail=60 web
~~~

Tester également manuellement :
1. Ouvrir sur PC et inspecter le menu, les catégories, l'état backend.
2. Utiliser le mode téléphone et tablette dans les outils développeur ; vérifier l'absence de scroll horizontal.
3. Vérifier l'activation du mode sombre puis du mode clair.
4. Taper `tomates` : seule la catégorie `Légumes` doit rester affichée.
5. Cliquer `Se connecter` : afficher explicitement le message « disponible à la phase 2 ».
6. Tester le menu mobile et la navigation inférieure sur la vitrine.
7. Ouvrir `/apercu` : vérifier la sidebar desktop, le menu mobile et l'alternance Producteur / Acheteur ; toutes les métriques doivent indiquer « À venir », sans chiffres fictifs.
8. **Hamburger desktop :** en haut du tableau de bord, cliquer sur le bouton. Le menu gauche doit se replier en colonne d'icônes, puis se déployer à nouveau au second clic ; le contenu prend automatiquement la largeur libérée.
9. **Défilement indépendant :** avec la souris sur la sidebar, faire défiler le menu sans déplacer le contenu principal ; avec la souris sur le contenu, défiler la page sans déplacer la sidebar ni le header fixe. Les deux scrollbars sont masquées visuellement sans bloquer le défilement.
10. **Tablette/mobile :** le hamburger ouvre un tiroir latéral au-dessus du contenu, avec fond assombri ; cliquer en dehors ou fermer le tiroir rétablit le contenu. L'arrière-plan ne doit pas défiler tant que le tiroir est ouvert. Tester le passage de la taille desktop à mobile.
11. Couper temporairement **uniquement** l'API (si souhaité) : l'interface doit afficher un état d'indisponibilité, sans faux succès.

## Limitations délibérées
- Recherche de produits en temps réel et filtres PostgreSQL : **phase 3**. Le champ de recherche actuel filtre les noms de catégories locales et ne prétend pas chercher des offres B2B réelles.
- Authentification SMS/email et organisations : **phase 2**.
- L'écran `/apercu` est un **prototype d'interface**, pas une session utilisateur authentifiée : aucun indicateur commercial n'est opérationnel.
- Tableaux de bord connectés, commandes, paiements et PWA installable : phases prévues dans la roadmap.
- Le serveur Vite de développement ne constitue pas un déploiement de production.

## Avant de fusionner
Les tests GitHub Actions backend + frontend doivent être verts, puis les commandes Docker/React et le rendu responsive doivent être vérifiés sur Windows. Fournir les sorties et des captures du rendu, sans fichiers `.env` ni secrets. Le ticket #2 et la PR #3 restent ouverts jusqu'à validation de toute la phase 1.
