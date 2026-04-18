import express from "express";
import Timer from "../models/Timer.js";
import { validateTimerBody } from "../middleware/validateTimer.js";

const router = express.Router();

// Helper — reads shop from Shopify session injected by auth middleware
function getShop(res) {
	const shop = res.locals?.shopify?.session?.shop;
	if (!shop) {
		throw new Error("No shop on session");
	}
	return shop;
}

// GET /api/timers — list all timers for the current shop
router.get("/", async (req, res) => {
	try {
		const shop = getShop(res);
		const timers = await Timer.find({ shop }).sort({ createdAt: -1 }).lean();
		res.json({ timers });
	} catch (err) {
		console.error("[GET /api/timers]", err);
		res.status(500).json({ error: "Failed to fetch timers" });
	}
});

// GET /api/timers/:id — single timer
router.get("/:id", async (req, res) => {
	try {
		const shop = getShop(res);
		const timer = await Timer.findOne({ _id: req.params.id, shop }).lean();
		if (!timer) return res.status(404).json({ error: "Timer not found" });
		res.json({ timer });
	} catch (err) {
		console.error("[GET /api/timers/:id]", err);
		res.status(500).json({ error: "Failed to fetch timer" });
	}
});

// POST /api/timers — create
router.post("/", validateTimerBody, async (req, res) => {
	try {
		const shop = getShop(res);
		const timer = await Timer.create({ ...req.body, shop });
		res.status(201).json({ timer });
	} catch (err) {
		console.error("[POST /api/timers]", err);
		if (err.name === "ValidationError") {
			return res.status(400).json({ error: err.message });
		}
		res.status(500).json({ error: "Failed to create timer" });
	}
});

// PUT /api/timers/:id — update
router.put("/:id", validateTimerBody, async (req, res) => {
	try {
		const shop = getShop(res);
		// Strip shop from body to prevent tenancy tampering
		const { shop: _, ...updateData } = req.body;
		const timer = await Timer.findOneAndUpdate(
			{ _id: req.params.id, shop },
			updateData,
			{ new: true, runValidators: true },
		);
		if (!timer) return res.status(404).json({ error: "Timer not found" });
		res.json({ timer });
	} catch (err) {
		console.error("[PUT /api/timers/:id]", err);
		if (err.name === "ValidationError") {
			return res.status(400).json({ error: err.message });
		}
		res.status(500).json({ error: "Failed to update timer" });
	}
});

// DELETE /api/timers/:id
router.delete("/:id", async (req, res) => {
	try {
		const shop = getShop(res);
		const result = await Timer.findOneAndDelete({ _id: req.params.id, shop });
		if (!result) return res.status(404).json({ error: "Timer not found" });
		res.status(204).end();
	} catch (err) {
		console.error("[DELETE /api/timers/:id]", err);
		res.status(500).json({ error: "Failed to delete timer" });
	}
});

export default router;
