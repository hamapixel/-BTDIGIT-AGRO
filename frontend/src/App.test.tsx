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

  it("signale que la connexion des utilisateurs est une étape future", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("disponible à la phase 2");
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

  it("signale honnêtement une indisponibilité backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("hors ligne")));
    render(<App />);
    expect(await screen.findByText("API indisponible ou non joignable")).toBeInTheDocument();
  });
});
