import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import "./auth.css";

/** Anciennes URLs conservées pour expliquer le changement sans demander d'OTP. */
export default function RecoveryPage() {
  return (
    <main className="auth-shell auth-shell--recover">
      <div className="auth-left">
        <a className="auth-brand" href="/">
          <span><ShieldCheck size={23}/></span><strong>BTDIGIT <em>AGRO</em></strong>
        </a>
        <div className="auth-left-content">
          <h1>Votre compte, <span>en toute simplicité.</span></h1>
          <p>Inscription et connexion par téléphone ou email et mot de passe, sans code de vérification.</p>
        </div>
      </div>
      <div className="auth-right">
        <section className="auth-card">
          <div className="auth-heading">
            <span className="auth-card-icon"><LockKeyhole size={21}/></span>
            <div><span className="auth-stage">BTDIGIT AGRO</span><h1>Mot de passe oublié ?</h1></div>
          </div>
          <p className="auth-description">
            La récupération automatique est momentanément indisponible pour protéger
            les comptes. Un simple numéro ou email saisi ne suffit pas à prouver
            votre identité. Si votre session est encore ouverte, modifiez votre
            mot de passe dans « Mon espace » avec le mot de passe actuel.
          </p>
          <a className="auth-submit" href="/connexion"><ArrowLeft size={17}/> Retour à la connexion</a>
        </section>
      </div>
    </main>
  );
}
