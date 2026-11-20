import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, Bell, BookOpen, Check,
  ClipboardList, Home, LayoutDashboard, Leaf, Menu, Moon, Package,
  Search, Settings, ShieldCheck, Sprout, Sun, Truck, Users, Wheat, X,
} from "lucide-react";

const menu = [
  { title: "Vue d'ensemble", icon: LayoutDashboard, id: "overview" },
  { title: "Mes produits", icon: Wheat, id: "catalog" },
  { title: "Demandes & devis", icon: ClipboardList, id: "quotes" },
  { title: "Livraisons", icon: Truck, id: "deliveries" },
  { title: "Rapports", icon: BarChart3, id: "reports" },
];
const modules = [
  { title: "Gestion des récoltes", description: "Publier ses productions et leurs quantités disponibles.", icon: Leaf, tag: "Phase 3" },
  { title: "Demandes de devis", description: "Échanger avec des acheteurs professionnels.", icon: ClipboardList, tag: "Phase 4" },
  { title: "Suivi des livraisons", description: "Retrouver les étapes de transport.", icon: Truck, tag: "Phase 5" },
  { title: "Tableaux de bord", description: "Consulter ses performances sur des données réelles.", icon: BarChart3, tag: "Phase 6" },
];

export default function WorkspacePreview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 900px)").matches
      : false,
  );
  const [profile, setProfile] = useState<"producteur" | "acheteur">("producteur");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 900px)");
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
      setSidebarOpen(false);
    };
    setIsMobileViewport(media.matches);
    media.addEventListener("change", onBreakpointChange);
    return () => media.removeEventListener("change", onBreakpointChange);
  }, []);

  const toggleSidebar = () => {
    if (isMobileViewport) {
      setSidebarOpen((opened) => !opened);
    } else {
      setSidebarCollapsed((collapsed) => !collapsed);
    }
  };

  const sidebarExpanded = isMobileViewport ? sidebarOpen : !sidebarCollapsed;
  const menuButtonLabel = isMobileViewport
    ? sidebarOpen ? "Fermer le menu latéral" : "Ouvrir le menu latéral"
    : sidebarCollapsed ? "Déployer le menu latéral" : "Réduire le menu latéral";

  const profileLabel = profile === "producteur" ? "Producteur" : "Acheteur professionnel";

  return (
    <div className={`workspace ${sidebarCollapsed ? "workspace-is-collapsed" : ""} ${sidebarOpen ? "workspace-mobile-menu-open" : ""}`}>
      <a className="skip-link" href="#workspace-content">Aller au contenu</a>
      <aside id="workspace-sidebar" className={`workspace-sidebar ${sidebarOpen ? "sidebar-is-open" : ""}`} aria-label="Menu latéral" inert={isMobileViewport && !sidebarOpen}>
        <div className="workspace-brand"><a href="/" aria-label="Revenir au site BTDIGIT AGRO"><span className="workspace-mark"><Sprout size={22}/></span><strong>BTDIGIT <span>AGRO</span></strong></a><button className="workspace-sidebar-close" aria-label="Fermer la navigation" onClick={() => setSidebarOpen(false)}><X size={19}/></button></div>
        <div className="workspace-flag">APERÇU NON CONNECTÉ <span>Phase 1</span></div>
        <nav className="workspace-nav" aria-label="Navigation de l'espace professionnel">
          <span className="workspace-nav-heading">ESPACE PROFESSIONNEL</span>
          {menu.map((item, i) => {const Icon = item.icon;return <a key={item.id} href={i === 0 ? "#workspace-content" : "#workspace-modules"} className={i === 0 ? "workspace-nav-active" : ""} title={item.title} aria-label={item.title} onClick={() => setSidebarOpen(false)}><Icon size={19}/><span>{item.title}</span>{i !== 0 && <span className="workspace-soon">Bientôt</span>}</a>;})}
          <span className="workspace-nav-heading workspace-secondary-heading">AIDE & PARAMÈTRES</span>
          <a href="/" className="workspace-nav-secondary" title="Site public" aria-label="Site public"><Home size={19}/><span>Site public</span></a>
          <a href="#workspace-modules" className="workspace-nav-secondary" title="À propos du projet" aria-label="À propos du projet" onClick={() => setSidebarOpen(false)}><Settings size={19}/><span>À propos du projet</span></a>
        </nav>
        <div className="workspace-sidebar-foot"><span className="workspace-sidebar-foot-icon"><ShieldCheck size={19}/></span><strong>Plateforme en construction</strong><p>Les vraies données et permissions seront ajoutées progressivement.</p></div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)}/>}
      <div className="workspace-main">
        <header className="workspace-header"><div className="workspace-header-title"><button type="button" className="workspace-menu-button" aria-controls="workspace-sidebar" aria-expanded={sidebarExpanded} aria-label={menuButtonLabel} title={menuButtonLabel} onClick={toggleSidebar}><Menu size={23}/></button><div><span className="workspace-crumb">BTDIGIT AGRO / Espace professionnel</span><strong>Tableau de bord <span className="workspace-preview-label">APERÇU</span></strong></div></div><div className="workspace-header-actions"><button className="workspace-icon-button" aria-label={theme === "light" ? "Passer en mode sombre" : "Passer en mode clair"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={19}/> : <Sun size={19}/>}</button><span className="workspace-icon-button workspace-notif-icon" aria-label="Notifications indisponibles, phase ultérieure"><Bell size={19}/></span><span className="workspace-user-avatar" aria-label="Aperçu du profil">BA</span></div></header>

        <main id="workspace-content" className="workspace-content">
          <div className="workspace-intro"><div><span className="eyebrow"><Sprout size={15}/> UN ESPACE AGRICOLE MODERNE</span><h1>Bienvenue dans votre futur espace 👋</h1><p>Un aperçu de l'interface que les professionnels retrouveront sur BTDIGIT AGRO.</p></div><a className="workspace-return" href="/"><ArrowLeft size={16}/> Retour au site</a></div>
          <div className="workspace-role-panel"><div><strong>Prévisualiser un profil</strong><span>Illustration seulement, aucune connexion active</span></div><div className="workspace-role-switch" role="group" aria-label="Profil à prévisualiser"><button aria-pressed={profile === "producteur"} className={profile === "producteur" ? "active" : ""} onClick={() => setProfile("producteur")}>Producteur</button><button aria-pressed={profile === "acheteur"} className={profile === "acheteur" ? "active" : ""} onClick={() => setProfile("acheteur")}>Acheteur</button></div></div>

          <div className="workspace-banner"><div><span className="workspace-banner-tag"><Check size={14}/> Interface de fondation</span><h2>Une meilleure visibilité sur votre activité agricole.</h2><p>Votre futur espace {profileLabel.toLowerCase()} réunira les fonctionnalités utiles au quotidien, une fois développées et vérifiées.</p><a href="#workspace-modules">Découvrir les modules <ArrowRight size={17}/></a></div><div className="workspace-banner-art" aria-hidden="true"><span className="workspace-banner-circle circle-1"/><span className="workspace-banner-circle circle-2"/><Wheat size={123} strokeWidth={1}/></div></div>

          <div className="workspace-section-title"><div><h2>Les modules de votre espace</h2><p>Les indicateurs seront calculés à partir de vraies données, jamais simulées.</p></div><span className="workspace-stage">Phase 1 / Fondation</span></div>
          <div className="workspace-metrics" aria-label="État des modules de données"><div><span><Package size={20}/></span><small>{profile === "producteur" ? "Mes récoltes" : "Mes approvisionnements"}</small><strong>À venir</strong><em>Catalogue — Phase 3</em></div><div><span><ClipboardList size={20}/></span><small>Mes devis</small><strong>À venir</strong><em>Commerce — Phase 4</em></div><div><span><Truck size={20}/></span><small>Livraisons</small><strong>À venir</strong><em>Logistique — Phase 5</em></div><div><span><BarChart3 size={20}/></span><small>Rapports</small><strong>À venir</strong><em>Statistiques — Phase 6</em></div></div>
          <div className="workspace-lower" id="workspace-modules"><section className="workspace-module-section"><div className="workspace-card-heading"><div><h2>Fonctionnalités prévues</h2><p>Une progression claire, étape par étape.</p></div><span><BookOpen size={19}/></span></div><div className="workspace-module-list">{modules.map((module) => {const Icon=module.icon;return <div className="workspace-module" key={module.title}><span className="workspace-module-icon"><Icon size={21}/></span><div><strong>{module.title}</strong><small>{module.description}</small></div><span className="workspace-module-tag">{module.tag}</span></div>;})}</div></section><section className="workspace-side-info"><div className="workspace-card-heading"><div><h2>Pourquoi cette plateforme ?</h2><p>Un service adapté aux entreprises du Mali.</p></div><Users size={22}/></div><div className="workspace-info-image"><span><Sprout size={40}/></span><strong>Du champ au marché</strong></div><p>BTDIGIT AGRO vise à simplifier la mise en relation entre producteurs, coopératives, acheteurs professionnels et transporteurs.</p><div className="workspace-info-foot"><Search size={18}/><span>La recherche instantanée PostgreSQL sera intégrée à la phase 3.</span></div></section></div>
          <div className="workspace-footnote"><span>BTDIGIT AGRO — Aperçu d'interface, sans données commerciales réelles</span><a href="/">Site vitrine <ArrowRight size={15}/></a></div>
        </main>
      </div>
      <nav className="workspace-bottom-nav" aria-label="Navigation mobile de l'aperçu"><a href="#workspace-content"><LayoutDashboard size={20}/>Accueil</a><a href="#workspace-modules"><Package size={20}/>Modules</a><a href="#workspace-modules"><BarChart3 size={20}/>Rapports</a><a href="/"><Home size={20}/>Site</a></nav>
    </div>
  );
}
