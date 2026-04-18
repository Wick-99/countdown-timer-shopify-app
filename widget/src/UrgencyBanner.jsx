export function UrgencyBanner({ triggerMinutes }) {
	return (
		<div className="ct-banner">
			⏳ Less than {triggerMinutes} minute{triggerMinutes === 1 ? "" : "s"}{" "}
			left!
		</div>
	);
}
