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

describe("BTDIGIT AGRO — fondation frontend", () => {
  it("présente la marketplace et l'état réel de l'API", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Du champ au marché");
    expect(await screen.findByText("API Django et PostgreSQL connectés")).toBeInTheDocument();
  });

  it("filtre immédiatement les catégories sans inventer de produits", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("searchbox", { name: /Rechercher une catégorie/i }), {
      target: { value: "tomates" },
    });
    expect(screen.getByText("Légumes")).toBeInTheDocument();
    expect(screen.queryByText("Céréales")).not.toBeInTheDocument();
  });

  it("redirige vers une vraie page de connexion", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/connexion");
    expect(screen.getByRole("link", { name: /Rejoindre AGRO/i })).toHaveAttribute("href", "/inscription");
  });

  it("montre l'aperçu professionnel avec une sidebar et des données non simulées", () => {
    window.history.replaceState({}, "", "/apercu");
    render(<App />);
    expect(screen.getByRole("heading", { name: /Bienvenue dans votre futur espace/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Navigation de l'espace professionnel/i })).toBeInTheDocument();
    expect(screen.getByText("Gestion des récoltes")).toBeInTheDocument();
  });

  it("réduit et déploie la sidebar avec le hamburger sur ordinateur", () => {
    window.history.replaceState({}, "", "/apercu");
    render(<App />);
    const collapse = screen.getByRole("button", { name: "Réduire le menu latéral" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    expect(collapse).toHaveAttribute("aria-controls", "workspace-sidebar");

    fireEvent.click(collapse);
    expect(document.querySelector(".workspace")).toHaveClass("workspace-is-collapsed");
    const expand = screen.getByRole("button", { name: "Déployer le menu latéral" });
    expect(expand).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(expand);
    expect(document.querySelector(".workspace")).not.toHaveClass("workspace-is-collapsed");
    expect(screen.getByRole("button", { name: "Réduire le menu latéral" })).toHaveAttribute("aria-expanded", "true");
  });

  it("ouvre puis ferme un volet mobile sans rétrécir la sidebar", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      media: "(max-width: 900px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    window.history.replaceState({}, "", "/apercu");
    render(<App />);
    const toggle = screen.getByRole("button", { name: "Ouvrir le menu latéral" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Fermer le menu latéral" })).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector(".workspace-sidebar")).toHaveClass("sidebar-is-open");
    expect(document.querySelector(".workspace")).not.toHaveClass("workspace-is-collapsed");

    fireEvent.click(screen.getByRole("button", { name: "Fermer le menu" }));
    expect(screen.getByRole("button", { name: "Ouvrir le menu latéral" })).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".workspace-sidebar")).not.toHaveClass("sidebar-is-open");
  });

  it("affiche téléphone ou email sans promettre l'envoi non configuré", async () => {
    window.history.replaceState({}, "", "/inscription");
    vi.stubGlobal("fetch", vi.fn((path: string) => {
      if (path.includes("/auth/channels/")) return Promise.resolve({
        ok: true, json: async () => ({ email: false, phone: false }),
      });
      return Promise.resolve(healthyResponse);
    }));
    render(<App />);
    expect(screen.getByRole("heading", { name: "Créer mon compte" })).toBeInTheDocument();
    expect(document.querySelector(".auth-shell")).toHaveClass("auth-shell--register");
    expect(screen.getByRole("group", { name: "Choisir une méthode d'inscription" })).toBeInTheDocument();
    expect(await screen.findByText(/L'envoi d'OTP par WhatsApp.*n'est pas encore configuré/)).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Créer mon compte" });
    expect(submit).toBeEnabled();
    expect(submit).toHaveAttribute("type", "button");
    fireEvent.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("Aucun compte n'a été créé");
    expect(screen.getByRole("alert")).toHaveTextContent("aucun code n'a été envoyé");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1); // consultation des canaux, aucun POST
    fireEvent.click(screen.getByRole("button", { name: /^SMS/ }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("OTP par SMS");
    fireEvent.click(screen.getByRole("button", { name: /Email/i }));
    expect(await screen.findByText(/L'envoi d'OTP par email.*n'est pas encore configuré/)).toBeInTheDocument();
    fireEvent.click(submit);
    expect(screen.getByRole("alert")).toHaveTextContent("OTP par email");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("inscrit uniquement lorsque le canal est réellement configuré côté API", async () => {
    window.history.replaceState({}, "", "/inscription");
    const requests = vi.fn((path: string) => Promise.resolve({
      ok: true,
      json: async () => path.includes("/auth/channels/")
        ? { email: true, phone: false }
        : { detail: "Si ce contact peut être inscrit, un code lui sera envoyé." },
    }));
    vi.stubGlobal("fetch", requests);
    render(<App />);
    expect(await screen.findByText("Adresse email")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Ex. : Aminata Coulibaly"), {
      target: { value: "Aminata Exemple" },
    });
    fireEvent.change(screen.getByPlaceholderText("nom@exemple.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("10 caractères minimum"), {
      target: { value: "MotDePasse2026!Valid" },
    });
    const submit = screen.getByRole("button", { name: "Créer mon compte" });
    expect(submit).toBeEnabled();
    expect(submit).toHaveAttribute("type", "submit");
    fireEvent.click(submit);
    expect(await screen.findByRole("heading", { name: "Vérifier mon contact" })).toBeInTheDocument();
    expect(requests).toHaveBeenCalledWith("/api/v1/auth/register/", expect.objectContaining({
      method: "POST",
    }));
  });

  it("affiche le formulaire de connexion même si les fournisseurs OTP sont indisponibles", async () => {
    window.history.replaceState({}, "", "/connexion");
    vi.stubGlobal("fetch", vi.fn((path: string) => Promise.resolve(
      path.includes("/auth/channels/")
        ? { ok: true, json: async () => ({ email: false, phone: false }) }
        : healthyResponse,
    )));
    render(<App />);
    expect(screen.getByRole("heading", { name: /Bon retour parmi nous/i })).toBeInTheDocument();
    expect(document.querySelector(".auth-shell")).toHaveClass("auth-shell--login");
    expect(screen.queryByText("Vous pouvez utiliser le contact vérifié lors de votre inscription.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Me connecter" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Créer un compte" })).toBeInTheDocument();
  });

  it("propose la récupération de mot de passe depuis la connexion", async () => {
    window.history.replaceState({}, "", "/connexion");
    render(<App />);
    expect(screen.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute("href", "/recuperation");
  });

  it("ne prétend pas envoyer un OTP de récupération sans fournisseur", async () => {
    window.history.replaceState({}, "", "/recuperation");
    vi.stubGlobal("fetch", vi.fn((path: string) => Promise.resolve({
      ok: true,
      json: async () => path.includes("/auth/channels/")
        ? ({ email: false, phone: false, whatsapp: false, sms: false })
        : ({ status: "ok" }),
    })));
    render(<App />);
    expect(screen.getByRole("heading", { name: "Mot de passe oublié ?" })).toBeInTheDocument();
    expect(await screen.findByText(/Envoi OTP par email indisponible/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("nom@exemple.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Recevoir mon code" }));
    expect(screen.getByRole("alert")).toHaveTextContent("aucun OTP ne peut être envoyé");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("réserve l'espace réel aux utilisateurs authentifiés", async () => {
    window.history.replaceState({}, "", "/espace");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 403, json: async () => ({ detail: "Authentication required" }),
    }));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Connexion nécessaire" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Se connecter/i })).toHaveAttribute("href", "/connexion");
  });

  it("affiche uniquement les organisations reçues de l'API", async () => {
    window.history.replaceState({}, "", "/espace");
    const mockUser = { full_name: "Test Coop", email: "test@example.com", phone: null };
    vi.stubGlobal("fetch", vi.fn((path: string) => Promise.resolve({
      ok: true,
      json: async () => path.includes("/auth/me/") ? ({ user: mockUser }) :
        path.includes("/members/") ? ({ members: [] }) :
        ({ organizations: [{ id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Coopérative de test", kind: "cooperative", membership_role: "owner",
          created_at: "2026-11-20T00:00:00Z" }] }),
    })));
    render(<App />);
    expect(await screen.findByRole("heading", { name: /Bienvenue, Test Coop/ })).toBeInTheDocument();
    expect(screen.getByText("Coopérative de test")).toBeInTheDocument();
    expect(screen.queryByText("Aucune statistique disponible")).not.toBeInTheDocument();
  });

  it("signale honnêtement une indisponibilité backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("hors ligne")));
    render(<App />);
    expect(await screen.findByText("API indisponible ou non joignable")).toBeInTheDocument();
  });
});
