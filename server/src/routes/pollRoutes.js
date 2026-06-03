import { Router } from "express";
import { getPoll, handleError, listPolls, savePoll } from "../controllers/pollController.js";

const router = Router();

router.get("/", listPolls);
router.get("/:pollId", getPoll);
router.post("/", savePoll);
router.put("/:pollId", savePoll);

router.use(handleError);

export default router;
