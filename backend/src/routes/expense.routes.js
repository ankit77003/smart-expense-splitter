import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { addExpense, listExpenses } from "../services/expenseService.js";
import { getSettlement } from "../services/settlementService.js";

export const expenseRouter = Router();

expenseRouter.use(requireAuth);

expenseRouter.get("/:groupId/expenses", async (req, res, next) => {
  try {
    const expenses = await listExpenses(req.params.groupId, req.user.id);
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
});

expenseRouter.post("/:groupId/expenses", async (req, res, next) => {
  try {
    const expense = await addExpense(req.params.groupId, req.body, req.user.id);
    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
});

expenseRouter.get("/:groupId/settlement", async (req, res, next) => {
  try {
    const result = await getSettlement(req.params.groupId, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

