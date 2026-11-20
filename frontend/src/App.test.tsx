import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

const healthyResponse = {
  ok: true,
  json: async () => ({ status: "ok", database: "ok", service: "btdigit-agro-api" }),
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(healthyResponse));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute("data-theme");
  window.history.replaceState({}, "", "/");
});

describe("BTDIGIT AGRO — connexion directe sans OTP", () => {
  it("présente la marketplace et l'état réel de l'API", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Du champ au marché");
    expect(await screen.findByText("API Django et PostgreSQL connectés")).toBeInTheDocument();
  });

  it("filtre les catégories sans inventer d'offres", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("searchbox", { name: /Rechercher une catégorie/i }), {
      target: { value: "tomates" },
    });
    expect(screen.getByText("Légumes")).toBeInTheDocument();
    expect(screen.queryByText("Céréales")).not.toBeInTheDocument();
  });

  it("les liens publics ouvrent les vrais formulaires", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/connexion");
    expect(screen.getByRole("link", { name: /Rejoindre AGRO/i })).toHaveAttribute("href", "/inscription");
  });

  it("préserve la sidebar rétractable de l'aperçu", () => {
    window.history.replaceState({}, "", "/apercu");
    render(<App />);
    expect(screen.getByRole("heading", { name: /Bienvenue dans votre futur espace/i })).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Réduire le menu latéral" });
    fireEvent.click(toggle);
    expect(document.querySelector(".workspace")).toHaveClass("workspace-is-collapsed");
    fireEvent.click(screen.getByRole("button", { name: "Déployer le menu latéral" }));
    expect(document.querySelector(".workspace")).not.toHaveClass("workspace-is-collapsed");
  });

  it("préserve le volet mobile accessible", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true, media: "(max-width: 900px)",
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    window.history.replaceState({}, "", "/apercu");
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu latéral" }));
    expect(document.querySelector(".workspace-sidebar")).toHaveClass("sidebar-is-open");
    fireEvent.click(screen.getByRole("button", { name: "Fermer le menu" }));
    expect(document.querySelector(".workspace-sidebar")).not.toHaveClass("sidebar-is-open");
  });

  it("inscription courte téléphone/email, sans option OTP ni avertissement de prestataire", () => {
    window.history.replaceState({}, "", "/inscription");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Créer mon compte" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Choisir une méthode d'inscription" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer mon compte" })).toHaveAttribute("type", "submit");
    expect(screen.queryByText(/code à 6 chiffres|envoi d'OTP|WhatsApp|SMS/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Email/i }));
    expect(screen.getByText("Adresse email")).toBeInTheDocument();
  });

  it("crée le compte directement et ouvre la session sans code", async () => {
    window.history.replaceState({}, "", "/inscription");
    const fetchMock = vi.fn((url: string, _options?: RequestInit) => Promise.resolve({
      ok: true, status: url.includes("/auth/register/") ? 201 : 200,
      json: async () => url.includes("/auth/register/")
        ? { status: "authenticated", user: { full_name: "Aminata Test" } }
        : { status: "ok" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("Ex. : Aminata Coulibaly"), {
      target: { value: "Aminata Test" },
    });
    fireEvent.change(screen.getByPlaceholderText("+223 76 00 00 00"), {
      target: { value: "+22376123456" },
    });
    fireEvent.change(screen.getByPlaceholderText("10 caractères minimum"), {
      target: { value: "AgroPassword2026!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(await screen.findByRole("heading", { name: "Compte créé !" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Accéder à mon espace/i })).toHaveAttribute("href", "/espace");
    const posts = fetchMock.mock.calls.filter(([url]) => url.includes("/auth/register/"));
    expect(posts).toHaveLength(1);
    expect(JSON.parse((posts[0][1] as RequestInit).body as string)).not.toHaveProperty("code");
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/auth/verify/"), expect.anything());
  });

  it("connexion par identifiant et mot de passe sans étape supplémentaire", async () => {
    window.history.replaceState({}, "", "/connexion");
    const fetchMock = vi.fn((url: string) => Promise.resolve({
      ok: true,
      json: async () => url.includes("/auth/login/")
        ? { status: "authenticated", user: { full_name: "Test Producteur" } }
        : { status: "ok" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("nom@exemple.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Votre mot de passe"), { target: { value: "AgroPassword2026!" } });
    fireEvent.click(screen.getByRole("button", { name: "Me connecter" }));
    expect(await screen.findByRole("heading", { name: "Connexion réussie !" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Accéder à mon espace/i })).toHaveAttribute("href", "/espace");
  });

  it("refuse un identifiant ou mot de passe erroné sans afficher de code OTP", async () => {
    window.history.replaceState({}, "", "/connexion");
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({
      ok: !url.includes("/auth/login/"), status: 401,
      json: async () => ({ detail: "Identifiant ou mot de passe incorrect." }),
    })));
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText("nom@exemple.com"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Votre mot de passe"), { target: { value: "incorrect" } });
    fireEvent.click(screen.getByRole("button", { name: "Me connecter" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Identifiant ou mot de passe incorrect.");
  });

  it("ancienne URL de vérification n'offre plus d'écran OTP", () => {
    window.history.replaceState({}, "", "/verification");
    render(<App />);
    expect(screen.getByRole("link", { name: /Retour à la connexion/i })).toHaveAttribute("href", "/connexion");
    expect(screen.queryByLabelText(/Code reçu|Code de vérification/i)).not.toBeInTheDocument();
  });

  it("récupération publique n'accepte pas de réinitialisation non authentifiée", () => {
    window.history.replaceState({}, "", "/recuperation");
    render(<App />);
    expect(screen.getByText(/récupération automatique est momentanément indisponible/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Recevoir mon code/i })).not.toBeInTheDocument();
  });

  it("protège l'espace professionnel des visiteurs non connectés", async () => {
    window.history.replaceState({}, "", "/espace");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 403, json: async () => ({ detail: "Authentication required" }),
    }));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Connexion nécessaire" })).toBeInTheDocument();
  });

  it("affiche les entreprises réellement renvoyées par l'API", async () => {
    window.history.replaceState({}, "", "/espace");
    const mockUser = { id: "123e4567-e89b-12d3-a456-426614174999",
      full_name: "Test Coop", email: "test@example.com", phone: null };
    vi.stubGlobal("fetch", vi.fn((path: string) => Promise.resolve({
      ok: true,
      json: async () => path.includes("/auth/me/") ? ({ user: mockUser }) :
        path.includes("/invitations/") ? ({ invitations: [] }) :
        path.includes("/members/") ? ({ members: [] }) :
        ({ organizations: [{ id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Coopérative de test", kind: "cooperative",
          membership_role: "owner", created_at: "2026-11-20T00:00:00Z" }] }),
    })));
    render(<App />);
    expect(await screen.findByRole("heading", { name: /Bienvenue, Test Coop/ })).toBeInTheDocument();
    expect(screen.getByText("Coopérative de test")).toBeInTheDocument();
    expect(screen.getByLabelText("Mon identifiant de compte")).toHaveValue(mockUser.id);
  });

  it("signale l'indisponibilité réelle de l'API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("hors ligne")));
    render(<App />);
    expect(await screen.findByText("API indisponible ou non joignable")).toBeInTheDocument();
  });
});
