import { useEffect, useMemo, useState } from "react";
import WorkspacePreview from "./WorkspacePreview";
import AuthPage from "./AuthPage";
import RecoveryPage from "./RecoveryPage";
import OrganizationPage from "./OrganizationPage";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  CloudOff,
  Globe2,
  Home,
  Leaf,
  MapPin,
  Menu,
  Moon,
  Package,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
  Tractor,
  Truck,
  Users,
  Wheat,
  X,
} from "lucide-react";

type Health = "loading" | "online" | "offline";
type Theme = "light" | "dark";
type Category = { name: string; detail: string; icon: LucideIcon; accent: string };

const categories: Category[] = [
  { name: "Céréales", detail: "Riz, mil, maïs, sorgho", icon: Wheat, accent: "gold" },
  { name: "Légumes", detail: "Oignons, tomates, pommes de terre", icon: Sprout, accent: "green" },
  { name: "Fruits", detail: "Mangues, bananes, agrumes", icon: Leaf, accent: "orange" },
  { name: "Légumineuses", detail: "Arachides, niébé", icon: Package, accent: "sand" },
  { name: "Oléagineux", detail: "Sésame et autres cultures", icon: Tractor, accent: "olive" },
  { name: "Autres productions", detail: "À découvrir prochainement", icon: Globe2, accent: "mint" },
];

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();

const links = [
  { name: "Accueil", href: "#accueil" },
  { name: "Catégories", href: "#categories" },
  { name: "Avantages", href: "#avantages" },
  { name: "Fonctionnement", href: "#fonctionnement" },
];

function FarmIllustration() {
  return (
    <svg className="farm-art" viewBox="0 0 640 520" role="img" aria-label="Illustration originale des cultures agricoles et du soleil au Mali" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C6E7CC" />
          <stop offset="55%" stopColor="#E4E9CE" />
          <stop offset="100%" stopColor="#FFE4A0" />
        </linearGradient>
        <linearGradient id="field" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#4E9555" />
          <stop offset="100%" stopColor="#155E3E" />
        </linearGradient>
        <linearGradient id="near" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#D7AC4B" />
          <stop offset="100%" stopColor="#8F9A45" />
        </linearGradient>
        <clipPath id="farm-clip"><rect width="640" height="520" rx="30"/></clipPath>
      </defs>
      <g clipPath="url(#farm-clip)">
        <rect width="640" height="520" fill="url(#sky)" />
        <circle cx="462" cy="132" r="65" fill="#F6CF76" opacity=".3" />
        <circle cx="462" cy="132" r="46" fill="#E8AE48" />
        <path d="M0 270Q132 198 279 253Q442 182 640 252V520H0Z" fill="#7DAB72" />
        <path d="M0 318Q173 265 311 309Q474 251 640 314V520H0Z" fill="#4B8765" />
        <path d="M0 374Q235 313 640 357V520H0Z" fill="url(#field)" />
        <path d="M337 358L640 339V520H590Z" fill="url(#near)" />
        <path d="M0 416Q162 363 346 360L272 520H0Z" fill="#22694C" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${22 + i * 42} 520Q${135 + i * 20} 425 335 360`} stroke="#B6D8A0" strokeWidth="3" opacity=".55" fill="none" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${365 + i * 39} 520Q${365 + i * 16} 440 340 359`} stroke="#F5D17A" strokeWidth="3" opacity=".7" fill="none" />
        ))}
        <path d="M110 278L143 231L184 279Z" fill="#945B3D" />
        <rect x="120" y="278" width="53" height="39" rx="2" fill="#E5BA77" />
        <rect x="142" y="288" width="15" height="29" rx="1" fill="#835D37" />
        <path d="M212 288L241 252L274 288Z" fill="#855D3C" />
        <rect x="220" y="288" width="46" height="30" fill="#F3CD90" />
        <path d="M57 333V263M40 288Q58 264 76 288M40 304Q57 280 76 304" stroke="#155C3C" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M575 314V237M556 264Q573 237 594 262M557 288Q576 263 597 287" stroke="#276D45" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M305 277Q314 250 324 277M319 286Q333 255 341 286" stroke="#D9AE57" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M20 156Q65 130 100 158" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" opacity=".7"/>
        <path d="M122 96Q150 82 173 97" fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity=".65"/>
      </g>
    </svg>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <a href="#accueil" className={`brand ${small ? "brand-small" : ""}`} aria-label="BTDIGIT AGRO, revenir à l'accueil">
      <span className="brand-mark"><Sprout size={23} strokeWidth={2.3} /></span>
      <span className="brand-text"><strong>BTDIGIT <span>AGRO</span></strong><small>L'agriculture connectée</small></span>
    </a>
  );
}

