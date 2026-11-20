import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, Building2, CheckCircle2, ChevronRight, Leaf,
  LogOut, Menu, ShieldCheck, Sprout, Users, X,
} from "lucide-react";
import "./organization.css";

type Organization = {
  id: string; name: string;
  kind: "producer" | "cooperative" | "buyer" | "carrier";
  membership_role: "owner" | "admin" | "member";
  created_at: string;
};
type User = { full_name: string; email: string | null; phone: string | null; is_superadmin?: boolean };
type Member = { id: string; user_id: string; name: string; role: string };

const kindNames = {
  producer: "Producteur",
  cooperative: "Coopérative",
  buyer: "Acheteur professionnel",
  carrier: "Transporteur",
};
const roleNames = { owner: "Propriétaire", admin: "Administrateur", member: "Collaborateur" };

function csrfToken() {
  return document.cookie.split("; ").find(x => x.startsWith("csrftoken="))?.split("=")[1] || "";
}
async function jsonAPI(path: string, options: { method?: string; body?: object } = {}) {
  if (options.method && options.method !== "GET") {
    await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  }
  const res = await fetch(path, {
    credentials: "same-origin",
    method: options.method || "GET",
    headers: options.method ? {
      "Content-Type": "application/json",
      "X-CSRFToken": decodeURIComponent(csrfToken()),
    } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(res.status === 403 || res.status === 401
      ? "Session expirée ou accès refusé."
      : typeof data.detail === "string" ? data.detail : "Opération impossible.");
  }
  return data;
}

export default function OrganizationPage() {
  const superadminView = window.location.pathname === "/superadmin";
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Array<{id:string;name:string;kind:string;members_count:number}>>([]);
  const [activeId, setActiveId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.matchMedia?.("(max-width: 900px)")?.matches || false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Organization["kind"]>("producer");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 900px)");
    if (!mq) return;
    const onChange = (event: MediaQueryListEvent) => { setIsSmallScreen(event.matches); setSidebarOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      jsonAPI("/api/v1/auth/me/"),
      superadminView ? jsonAPI("/api/v1/superadmin/organizations/") : jsonAPI("/api/v1/organizations/"),
    ]).then(([me, list]) => {
      if (!mounted) return;
      setUser(me.user as User);
      if (superadminView) {
        setAllOrganizations(list.organizations as typeof allOrganizations);
      } else {
        const orgs = list.organizations as Organization[];
        setOrganizations(orgs);
        setActiveId(prev => prev || orgs[0]?.id || "");
      }
    }).catch(e => { if (mounted) setError(e instanceof Error ? e.message : "Connexion requise."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superadminView]);

  const current = organizations.find(x => x.id === activeId);
  useEffect(() => {
    if (!current || current.membership_role === "member") { setMembers([]); return; }
    let mounted = true;
    jsonAPI(`/api/v1/organizations/${current.id}/members/`)
      .then(data => { if (mounted) setMembers(data.members as Member[]); })
      .catch(() => { if (mounted) setMembers([]); });
    return () => { mounted = false; };
  }, [current?.id, current?.membership_role]);

  const createOrg = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      const data = await jsonAPI("/api/v1/organizations/", { method: "POST", body: { name, kind } });
      const org = data.organization as Organization;
      setOrganizations(v => [...v, org]);
      setActiveId(org.id); setName("");
      setNotice("Votre organisation professionnelle a été créée.");
    } catch (e) { setError(e instanceof Error ? e.message : "Création impossible."); }
    finally { setBusy(false); }
  };

  const addMember = async (event: FormEvent) => {
    event.preventDefault(); if (!current) return;
    setError(""); setNotice(""); setBusy(true);
    try {
      await jsonAPI(`/api/v1/organizations/${current.id}/members/`, {
        method: "POST", body: { identifier: inviteContact, role: inviteRole },
      });
      setInviteContact("");
      const data = await jsonAPI(`/api/v1/organizations/${current.id}/members/`);
      setMembers(data.members as Member[]);
      setNotice("Compte vérifié ajouté à l'organisation.");
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible d'ajouter ce compte."); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    try { await jsonAPI("/api/v1/auth/logout/", { method: "POST" }); window.location.assign("/connexion"); }
    catch (e) { setError(e instanceof Error ? e.message : "Déconnexion impossible."); }
  };

  const sidebarToggle = () => isSmallScreen ? setSidebarOpen(v => !v) : setSidebarCollapsed(v => !v);

  return <div className={`org-shell ${sidebarCollapsed ? "org-collapsed" : ""} ${sidebarOpen ? "org-drawer-open" : ""}`}>
    <aside className="org-sidebar" aria-label="Navigation de mon espace" inert={isSmallScreen && !sidebarOpen}>
      <a className="org-brand" href="/"><span><Sprout size={23}/></span><strong>BTDIGIT AGRO</strong></a>
      <div className="org-nav-label">ESPACE SÉCURISÉ</div>
      <a className="org-nav-link org-nav-selected" href="/espace" title="Mes organisations"><Building2 size={19}/><span>Mes organisations</span></a>
      {user?.is_superadmin && <a className="org-nav-link" href="/superadmin" title="Superadministrateur"><ShieldCheck size={19}/><span>Superadministrateur</span></a>}
      <a className="org-nav-link" href="/" title="Site public"><Leaf size={19}/><span>Site public</span></a>
      <button type="button" className="org-nav-link org-logout" onClick={logout} title="Se déconnecter"><LogOut size={19}/><span>Se déconnecter</span></button>
      <div className="org-sidebar-foot">Phase 2 — vrais comptes et droits d'accès</div>
    </aside>
    {sidebarOpen && <button className="org-scrim" aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)}/>}
    <div className="org-main">
      <header className="org-header">
        <button type="button" className="org-menu-toggle" onClick={sidebarToggle}
          aria-label={sidebarOpen ? "Fermer la navigation" : sidebarCollapsed && !isSmallScreen ? "Déployer la sidebar" : "Ouvrir ou réduire la sidebar"}>
          {sidebarOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
        <div><small>BTDIGIT AGRO · COMPTE</small><strong>{superadminView ? "Superadministration" : "Mon espace professionnel"}</strong></div>
        <a className="org-home-link" href="/"><ArrowLeft size={15}/> Accueil</a>
      </header>
      <main className="org-content">
        {loading ? <p role="status">Chargement de votre espace…</p> : error && !user ? (
          <section className="org-panel"><h1>Connexion nécessaire</h1><p>{error}</p><a className="org-button" href="/connexion">Se connecter <ArrowRight size={17}/></a></section>
        ) : <>
          <span className="org-eyebrow"><ShieldCheck size={16}/> DONNÉES PERSONNALISÉES ET PROTÉGÉES</span>
          <h1>{superadminView ? "Vue des organisations" : `Bienvenue, ${user?.full_name || "professionnel agricole"}`}</h1>
          <p className="org-lead">{superadminView
            ? "Consultez les organisations de la plateforme. Seul un superadministrateur dispose de cet accès."
            : "Créez votre entreprise, choisissez son activité et gérez uniquement les membres de vos organisations."}</p>
          {error && <p className="org-error" role="alert">{error}</p>}
          {notice && <p className="org-success" role="status"><CheckCircle2 size={17}/>{notice}</p>}

          {superadminView ? (
            <section className="org-panel">
              <h2>Organisations enregistrées</h2>
              <p>Liste limitée aux 100 organisations les plus récentes. Aucun chiffre fictif.</p>
              {allOrganizations.length === 0 ? <p>Aucune organisation disponible.</p> : (
                <div className="org-table-scroll"><table><thead><tr><th>Entreprise</th><th>Activité</th><th>Membres</th></tr></thead>
                  <tbody>{allOrganizations.map(org => <tr key={org.id}><td>{org.name}</td><td>{kindNames[org.kind as Organization["kind"]] || org.kind}</td><td>{org.members_count}</td></tr>)}</tbody>
                </table></div>
              )}
            </section>
          ) : <>
            <section className="org-two-columns">
              <form className="org-panel org-create" onSubmit={createOrg}>
                <span className="org-panel-icon"><Building2 size={22}/></span>
                <h2>Nouvelle organisation</h2>
                <p>Créez votre exploitation, coopérative, société d'achat ou de transport.</p>
                <label>Nom de l'entreprise ou de la coopérative<input value={name} required maxLength={180} minLength={2} onChange={e => setName(e.target.value)} placeholder="Ex. Coopérative agricole de Ségou"/></label>
                <label>Activité principale<select value={kind} onChange={e => setKind(e.target.value as Organization["kind"])}>
                  {Object.entries(kindNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
                </select></label>
                <button className="org-button" type="submit" disabled={busy}>Créer mon organisation <ArrowRight size={16}/></button>
              </form>
              <section className="org-panel">
                <span className="org-panel-icon"><Building2 size={22}/></span>
                <h2>Mes organisations</h2>
                <p>Une identité et des permissions différentes pour chaque organisation.</p>
                {organizations.length === 0 ? (
                  <p className="org-empty">Vous n'avez pas encore créé ni rejoint d'organisation.</p>
                ) : (
                  <div className="org-list">{organizations.map(org => <button key={org.id} type="button"
                    aria-pressed={activeId === org.id}
                    onClick={() => { setActiveId(org.id); setError(""); setNotice(""); }}
                    className={activeId === org.id ? "org-active" : ""}>
                    <span><strong>{org.name}</strong><small>{kindNames[org.kind]} · {roleNames[org.membership_role]}</small></span>
                    <ChevronRight size={18}/></button>)}</div>
                )}
              </section>
            </section>
            {current && <section className="org-panel org-members-section">
              <div className="org-section-heading"><div><h2>Équipe — {current.name}</h2><p>Vos collaborateurs ne peuvent pas consulter les autres organisations sans autorisation.</p></div><Users size={23}/></div>
              {current.membership_role === "member" ? (
                <p>Vous êtes collaborateur. L'administration des membres est réservée aux responsables.</p>
              ) : <>
                <div className="org-member-list">{members.map(m => <div key={m.id}><strong>{m.name || "Compte vérifié"}</strong><span>{roleNames[m.role as keyof typeof roleNames] || m.role}</span></div>)}</div>
                <form className="org-invite" onSubmit={addMember}>
                  <label>Email ou téléphone d'un compte déjà vérifié<input required value={inviteContact} onChange={e => setInviteContact(e.target.value)} placeholder="contact@exemple.com ou +223..."/></label>
                  <label>Rôle<select value={inviteRole} onChange={e => setInviteRole(e.target.value as "member" | "admin")}>
                    <option value="member">Collaborateur</option>
                    {current.membership_role === "owner" && <option value="admin">Administrateur</option>}
                  </select></label>
                  <button type="submit" className="org-button" disabled={busy}>Ajouter <ArrowRight size={16}/></button>
                </form>
              </>}
            </section>}
          </>}
          <footer className="org-footnote">BTDIGIT AGRO · Le catalogue, les commandes et les statistiques réelles arrivent dans les phases suivantes.</footer>
        </>}
      </main>
    </div>
  </div>;
}
