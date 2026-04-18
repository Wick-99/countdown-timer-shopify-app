import { h, render } from "preact";
import { Widget } from "./Widget.jsx";
import { fetchActiveTimer } from "./api.js";
import { injectStyles } from "./styles.js";

function initOne(container) {
	if (container.dataset.ctMounted === "true") return;
	container.dataset.ctMounted = "true";

	const apiUrl = container.dataset.apiUrl;
	const shop = container.dataset.shop;
	const productId = container.dataset.productId;

	fetchActiveTimer({ apiUrl, shop, productId })
		.then((timer) => {
			if (!timer) return; // no active timer, render nothing
			injectStyles();
			render(<Widget timer={timer} />, container);
		})
		.catch((err) => {
			console.warn("[countdown-timer] init failed:", err);
		});
}

function initAll() {
	const containers = document.querySelectorAll(".countdown-timer-root");
	containers.forEach(initOne);
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initAll);
} else {
	initAll();
}
