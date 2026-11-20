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

  it("signale honnêtement une indisponibilité backend", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("hors ligne")));
    render(<App />);
    expect(await screen.findByText("API indisponible ou non joignable")).toBeInTheDocument();
  });
});
