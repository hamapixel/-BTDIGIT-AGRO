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
    expect(screen.getByRole("group", { name: "Choisir une méthode d'inscription" })).toBeInTheDocument();
    expect(await screen.findByText(/L'envoi de SMS.*n'est pas encore configuré/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer mon compte" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Email/i }));
    expect(await screen.findByText(/L'envoi d'emails.*n'est pas encore configuré/)).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Me connecter" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Créer un compte" })).toBeInTheDocument();
  });

  it("signale honnêtement une indisponibilité backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("hors ligne")));
    render(<App />);
    expect(await screen.findByText("API indisponible ou non joignable")).toBeInTheDocument();
  });
});
