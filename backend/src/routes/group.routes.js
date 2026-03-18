import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { addMembers, createGroup, getGroup, listGroups } from "../services/groupService.js";

export const groupRouter = Router();

groupRouter.use(requireAuth);

groupRouter.get("/", async (req, res, next) => {
  try {
    const groups = await listGroups(req.user.id);
    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

groupRouter.post("/", async (req, res, next) => {
  try {
    const group = await createGroup(req.body, req.user.id);
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

groupRouter.get("/:groupId", async (req, res, next) => {
  try {
    const group = await getGroup(req.params.groupId, req.user.id);
    res.json({ group });
  } catch (err) {
    next(err);
  }
});

groupRouter.post("/:groupId/members", async (req, res, next) => {
  try {
    const group = await addMembers(req.params.groupId, req.body, req.user.id);
    res.json({ group });
  } catch (err) {
    next(err);
  }
});

