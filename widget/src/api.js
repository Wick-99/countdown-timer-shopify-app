export async function fetchActiveTimer({ apiUrl, shop, productId }) {
	if (!apiUrl || !shop || apiUrl.includes("example.com")) {
		return null;
	}

	try {
		const url = new URL(
			`${apiUrl.replace(/\/$/, "")}/api/public/timers/active`,
		);
		url.searchParams.set("shop", shop);
		if (productId) url.searchParams.set("productId", productId);

		const res = await fetch(url.toString(), { credentials: "omit" });
		if (!res.ok) return null;

		const data = await res.json();
		return data.timer || null;
	} catch (err) {
		console.warn("[countdown-timer] fetch failed:", err);
		return null;
	}
}
