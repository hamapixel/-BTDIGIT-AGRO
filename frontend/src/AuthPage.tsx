import { useState } from "react";
import type { FormEvent } from "react";
import "./auth.css";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, LockKeyhole,
  Mail, Phone, ShieldCheck, Sprout, Wheat,
} from "lucide-react";

type Channel = "email" | "phone";
type Step = "register" | "login" | "complete";
type APIError = { detail?: string | string[]; [key: string]: unknown };

function explainAPIError(data: APIError, status: number): string {
  // DRF renvoie souvent { contact: ["..."] } ou { password: ["..."] },
  // et pas un champ detail. Ne plus cacher la raison d'un formulaire refusé.
  const labels: Record<string, string> = {
    contact: "Téléphone ou email",
    phone: "Téléphone",
    email: "Email",
    password: "Mot de passe",
    full_name: "Nom complet",
    channel: "Méthode d'inscription",
    identifier: "Identifiant",
    non_field_errors: "Formulaire",
  };
  const messages = Object.entries(data).flatMap(([key, value]) => {
    const items = typeof value === "string" ? [value]
      : Array.isArray(value) ? value.filter((item): item is string => typeof item === "string")
      : [];
    return items.map(item => key === "detail" ? item : `${labels[key] || key} : ${item}`);
  });
  if (messages.length > 0) return messages.join(" ");
  if (status === 403) return "Accès refusé (HTTP 403). La vérification de sécurité CSRF a échoué : rechargez la page. Si cela continue, vérifiez la configuration de l'API.";
  if (status === 400) return "Formulaire refusé (HTTP 400). Vérifiez le téléphone et le mot de passe.";
  if (status === 404) return "Adresse API introuvable (HTTP 404). Vérifiez que l'API Django est à jour.";
  if (status === 429) return "Trop de tentatives (HTTP 429). Réessayez un peu plus tard.";
  if (status >= 500) return `Le serveur a rencontré une erreur (HTTP ${status}).`;
  return `Inscription ou connexion refusée (HTTP ${status}).`;
}

function cookie(name: string) {
  return document.cookie.split("; ").find(part => part.startsWith(name + "="))?.split("=")[1] ?? "";
}

async function postAPI(path: string, body: Record<string, string>) {
  const csrf = await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  if (!csrf.ok) throw new Error("Connexion au serveur impossible.");
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": decodeURIComponent(cookie("csrftoken")),
    },
    body: JSON.stringify(body),
  });
  // Les refus CSRF Django renvoient du HTML, contrairement aux erreurs DRF
  // au format JSON. Un JSON illisible doit conserver le statut HTTP visible.
  const payload: unknown = await response.json().catch(() => null);
  const data: APIError = payload !== null && typeof payload === "object" && !Array.isArray(payload)
    ? payload as APIError : {};
  if (!response.ok) throw new Error(explainAPIError(data, response.status));
  return data;
}

