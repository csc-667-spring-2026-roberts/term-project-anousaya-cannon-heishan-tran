import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import SSE from "../sse.js";

const router = Router();

router.get("/", requireAuth, (request, response) => {
    const userId = request.session.user!.id;
    const clientId = SSE.addClient(response, userId);

    console.log(`SSE client ${clientId} connected (user ${userId})`);

    request.on("close", () => {
        SSE.removeClient(clientId);
    })
});

export default router;
