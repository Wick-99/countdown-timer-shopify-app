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

.ct-root--align-top,
.ct-root--align-bottom {
  margin-left: auto;
  margin-right: auto;
}
.ct-root--align-inline {
  display: inline-block;
  margin-left: 16px;
  margin-right: 16px;
}

.ct-root--small { padding: 10px; font-size: 12px; max-width: 280px; }
.ct-root--small .ct-time { font-size: 1.5em; }

.ct-root--medium { padding: 18px; font-size: 15px; max-width: 420px; }
.ct-root--medium .ct-time { font-size: 2em; }

.ct-root--large { padding: 28px; font-size: 20px; max-width: 560px; }
.ct-root--large .ct-time { font-size: 2.8em; }

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
