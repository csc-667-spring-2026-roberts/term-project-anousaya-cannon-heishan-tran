"use strict";
(() => {
  // src/client/lobby.ts
  var createdGameButton = document.querySelector("#create_game");
  var gamesList = document.querySelector("#games_list");
  var gameCardTemplate = document.querySelector("#game_card_template");
  function renderGame(game) {
    const clone = gameCardTemplate.content.cloneNode(true);
    clone.querySelector("[data-game-id]").textContent = `Game #${game.id}`;
    clone.querySelector("[data-creator]").textContent = game.creator_email;
    clone.querySelector("[data-player-count]").textContent = `${game.player_count} player(s)`;
    clone.querySelector("[data-status]").textContent = `${game.status}`;
    return clone.firstElementChild;
  }
  async function loadGames() {
    const response = await fetch("/api/games");
    const { games } = await response.json();
    if (!gamesList) {
      return;
    }
    gamesList.innerHTML = "";
    if (games.length === 0) {
      gamesList.innerHTML = "<p>No games created yet. Create one!</p>";
      return;
    }
    gamesList.append(...games.map(renderGame));
  }
  async function createGame() {
    const response = await fetch("/api/games", {
      method: "post",
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
      console.error("Failed to create game");
      return;
    }
    await loadGames();
  }
  createdGameButton?.addEventListener("click", createGame);
  loadGames();
})();
//# sourceMappingURL=lobby.js.map
