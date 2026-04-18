export function validateTimerBody(req, res, next) {
	const { name, startAt, endAt } = req.body;
	const errors = [];

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		errors.push("name is required");
	}
	if (!startAt || isNaN(Date.parse(startAt))) {
		errors.push("startAt must be a valid ISO date");
	}
	if (!endAt || isNaN(Date.parse(endAt))) {
		errors.push("endAt must be a valid ISO date");
	}
	if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
		errors.push("endAt must be after startAt");
	}

	if (errors.length > 0) {
		return res.status(400).json({ errors });
	}
	next();
}
