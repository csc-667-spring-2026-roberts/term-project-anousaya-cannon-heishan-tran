import { EventTypes, type GameListItem } from "../types/types.js";

const source = new EventSource("/api/sse");

const createdGameButton = document.querySelector<HTMLButtonElement>("#create_game");
const gamesList = document.querySelector<HTMLDivElement>("#games_list");
const gameCardTemplate = document.querySelector<HTMLTemplateElement>("#game_card_template");

source.onerror = () => {
  console.log("SSE connection lost - browser will reconnect automatically");
}

function renderGames(games: GameListItem[]) {
  if (!gamesList) {
    return;
  }

  if (games.length === 0) {
    gamesList.innerHTML = "<p>No games created yet. Create one!</p>";
    return;
  }
  
  gamesList.replaceChildren(...games.map(renderGame));
}

function renderGame(game: GameListItem): HTMLElement {
  if (!gameCardTemplate) {
    throw new Error("Missing template #game_card_template");
  }

  const clone = gameCardTemplate.content.cloneNode(true) as DocumentFragment;

  const idEl = clone.querySelector("[data-game-id]");
  const creatorEl = clone.querySelector("[data-creator]");
  const playerCountEl = clone.querySelector("[data-player-count]");
  const statusEl = clone.querySelector("[data-status]");
  const form = clone.querySelector("form");

  if (!idEl || !creatorEl || !playerCountEl || !statusEl) {
    throw new Error("Template structure is invalid");
  }

  idEl.textContent = `Game #${String(game.id)}`;
  creatorEl.textContent = game.creator_email;
  playerCountEl.textContent = `${String(game.player_count)} player(s)`;
  statusEl.textContent = String(game.status);
  if (form) form.action = `/api/games/${game.id}/join`

  return clone.firstElementChild as HTMLElement;
}

async function loadGames(): Promise<void> {
  const response = await fetch("/api/games");
  const { games } = (await response.json()) as { games: GameListItem[] };

  renderGames(games);
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
}

createdGameButton?.addEventListener("click", () => void createGame());

source.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === EventTypes.games_updated) {
    //renderGames(data.games);
    loadGames();
  }
}

source.onopen = () => {
  void loadGames();
}