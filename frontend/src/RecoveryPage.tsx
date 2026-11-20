import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, Phone, ShieldCheck } from "lucide-react";
import "./auth.css";

type ContactMethod = "email" | "phone";
type Delivery = "email" | "whatsapp" | "sms";
type Channels = { email: boolean; phone: boolean; whatsapp: boolean; sms: boolean };

function csrfCookie() {
  return document.cookie.split("; ").find(p => p.startsWith("csrftoken="))?.split("=")[1] ?? "";
}

async function post(path: string, data: Record<string, string>) {
  await fetch("/api/v1/auth/csrf/", { credentials: "same-origin" });
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-CSRFToken": decodeURIComponent(csrfCookie()) },
    body: JSON.stringify(data),
  });
  const body = await response.json().catch(() => ({})) as { detail?: string };
  if (!response.ok) throw new Error(body.detail || "Opération indisponible, réessayez.");
  return body;
}

export default function RecoveryPage() {
  const [channels, setChannels] = useState<Channels>({ email: false, phone: false, whatsapp: false, sms: false });
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<ContactMethod>("email");
  const [delivery, setDelivery] = useState<Delivery>("email");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/auth/channels/", { signal: controller.signal })
      .then(async r => { if (!r.ok) throw Error(); return r.json() as Promise<Channels>; })
      .then(data => setChannels(data))
      .catch(err => { if ((err as Error).name !== "AbortError") setError("Service d'authentification indisponible."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const enabled = !!channels[delivery];
  const selectContact = (next: ContactMethod) => {
    setChannel(next);
    setDelivery(next === "email" ? "email" : channels.whatsapp ? "whatsapp" : channels.sms ? "sms" : "whatsapp");
    setContact(""); setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setNotice("");
    if (!enabled) {
      setError("Le fournisseur " + delivery + " n'est pas encore configuré : aucun OTP ne peut être envoyé.");
      return;
    }
    setBusy(true);
    try {
      if (step === "request") {
        await post("/api/v1/auth/recover/", { channel, delivery, contact });
        setStep("confirm");
        setNotice("Si ce contact est éligible, un code y a été envoyé. Vérifiez vos messages.");
      } else {
        await post("/api/v1/auth/recover/confirm/", { channel, delivery, contact, code, password });
        setPassword(""); setCode(""); setStep("done");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Service indisponible."); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-shell auth-shell--recover">
      <aside className="auth-left">
        <a href="/" className="auth-brand"><span><KeyRound size={22}/></span><strong>BTDIGIT <em>AGRO</em></strong></a>
        <div className="auth-left-content">
          <span className="auth-kicker"><ShieldCheck size={17}/> VOTRE COMPTE EN SÉCURITÉ</span>
          <h1>Retrouvez votre accès <span>en toute sécurité.</span></h1>
          <p>Un code unique sera envoyé à votre contact déjà vérifié, via un fournisseur réellement activé.</p>
          <div className="auth-art" aria-hidden="true"><KeyRound size={140} strokeWidth={1.1}/></div>
        </div>
      </aside>
      <main className="auth-right">
        <a className="auth-back" href="/connexion"><ArrowLeft size={17}/> Connexion</a>
        <section className="auth-card">
          <div className="auth-heading"><span className="auth-card-icon"><KeyRound size={21}/></span><div>
            <span className="auth-stage">BTDIGIT AGRO • COMPTE</span>
            <h2>{step === "request" ? "Mot de passe oublié ?" : step === "confirm" ? "Nouveau mot de passe" : "Mot de passe changé"}</h2>
          </div></div>
          {step === "done" ? (
            <div className="auth-complete" role="status">
              <CheckCircle2 size={43}/>
              <p>Votre mot de passe a été mis à jour. Connectez-vous avec le nouveau mot de passe.</p>
              <a className="auth-submit" href="/connexion">Se connecter <ArrowRight size={16}/></a>
            </div>
          ) : (
            <>
              <p className="auth-description">{step === "request"
                ? "Renseignez l'adresse email ou le numéro vérifié de votre compte."
                : "Saisissez le code reçu et un nouveau mot de passe sécurisé."}</p>
              {step === "request" && <div className="auth-choice" role="group" aria-label="Canal de récupération">
                <button type="button" className={channel === "email" ? "selected" : ""} onClick={() => selectContact("email")}><Mail size={17}/> Email</button>
                <button type="button" className={channel === "phone" ? "selected" : ""} onClick={() => selectContact("phone")}><Phone size={17}/> Téléphone</button>
              </div>}
              {channel === "phone" && <div className="auth-delivery-options" role="group" aria-label="Réception du code">
                <button type="button" className={delivery === "whatsapp" ? "selected" : ""} onClick={() => { setDelivery("whatsapp"); setError(""); }}>WhatsApp</button>
                <button type="button" className={delivery === "sms" ? "selected" : ""} onClick={() => { setDelivery("sms"); setError(""); }}>SMS</button>
              </div>}
              {!loading && !enabled && <p className="auth-warning" role="status">Envoi OTP par {delivery} indisponible : fournisseur non configuré.</p>}
              {error && <p className="auth-error" role="alert">{error}</p>}
              {notice && <p className="auth-success" role="status">{notice}</p>}
              <form className="auth-form" onSubmit={submit}>
                <label>{channel === "email" ? "Adresse email vérifiée" : "Téléphone vérifié"}
                  <input type={channel === "email" ? "email" : "tel"} autoComplete="username" required
                    readOnly={step === "confirm"} value={contact} onChange={e => setContact(e.target.value)}
                    placeholder={channel === "email" ? "nom@exemple.com" : "+223 76 00 00 00"}/>
                </label>
                {step === "confirm" && <>
                  <label>Code à 6 chiffres
                    <input type="text" inputMode="numeric" autoComplete="one-time-code" className="auth-otp" required
                      pattern="[0-9]{6}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0,6))}/>
                  </label>
                  <label>Nouveau mot de passe
                    <input type="password" minLength={10} maxLength={128} autoComplete="new-password"
                      placeholder="10 caractères minimum" required value={password} onChange={e => setPassword(e.target.value)}/>
                  </label>
                </>}
                <button className="auth-submit" type="submit" disabled={busy}>
                  {busy ? "Vérification…" : step === "request" ? "Recevoir mon code" : "Changer mon mot de passe"}
                  {!busy && <ArrowRight size={17}/>}
                </button>
              </form>
              {step === "confirm" && <button type="button" className="auth-text-button" onClick={() => {
                setStep("request"); setError(""); setNotice(""); setCode(""); setPassword("");
              }}>Modifier le contact</button>}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
