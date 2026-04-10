import type { GameListItem } from "../types/types.js";

const createdGameButton = document.querySelector<HTMLButtonElement>("#create_game");
const gamesList = document.querySelector<HTMLDivElement>("#games_list");
const gameCardTemplate = document.querySelector<HTMLTemplateElement>("#game_card_template");

function renderGame(game: GameListItem): HTMLElement {
  if (!gameCardTemplate) {
    throw new Error("Missing template #game_card_template");
  }

  const clone = gameCardTemplate.content.cloneNode(true) as DocumentFragment;

  const idEl = clone.querySelector("[data-game-id]");
  const creatorEl = clone.querySelector("[data-creator]");
  const playerCountEl = clone.querySelector("[data-player-count]");
  const statusEl = clone.querySelector("[data-status]");

  if (!idEl || !creatorEl || !playerCountEl || !statusEl) {
    throw new Error("Template structure is invalid");
  }

  idEl.textContent = `Game #${String(game.id)}`;
  creatorEl.textContent = game.creator_email;
  playerCountEl.textContent = `${String(game.player_count)} player(s)`;
  statusEl.textContent = String(game.status);

  return clone.firstElementChild as HTMLElement;
}

async function loadGames(): Promise<void> {
  const response = await fetch("/api/games");
  const { games } = (await response.json()) as { games: GameListItem[] };

  if (!gamesList) {
    return;
  }

  if (games.length === 0) {
    gamesList.innerHTML = "<p>No games created yet. Create one!</p>";
    return;
  }

  gamesList.append(...games.map(renderGame));
}

async function createGame(): Promise<void> {
  const response = await fetch("/api/games", {
    method: "post",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error("Failed to create game");
    return;
  }

  await loadGames();
}

createdGameButton?.addEventListener("click", () => {
  void createGame();
});
void loadGames();
