import { Router } from "express";
import Games from "../db/games.js";

const router = Router();

router.get("/", async (_request, response) => {
  const games = await Games.list();

  response.json({ games });
});

router.post("/", async (request, response) => {
  const userId = request.session.user?.id;

  if (!userId) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const game = await Games.create(userId);

  response.json(game);
});

export default router;
