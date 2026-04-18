export const styles = `
.ct-root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  line-height: 1.4;
}
.ct-root * { box-sizing: border-box; }

.ct-root--small { padding: 12px; font-size: 12px; }
.ct-root--medium { padding: 16px; font-size: 14px; }
.ct-root--large { padding: 24px; font-size: 18px; }

.ct-label {
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 4px;
  opacity: 0.85;
}
.ct-description {
  margin-bottom: 8px;
  opacity: 0.9;
}
.ct-time {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1.75em;
  letter-spacing: 0.04em;
}

.ct-root--urgent.ct-root--pulse {
  animation: ct-pulse 1s ease-in-out infinite;
}
@keyframes ct-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.03); opacity: 0.9; }
}

.ct-banner {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,0.2);
  border: 1px solid currentColor;
  font-weight: 600;
}
`;

export function injectStyles() {
	if (document.getElementById("ct-widget-styles")) return;
	const el = document.createElement("style");
	el.id = "ct-widget-styles";
	el.textContent = styles;
	document.head.appendChild(el);
}
