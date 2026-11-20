import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./auth.css";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, LockKeyhole,
  Mail, Phone, ShieldCheck, Sprout, Wheat,
} from "lucide-react";

type Channel = "email" | "phone";
type Step = "register" | "login" | "verify" | "complete";
type Channels = { email: boolean; phone: boolean };
type APIError = { detail?: string; [key: string]: unknown };

function cookie(name: string) {
  return document.cookie.split("; ").find((part) => part.startsWith(name + "="))?.split("=")[1] || "";
}

async function postAPI(path: string, body: Record<string, string>) {
  // Le token CSRF est récupéré pour chaque interaction. Jamais de token dans localStorage.
  await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": decodeURIComponent(cookie("csrftoken")),
    },
    body: JSON.stringify(body),
  });
  const data: APIError = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Veuillez vérifier les champs saisis.";
    throw new Error(detail);
  }
  return data;
}

export default function AuthPage() {
  const initial = window.location.pathname === "/connexion" ? "login" : "register";
  const [step, setStep] = useState<Step>(initial);
  const [channels, setChannels] = useState<Channels>({ email: false, phone: false });
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [channel, setChannel] = useState<Channel>("phone");
  const [contact, setContact] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [signedInName, setSignedInName] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/auth/channels/", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("API indisponible");
        return response.json() as Promise<Channels>;
      })
      .then((data) => {
        setChannels({ email: !!data.email, phone: !!data.phone });
        if (!data.phone && data.email) setChannel("email");
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Impossible de joindre le service d'authentification.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingChannels(false); });
    return () => controller.abort();
  }, []);

  const goto = (target: Step) => {
    setError(""); setMessage(""); setStep(target);
    const path = target === "login" ? "/connexion" : target === "register" ? "/inscription" : "/verification";
    window.history.replaceState({}, "", path);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      if (step === "register") {
        if (!channels[channel]) throw new Error(providerUnavailable);
        await postAPI("/api/v1/auth/register/", {
          channel, contact, full_name: fullName, password,
        });
        setPassword("");
        goto("verify");
        setMessage("Si votre inscription est éligible, un code vous a été envoyé. Vérifiez votre contact.");
      } else if (step === "verify") {
        const data = await postAPI("/api/v1/auth/verify/", { channel, contact, code });
        if (data.status === "verified") {
          setCode("");
          goto("login");
          setMessage("Votre compte est vérifié. Vous pouvez maintenant vous connecter.");
        }
      } else if (step === "login") {
        const data = await postAPI("/api/v1/auth/login/", {
          identifier: contact, password,
        });
        const user = data.user as { full_name?: string } | undefined;
        setSignedInName(user?.full_name || "Professionnel agricole");
        setPassword("");
        setStep("complete");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  };

  const isRegister = step === "register";
  const isVerify = step === "verify";
  const loginOnly = step === "login";
  const channelReady = channels[channel];
  const channelLabel = channel === "phone" ? "SMS" : "email";
  const providerUnavailable = `Inscription impossible pour le moment : l'envoi d'OTP par ${channelLabel} n'est pas configuré. Aucun compte n'a été créé et aucun code n'a été envoyé.`;
  const showUnavailableMessage = () => {
    setMessage("");
    setError(loadingChannels
      ? "Vérification des services d'inscription en cours. Réessayez dans un instant."
      : providerUnavailable);
  };

  return (
    <div className={`auth-shell auth-shell--${step}`}>
      <div className="auth-left">
        <a className="auth-brand" href="/"><span><Sprout size={24}/></span><strong>BTDIGIT <em>AGRO</em></strong></a>
        <div className="auth-left-content">
          <span className="auth-kicker"><Leaf size={17}/> Ensemble, faisons grandir l'agriculture.</span>
          <h1>Le numérique au service <span>du monde agricole.</span></h1>
          <p>Une même plateforme pour rapprocher les producteurs, les coopératives et les acheteurs professionnels du Mali.</p>
          <div className="auth-art" aria-hidden="true"><span className="auth-art-circle"/><Wheat size={205} strokeWidth={.85}/></div>
          <div className="auth-left-footer"><ShieldCheck size={19}/> Sécurité et confidentialité dès l'inscription</div>
        </div>
      </div>

      <main className="auth-right">
        <a href="/" className="auth-back"><ArrowLeft size={17}/> Retour à l'accueil</a>
        <div className="auth-card">
          {step === "complete" ? (
            <div className="auth-complete" role="status">
              <CheckCircle2 size={51}/>
              <h2>Connexion réussie !</h2>
              <p>Bienvenue {signedInName}. Votre session est ouverte. Les fonctionnalités de votre organisation seront intégrées dans les étapes suivantes de la phase 2.</p>
              <a href="/" className="auth-submit">Revenir à la vitrine <ArrowRight size={18}/></a>
              <button type="button" className="auth-text-button" onClick={async () => {
                try { await postAPI("/api/v1/auth/logout/", {}); setSignedInName(""); goto("login"); }
                catch (err) { setError(err instanceof Error ? err.message : "Impossible de se déconnecter."); }
              }}>Se déconnecter</button>
              {error && <p className="auth-error" role="alert">{error}</p>}
            </div>
          ) : (
            <>
              <div className="auth-heading">
                <span className="auth-card-icon"><Sprout size={22}/></span>
                <div>
                  <span className="auth-stage">ESPACE PROFESSIONNEL • PHASE 2</span>
                  <h2>{isRegister ? "Créer mon compte" : isVerify ? "Vérifier mon contact" : "Bon retour parmi nous !"}</h2>
                </div>
              </div>
              <p className="auth-description">{isRegister ? "Inscrivez-vous avec votre téléphone ou votre email, selon votre préférence." : isVerify ? "Saisissez le code à 6 chiffres reçu sur votre contact." : "Connectez-vous avec votre téléphone ou votre adresse email."}</p>

              {isRegister && (
                <>
                  <div className="auth-choice" role="group" aria-label="Choisir une méthode d'inscription">
                    <button className={channel === "phone" ? "selected" : ""} aria-pressed={channel === "phone"} type="button" onClick={() => { setChannel("phone"); setContact(""); setError(""); }}><Phone size={18}/> Téléphone</button>
                    <button className={channel === "email" ? "selected" : ""} aria-pressed={channel === "email"} type="button" onClick={() => { setChannel("email"); setContact(""); setError(""); }}><Mail size={18}/> Email</button>
                  </div>
                  {!loadingChannels && !channelReady && (
                    <div className="auth-warning" id="auth-service-warning" role="status">
                      {channel === "phone" ? "L'envoi de SMS" : "L'envoi d'emails"} n'est pas encore configuré.
                      <span> Le compte ne peut pas être créé avant l'activation d'un canal réel.</span>
                    </div>
                  )}
                </>
              )}

              {message && <div className="auth-success" role="status">{message}</div>}
              {error && <div className="auth-error" role="alert">{error}</div>}

              <form className="auth-form" onSubmit={handleSubmit}>
                {isRegister && (
                  <label>Nom complet<input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Ex. : Aminata Coulibaly" autoComplete="name" required minLength={2} maxLength={150}/></label>
                )}

                <label>{isRegister || isVerify ? (channel === "phone" ? "Numéro de téléphone" : "Adresse email") : "Téléphone ou email"}
                  <span className="auth-field-wrap">{channel === "phone" && (isRegister || isVerify) ? <Phone size={18}/> : <Mail size={18}/>}<input value={contact} onChange={(e) => setContact(e.target.value)} type={channel === "email" && !loginOnly ? "email" : "text"} placeholder={channel === "phone" && !loginOnly ? "+223 76 00 00 00" : "nom@exemple.com"} required autoComplete={loginOnly ? "username" : "off"} readOnly={isVerify}/></span>
                </label>
                {isVerify ? (
                  <label>Code de vérification<input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="••••••" required className="auth-otp"/></label>
                ) : (
                  <label>Mot de passe
                    <span className="auth-field-wrap"><LockKeyhole size={18}/><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder={isRegister ? "10 caractères minimum" : "Votre mot de passe"} minLength={isRegister ? 10 : undefined} required autoComplete={isRegister ? "new-password" : "current-password"}/><button type="button" className="auth-eye" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
                  </label>
                )}

                <button
                  className="auth-submit"
                  type={isRegister && (loadingChannels || !channelReady) ? "button" : "submit"}
                  onClick={isRegister && (loadingChannels || !channelReady) ? showUnavailableMessage : undefined}
                  disabled={busy}
                  aria-describedby={isRegister && !channelReady && !loadingChannels ? "auth-service-warning" : undefined}
                >
                  {busy ? "Traitement en cours…" : isRegister ? "Créer mon compte" : isVerify ? "Vérifier le code" : "Me connecter"}
                  {!busy && <ArrowRight size={19}/>}
                </button>
              </form>

              {isVerify ? <button className="auth-text-button" type="button" onClick={() => goto("register")}>Modifier mon contact</button> :
                <p className="auth-switch">{isRegister ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"} <button type="button" onClick={() => goto(isRegister ? "login" : "register")}>{isRegister ? "Se connecter" : "Créer un compte"}</button></p>}
              <p className="auth-privacy"><ShieldCheck size={16}/> Vos informations ne sont pas partagées avec d'autres organisations.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
