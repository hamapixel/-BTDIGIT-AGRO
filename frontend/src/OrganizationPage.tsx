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
type User = { id: string; full_name: string; email: string | null; phone: string | null; email_verified?: boolean; phone_verified?: boolean; is_superadmin?: boolean };
type Member = { id: string; user_id: string; name: string; role: string; accepted: boolean };
type Invitation = { id: string; organization_id: string; organization_name: string; role: string; kind: string };

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
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.matchMedia?.("(max-width: 900px)")?.matches || false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Organization["kind"]>("producer");
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [newContactChannel, setNewContactChannel] = useState<"email" | "phone">("email");
  const [newContact, setNewContact] = useState("");
  const [contactPassword, setContactPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
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
      superadminView ? Promise.resolve({ invitations: [] }) : jsonAPI("/api/v1/organizations/invitations/"),
    ]).then(([me, list, pending]) => {
      if (!mounted) return;
      setUser(me.user as User);
      if ((me.user as User).email && !(me.user as User).phone) {
        setNewContactChannel("phone");
      }
      if (superadminView) {
        setAllOrganizations(list.organizations as typeof allOrganizations);
      } else {
        const orgs = list.organizations as Organization[];
        setOrganizations(orgs);
        setActiveId(prev => prev || orgs[0]?.id || "");
        setInvitations(pending.invitations as Invitation[]);
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
        method: "POST", body: { user_id: inviteUserId, role: inviteRole },
      });
      setInviteUserId("");
      const data = await jsonAPI(`/api/v1/organizations/${current.id}/members/`);
      setMembers(data.members as Member[]);
      setNotice("Invitation créée : le compte doit l’accepter avant d’accéder à l’organisation.");
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible d'ajouter ce compte."); }
    finally { setBusy(false); }
  };

  const addSecondaryContact = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      await jsonAPI("/api/v1/auth/contacts/", {
        method: "POST",
        body: { channel: newContactChannel, contact: newContact, current_password: contactPassword },
      });
      const me = await jsonAPI("/api/v1/auth/me/");
      setUser(me.user as User);
      setNewContact(""); setContactPassword("");
      setNotice("Contact ajouté. Sa possession n'a pas été vérifiée.");
    } catch (e) { setError(e instanceof Error ? e.message : "Ajout impossible."); }
    finally { setBusy(false); }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      await jsonAPI("/api/v1/auth/change-password/", {
        method: "POST",
        body: { current_password: currentPassword, new_password: nextPassword },
      });
      setCurrentPassword(""); setNextPassword("");
      setNotice("Mot de passe modifié. Votre session actuelle reste ouverte.");
    } catch (e) { setError(e instanceof Error ? e.message : "Modification impossible."); }
    finally { setBusy(false); }
  };

  const answerInvitation = async (id: string, accept: boolean) => {
    setBusy(true); setError(""); setNotice("");
    try {
      await jsonAPI(`/api/v1/organizations/invitations/${id}/`, {
        method: accept ? "POST" : "DELETE",
      });
      const [orgs, invites] = await Promise.all([
        jsonAPI("/api/v1/organizations/"),
        jsonAPI("/api/v1/organizations/invitations/"),
      ]);
      const list = orgs.organizations as Organization[];
      setOrganizations(list);
      setInvitations(invites.invitations as Invitation[]);
      if (accept) setActiveId(id => id || list[0]?.id || "");
      setNotice(accept ? "Invitation acceptée : vous pouvez accéder à cette organisation." : "Invitation refusée.");
    } catch (e) { setError(e instanceof Error ? e.message : "Opération impossible."); }
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
            {invitations.length > 0 && <section className="org-panel org-invitation-section">
              <div className="org-section-heading"><div><h2>Invitations à rejoindre une organisation</h2><p>L’accès n'est autorisé qu'après votre acceptation.</p></div><Users size={23}/></div>
              {invitations.map(inv => <div className="org-invitation" key={inv.id}>
                <div><strong>{inv.organization_name}</strong><small>{kindNames[inv.kind as Organization["kind"]] || inv.kind} · {roleNames[inv.role as keyof typeof roleNames] || inv.role}</small></div>
                <div><button type="button" disabled={busy} onClick={() => answerInvitation(inv.id, true)}>Accepter</button>
                  <button type="button" disabled={busy} onClick={() => answerInvitation(inv.id, false)}>Refuser</button></div>
              </div>)}
            </section>}
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
            <section className="org-panel org-members-section">
              <div className="org-section-heading"><div><h2>Mon compte</h2><p>Votre identifiant sert aux invitations d'entreprise, sans code de vérification.</p></div><ShieldCheck size={22}/></div>
              {user && <div className="org-account-id">
                <label>Mon identifiant à partager pour recevoir une invitation
                  <input readOnly aria-label="Mon identifiant de compte" value={user.id || ""} onFocus={e => e.currentTarget.select()} />
                </label>
                <p>Vos coordonnées sont enregistrées, mais ne sont pas certifiées comme vous appartenant.</p>
              </div>}
              {user && (!user.email || !user.phone) && <form className="org-contact-form" onSubmit={addSecondaryContact}>
                <label>Ajouter un contact
                  <select value={newContactChannel} onChange={e => {
                    const value = e.target.value as "email" | "phone";
                    setNewContactChannel(value); setNewContact(""); setError("");
                  }}>
                    {!user.email && <option value="email">Email</option>}
                    {!user.phone && <option value="phone">Téléphone</option>}
                  </select>
                </label>
                <label>{newContactChannel === "email" ? "Nouvelle adresse email" : "Nouveau numéro de téléphone"}
                  <input key={newContactChannel} required
                    name={newContactChannel === "email" ? "additional_contact_email" : "additional_contact_phone"}
                    type={newContactChannel === "email" ? "email" : "tel"}
                    inputMode={newContactChannel === "email" ? "email" : "tel"}
                    autoComplete="off"
                    value={newContact} onChange={e => setNewContact(e.target.value)}
                    placeholder={newContactChannel === "email" ? "adresse@exemple.com" : "+223 76 00 00 00"}/>
                </label>
                <label>Mot de passe actuel
                  <input required type="password" autoComplete="current-password"
                    value={contactPassword} onChange={e => setContactPassword(e.target.value)} />
                </label>
                <button type="submit" className="org-button" disabled={busy}>Ajouter ce contact <ArrowRight size={16}/></button>
              </form>}
              <form className="org-contact-form" onSubmit={changePassword}>
                <label>Mot de passe actuel
                  <input type="password" autoComplete="current-password" required
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}/>
                </label>
                <label>Nouveau mot de passe
                  <input type="password" autoComplete="new-password" minLength={10} required
                    value={nextPassword} onChange={e => setNextPassword(e.target.value)}/>
                </label>
                <button type="submit" className="org-button" disabled={busy}>Changer mon mot de passe <ArrowRight size={16}/></button>
              </form>
              <p className="org-muted-note">La récupération d'un mot de passe oublié reste désactivée jusqu'à la mise en place d'une procédure sécurisée.</p>
            </section>
            {current && <section className="org-panel org-members-section">
              <div className="org-section-heading"><div><h2>Équipe — {current.name}</h2><p>Vos collaborateurs ne peuvent pas consulter les autres organisations sans autorisation.</p></div><Users size={23}/></div>
              {current.membership_role === "member" ? (
                <p>Vous êtes collaborateur. L'administration des membres est réservée aux responsables.</p>
              ) : <>
                <div className="org-member-list">{members.map(m => <div key={m.id}><strong>{m.name || "Collaborateur"}</strong><span>{roleNames[m.role as keyof typeof roleNames] || m.role}{!m.accepted ? " · Invitation en attente" : ""}</span></div>)}</div>
                <form className="org-invite" onSubmit={addMember}>
                  <label>Identifiant UUID du collaborateur<input required value={inviteUserId} onChange={e => setInviteUserId(e.target.value)} placeholder="Identifiant partagé par le collaborateur"/></label>
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
