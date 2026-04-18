import { useMemo } from "preact/hooks";
import { Countdown, useCountdown } from "./Countdown.jsx";
import { UrgencyBanner } from "./UrgencyBanner.jsx";

export function Widget({ timer }) {
	const remaining = useCountdown(timer.endAt);

	const { color, size } = timer.display || {};
	const urgencyType = timer.urgency?.type || "none";
	const triggerMinutes = timer.urgency?.triggerMinutes || 5;
	const triggerMs = triggerMinutes * 60 * 1000;
	const isUrgent = remaining > 0 && remaining <= triggerMs;

	const rootClass = useMemo(() => {
		const classes = ["ct-root", `ct-root--${size || "medium"}`];
		if (isUrgent) {
			classes.push("ct-root--urgent");
			if (urgencyType === "color_pulse") classes.push("ct-root--pulse");
		}
		return classes.join(" ");
	}, [size, isUrgent, urgencyType]);

	const rootStyle = {
		color: color || "#000000",
		border: `2px solid ${color || "#000000"}`,
		backgroundColor: "rgba(255,255,255,0.04)",
	};

	if (remaining <= 0) {
		return null; // don't show an ended timer
	}

	return (
		<div className={rootClass} style={rootStyle}>
			{isUrgent && urgencyType === "banner" && (
				<UrgencyBanner triggerMinutes={triggerMinutes} />
			)}
			{timer.promotionDescription && (
				<div className="ct-description">{timer.promotionDescription}</div>
			)}
			<div className="ct-label">Your special offer ends in</div>
			<Countdown endAt={timer.endAt} />
		</div>
	);
}
