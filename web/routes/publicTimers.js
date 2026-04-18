import express from "express";
import Timer from "../models/Timer.js";

const router = express.Router();

// CORS middleware — open to any storefront origin
router.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	if (req.method === "OPTIONS") return res.sendStatus(204);
	next();
});

// GET /api/public/timers/active?shop=xxx.myshopify.com&productId=123
router.get("/timers/active", async (req, res) => {
	try {
		const { shop, productId } = req.query;

		if (!shop || typeof shop !== "string") {
			return res.status(400).json({ error: "shop query param is required" });
		}

		const now = new Date();

		const query = {
			shop,
			enabled: true,
			startAt: { $lte: now },
			endAt: { $gte: now },
		};

		// Find candidates, sorted by endAt ascending (soonest-ending first for urgency)
		const candidates = await Timer.find(query).sort({ endAt: 1 }).lean();

		// Filter by product scope
		const active = candidates.find((t) => {
			if (t.scope?.type === "all_products") return true;
			if (t.scope?.type === "specific_products" && productId) {
				return t.scope.productIds?.includes(String(productId));
			}
			return false;
		});

		if (!active) {
			return res.json({ timer: null });
		}

		// Return only the fields the widget actually needs — no internal data
		res.json({
			timer: {
				id: active._id,
				name: active.name,
				startAt: active.startAt,
				endAt: active.endAt,
				promotionDescription: active.promotionDescription,
				display: active.display,
				urgency: active.urgency,
			},
		});
	} catch (err) {
		console.error("[GET /api/public/timers/active]", err);
		res.status(500).json({ error: "Failed to fetch active timer" });
	}
});

export default router;