function PublicLanding() {
  const [theme, setTheme] = useState<Theme>("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [health, setHealth] = useState<Health>("loading");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/health/", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Réponse HTTP incorrecte");
        return response.json() as Promise<{ status?: string; database?: string; service?: string }>;
      })
      .then((data) => {
        setHealth(data.status === "ok" && data.database === "ok" && data.service === "btdigit-agro-api" ? "online" : "offline");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setHealth("offline");
      });
    return () => controller.abort();
  }, []);

  const visibleCategories = useMemo(() => {
    const term = normalize(searchTerm);
    return categories.filter((category) => normalize(category.name + " " + category.detail).includes(term));
  }, [searchTerm]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell" id="accueil">
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <div className="top-strip"><span>🌿 &nbsp;Une initiative BTDIGIT, pensée pour les professionnels agricoles du Mali</span><span className="top-strip-right">Mali <span aria-hidden="true">•</span> Français</span></div>
      <header className="site-header">
        <div className="header-inner content-width">
          <Brand />
          <nav className="desktop-nav" aria-label="Navigation principale">
            {links.map((link) => <a key={link.href} href={link.href}>{link.name}</a>)}
          </nav>
          <div className="header-actions">
            <button className="icon-button theme-button" aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <a className="header-login" href="/connexion">Se connecter</a>
            <a className="button button-primary header-join" href="/inscription">Rejoindre AGRO <ArrowRight size={16}/></a>
            <button className="icon-button menu-toggle" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={23}/> : <Menu size={23}/>}
            </button>
          </div>
        </div>
        {menuOpen && <nav className="mobile-menu" aria-label="Navigation mobile">{links.map((link) => <a key={link.href} href={link.href} onClick={closeMenu}>{link.name}<ChevronRight size={17}/></a>)}<a href="/connexion" onClick={closeMenu}>Se connecter <ArrowRight size={16}/></a></nav>}
      </header>

      <main id="contenu">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-glow hero-glow-1" aria-hidden="true"/>
          <div className="hero-glow hero-glow-2" aria-hidden="true"/>
          <div className="content-width hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker"><span className="kicker-dot"/><span>La future place de marché agricole du Mali</span></div>
              <h1 id="hero-title">Du champ au marché, <span>créons de nouvelles opportunités.</span></h1>
              <p className="hero-description">Une plateforme professionnelle pour rapprocher les producteurs, les coopératives et les acheteurs. Des échanges plus simples, des relations plus directes et un marché plus connecté.</p>
              <div className="hero-buttons">
                <a href="#categories" className="button button-gold">Explorer les filières <ArrowRight size={19}/></a>
                <a href="#fonctionnement" className="button button-glass">Comment ça marche <ArrowDownRight size={18}/></a>
              </div>
              <div className="hero-reassurance"><span><Check size={15}/> Pensé pour le Mali</span><span><Check size={15}/> Professionnels agricoles</span></div>
            </div>
            <div className="hero-visual">
              <div className="art-frame"><FarmIllustration/></div>
              <div className="floating-card floating-card-top"><span className="floating-icon"><Wheat size={21}/></span><span><strong>Valoriser les récoltes</strong><small>Des producteurs aux acheteurs</small></span></div>
              <div className="floating-card floating-card-bottom"><span className="check-round"><Check size={17}/></span><span><strong>Des échanges plus simples</strong><small>Une plateforme, plusieurs métiers</small></span></div>
              <div className="decoration-orbit" aria-hidden="true"/>
            </div>
          </div>
        </section>

        <section className="search-overlap content-width" aria-label="Recherche des catégories">
          <div className="search-panel">
            <div className="search-panel-title"><span className="search-panel-icon"><Search size={23}/></span><div><strong>Qu'est-ce qui vous intéresse ?</strong><small>Explorez les filières agricoles qui seront proposées sur la plateforme.</small></div></div>
            <label className="search-field"><Search size={21} aria-hidden="true"/><span className="sr-only">Rechercher une catégorie ou une culture</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Riz, mangue, oignon, céréales..." type="search" autoComplete="off"/></label>
            <a className="search-panel-action" href="#categories">Voir les catégories <ArrowRight size={17}/></a>
          </div>
        </section>

        <section className="section categories-section content-width" id="categories" aria-labelledby="categories-title">
          <div className="section-header">
            <div><span className="eyebrow"><Leaf size={15}/> DES TERRES AUX OPPORTUNITÉS</span><h2 id="categories-title">Les filières agricoles à découvrir</h2><p>Un premier aperçu des catégories prévues pour le catalogue BTDIGIT AGRO.</p></div>
            <span className="soft-tag">{visibleCategories.length} catégorie{visibleCategories.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="category-grid">
            {visibleCategories.map((category) => {
              const Icon = category.icon;
              return <button key={category.name} className={`category-card category-${category.accent} ${activeCategory === category.name ? "category-selected" : ""}`} onClick={() => setActiveCategory(category.name)} aria-pressed={activeCategory === category.name}>
                <span className="category-icon"><Icon size={28} strokeWidth={1.75}/></span><span className="category-name">{category.name}</span><span className="category-detail">{category.detail}</span><ArrowRight className="category-arrow" size={18} aria-hidden="true"/>
              </button>;
            })}
          </div>
          {visibleCategories.length === 0 && <div className="empty-state"><Search size={24}/><strong>Aucune catégorie correspondante</strong><span>Essayez un autre mot-clé.</span><button onClick={() => setSearchTerm("")} className="text-button">Effacer la recherche</button></div>}
          {activeCategory && <div className="selected-message" role="status"><Check size={18}/><span><strong>{activeCategory}</strong> sélectionnée. Les annonces et fournisseurs seront consultables dès l'ouverture du catalogue.</span><button aria-label="Effacer la catégorie sélectionnée" onClick={() => setActiveCategory("")}><X size={17}/></button></div>}
        </section>

        <section className="section benefits-section" id="avantages" aria-labelledby="benefits-title">
          <div className="content-width">
            <div className="section-header"><div><span className="eyebrow"><Globe2 size={16}/> UNE PLATEFORME, PLUSIEURS ACTEURS</span><h2 id="benefits-title">Le bon partenaire pour chaque activité</h2><p>Des parcours pensés pour la réalité des échanges agricoles.</p></div></div>
            <div className="benefits-grid">
              <article className="benefit-card"><div className="benefit-icon"><Tractor size={26}/></div><span className="benefit-number">01 / PRODUIRE</span><h3>Producteurs & coopératives</h3><p>Présenter les récoltes, préciser les quantités et recevoir des demandes de professionnels intéressés.</p><span className="benefit-bottom">Valoriser sa production <ArrowRight size={18}/></span></article>
              <article className="benefit-card"><div className="benefit-icon"><Building2 size={26}/></div><span className="benefit-number">02 / ACHETER</span><h3>Acheteurs professionnels</h3><p>Trouver de nouveaux fournisseurs, comparer les offres et demander des devis adaptés aux volumes recherchés.</p><span className="benefit-bottom">Simplifier l'approvisionnement <ArrowRight size={18}/></span></article>
              <article className="benefit-card"><div className="benefit-icon"><Truck size={26}/></div><span className="benefit-number">03 / LIVRER</span><h3>Transporteurs & partenaires</h3><p>Accompagner les échanges avec des solutions de transport et un meilleur suivi des livraisons.</p><span className="benefit-bottom">Faciliter les échanges <ArrowRight size={18}/></span></article>
            </div>
          </div>
        </section>

        <section className="section how-section content-width" id="fonctionnement" aria-labelledby="how-title">
          <div className="how-illustration"><div className="how-illustration-inner"><div className="how-symbol how-symbol-a"><Wheat size={33}/></div><div className="how-connecting-line"/><div className="how-symbol how-symbol-b"><ClipboardList size={34}/></div><div className="how-connecting-line"/><div className="how-symbol how-symbol-c"><Truck size={35}/></div></div><span>Une chaîne de valeur plus connectée</span></div>
          <div className="how-copy"><span className="eyebrow"><BookOpen size={16}/> SIMPLE À CHAQUE ÉTAPE</span><h2 id="how-title">Des échanges agricoles, sans complications.</h2><p className="how-lead">Le futur parcours BTDIGIT AGRO est conçu pour aller à l'essentiel.</p><div className="step-list">
            <div className="step-item"><span>01</span><div><strong>Rechercher</strong><p>Découvrir les filières, les produits et les fournisseurs.</p></div></div>
            <div className="step-item"><span>02</span><div><strong>Échanger</strong><p>Envoyer une demande de devis et préciser ses besoins.</p></div></div>
            <div className="step-item"><span>03</span><div><strong>Concrétiser</strong><p>Confirmer une commande et organiser sa livraison.</p></div></div>
          </div></div>
        </section>

        <section className="status-section" id="etat" aria-labelledby="status-title">
          <div className="content-width status-content">
            <div className="status-copy"><span className="eyebrow"><ShieldCheck size={17}/> PROJET EN CONSTRUCTION</span><h2 id="status-title">Une plateforme construite étape par étape.</h2><p>L'application est en cours de développement. L'inscription, les annonces et les transactions seront activées progressivement après vérification.</p><div className="status-live" role="status"><span className={`health-dot health-${health}`}/>{health === "online" ? "API Django et PostgreSQL connectés" : health === "loading" ? "Vérification de l'API en cours…" : "API indisponible ou non joignable"}<span className="status-subtle">État réel de l'environnement local</span></div><a className="workspace-preview-link" href="/apercu">Voir l'aperçu de l'espace <ArrowRight size={17}/></a></div>
            <div className="status-panel"><div className="status-panel-header"><div className="status-mini-logo"><Sprout size={23}/></div><div><strong>BTDIGIT AGRO</strong><small>Fondation technique</small></div><span className="status-chip">Phase 1</span></div><div className="status-row"><ShieldCheck size={20}/><span>Architecture Django & PostgreSQL</span><Check size={17}/></div><div className="status-row status-pending"><Users size={20}/><span>Inscriptions et organisations</span><span>À venir</span></div><div className="status-row status-pending"><BarChart3 size={20}/><span>Catalogue et recherche intelligente</span><span>À venir</span></div><div className="status-panel-footer"><span>Pas de données commerciales fictives.</span><span>🇲🇱 Mali</span></div></div>
          </div>
        </section>
      </main>

      <footer className="site-footer"><div className="content-width footer-inner"><div><Brand small/><p>Une initiative numérique BTDIGIT, pour rapprocher les professionnels agricoles du Mali.</p></div><div className="footer-links"><a href="#categories">Catégories</a><a href="#fonctionnement">Fonctionnement</a><a href="#etat">État du projet</a></div><div className="footer-bottom"><span>© 2026 BTDIGIT AGRO. Tous droits réservés.</span><span>Conçu avec soin au Mali <MapPin size={14}/></span></div></div></footer>

      <nav className="mobile-bottom-nav" aria-label="Navigation rapide"><a href="#accueil"><Home size={21}/><span>Accueil</span></a><a href="#categories"><Wheat size={21}/><span>Filières</span></a><a href="#fonctionnement"><BookOpen size={21}/><span>Découvrir</span></a><a href="/connexion"><Users size={21}/><span>Compte</span></a></nav>

      <span className="sr-only">{health === "offline" ? <CloudOff size={1}/> : <BadgeCheck size={1}/>}</span>
    </div>
  );
}

/** Deux pages de fondation en phase 1 ; routage métier ultérieur. */
export default function App() {
  const path = window.location.pathname;
  if (path === "/apercu") return <WorkspacePreview />;
  if (["/inscription", "/connexion"].includes(path)) return <AuthPage />;
  if (["/recuperation", "/verification"].includes(path)) return <RecoveryPage />;
  if (["/espace", "/superadmin"].includes(path)) return <OrganizationPage />;
  return <PublicLanding />;
}
