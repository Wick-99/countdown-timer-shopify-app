import { useEffect, useState } from "preact/hooks";

function formatParts(ms) {
	if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0 };
	const total = Math.floor(ms / 1000);
	const d = Math.floor(total / 86400);
	const h = Math.floor((total % 86400) / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return { d, h, m, s };
}

function pad(n) {
	return String(n).padStart(2, "0");
}

function useCountdown(endAt) {
	const [remaining, setRemaining] = useState(
		() => new Date(endAt).getTime() - Date.now(),
	);

	useEffect(() => {
		const end = new Date(endAt).getTime();
		const tick = () => setRemaining(end - Date.now());
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [endAt]);

	return remaining;
}

export function Countdown({ endAt }) {
	const remaining = useCountdown(endAt);
	const { d, h, m, s } = formatParts(remaining);

	if (remaining <= 0) {
		return <div className="ct-time">00:00:00</div>;
	}

	// Show days only if > 0
	const display =
		d > 0
			? `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`
			: `${pad(h)}:${pad(m)}:${pad(s)}`;

	return <div className="ct-time">{display}</div>;
}

export { useCountdown };