export default function AuthPage() {
  const initial = window.location.pathname === "/connexion" ? "login" : "register";
  const [step, setStep] = useState<Step>(initial);
  const [channel, setChannel] = useState<Channel>("phone");
  const [contact, setContact] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedInName, setSignedInName] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);

  const goto = (next: "register" | "login") => {
    setError("");
    setPassword("");
    setContact("");
    setStep(next);
    window.history.replaceState({}, "", next === "login" ? "/connexion" : "/inscription");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const isRegister = step === "register";
      const data = isRegister
        ? await postAPI("/api/v1/auth/register/", {
          channel, contact, full_name: fullName, password,
        })
        : await postAPI("/api/v1/auth/login/", {
          identifier: contact, password,
        });
      const user = data.user as { full_name?: string } | undefined;
      setSignedInName(user?.full_name || fullName || "Professionnel agricole");
      setJustRegistered(isRegister);
      setPassword("");
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  };

  const isRegister = step === "register";
  const loginOnly = step === "login";

  return (
    <div className={`auth-shell auth-shell--${step}`}>
      <div className="auth-left">
        <a className="auth-brand" href="/"><span><Sprout size={24}/></span><strong>BTDIGIT <em>AGRO</em></strong></a>
        <div className="auth-left-content">
          <span className="auth-kicker"><Leaf size={17}/> Ensemble, faisons grandir l'agriculture.</span>
          <h1>Le numérique au service <span>du monde agricole.</span></h1>
          <p>Une plateforme pour rapprocher les producteurs, coopératives et acheteurs professionnels du Mali.</p>
          <div className="auth-art" aria-hidden="true"><span className="auth-art-circle"/><Wheat size={205} strokeWidth={.85}/></div>
          <div className="auth-left-footer"><ShieldCheck size={19}/> Mot de passe protégé, accès réservé à votre compte.</div>
        </div>
      </div>

      <main className="auth-right">
        <a href="/" className="auth-back"><ArrowLeft size={17}/> Retour à l'accueil</a>
        <div className="auth-card">
          {step === "complete" ? (
            <div className="auth-complete" role="status">
              <CheckCircle2 size={51}/>
              <h2>{justRegistered ? "Compte créé !" : "Connexion réussie !"}</h2>
              <p>Bienvenue {signedInName}. Vous êtes connecté à BTDIGIT AGRO. Aucun code de vérification n'est nécessaire.</p>
              <a href="/espace" className="auth-submit">Accéder à mon espace <ArrowRight size={18}/></a>
              <button type="button" className="auth-text-button" onClick={async () => {
                try {
                  await postAPI("/api/v1/auth/logout/", {});
                  setSignedInName(""); goto("login");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Impossible de se déconnecter.");
                }
              }}>Se déconnecter</button>
              {error && <p className="auth-error" role="alert">{error}</p>}
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <span className="auth-card-icon"><Sprout size={22}/></span>
                <div>
                  <span className="auth-stage">ESPACE PROFESSIONNEL · BTDIGIT AGRO</span>
                  <h2>{isRegister ? "Créer mon compte" : "Bon retour parmi nous !"}</h2>
                </div>
              </div>
              <p className="auth-description">
                {isRegister
                  ? "Inscrivez-vous avec un téléphone ou un email et un mot de passe. Aucun code à recevoir."
                  : "Connectez-vous avec votre téléphone ou votre adresse email et votre mot de passe."}
              </p>

              {isRegister && (
                <div className="auth-choice" role="group" aria-label="Choisir une méthode d'inscription">
                  <button className={channel === "phone" ? "selected" : ""} aria-pressed={channel === "phone"}
                    type="button" onClick={() => { setChannel("phone"); setContact(""); setError(""); }}>
                    <Phone size={18}/> Téléphone
                  </button>
                  <button className={channel === "email" ? "selected" : ""} aria-pressed={channel === "email"}
                    type="button" onClick={() => { setChannel("email"); setContact(""); setError(""); }}>
                    <Mail size={18}/> Email
                  </button>
                </div>
              )}
              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                {isRegister && (
                  <label>Nom complet
                    <input value={fullName} onChange={e => setFullName(e.target.value)}
                      type="text" placeholder="Ex. : Aminata Coulibaly"
                      autoComplete="name" required minLength={2} maxLength={150}/>
                  </label>
                )}

                <label>{isRegister ? channel === "phone" ? "Numéro de téléphone" : "Adresse email" : "Téléphone ou email"}
                  <span className="auth-field-wrap">
                    {isRegister && channel === "phone" ? <Phone size={18}/> : <Mail size={18}/>}
                    <input value={contact} onChange={e => setContact(e.target.value)}
                      type={isRegister && channel === "email" ? "email" : "text"}
                      placeholder={isRegister && channel === "phone" ? "+223 76 00 00 00" : "nom@exemple.com"}
                      required autoComplete={loginOnly ? "username" : "off"}/>
                  </span>
                </label>

                <label>Mot de passe
                  <span className="auth-field-wrap">
                    <LockKeyhole size={18}/>
                    <input value={password} onChange={e => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder={isRegister ? "10 caractères minimum" : "Votre mot de passe"}
                      minLength={isRegister ? 10 : undefined}
                      required autoComplete={isRegister ? "new-password" : "current-password"}/>
                    <button type="button" className="auth-eye"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </span>
                </label>

                <button className="auth-submit" type="submit" disabled={busy}>
                  {busy ? "Traitement en cours…" : isRegister ? "Créer mon compte" : "Me connecter"}
                  {!busy && <ArrowRight size={19}/>}
                </button>
              </form>

              <p className="auth-switch">{isRegister ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
                <button type="button" onClick={() => goto(isRegister ? "login" : "register")}>
                  {isRegister ? "Se connecter" : "Créer un compte"}
                </button>
              </p>
              <p className="auth-privacy">
                <ShieldCheck size={16}/> Vos coordonnées sont enregistrées, mais leur possession n'est pas vérifiée.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
