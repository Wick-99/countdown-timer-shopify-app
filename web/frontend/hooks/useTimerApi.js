import { useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

/**
 * Hook that returns CRUD methods for the timer API.
 *
 * All fetches go through App Bridge's session token injection — Shopify's
 * authenticatedFetch automatically adds the `Authorization: Bearer <token>`
 * header so `validateAuthenticatedSession` on the backend can pull session.shop.
 */
export function useTimerApi() {
	const app = useAppBridge();

	const request = useCallback(
		async (path, options = {}) => {
			const res = await fetch(path, {
				...options,
				headers: {
					"Content-Type": "application/json",
					...(options.headers || {}),
				},
			});

			// 204 No Content (delete) — no body to parse
			if (res.status === 204) return null;

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				const message =
					data.error ||
					(Array.isArray(data.errors) && data.errors.join(", ")) ||
					`Request failed with status ${res.status}`;
				const error = new Error(message);
				error.status = res.status;
				error.data = data;
				throw error;
			}

			return data;
		},
		[app],
	);

	const listTimers = useCallback(() => request("/api/timers"), [request]);

	const getTimer = useCallback(
		(id) => request(`/api/timers/${id}`),
		[request],
	);

	const createTimer = useCallback(
		(body) =>
			request("/api/timers", {
				method: "POST",
				body: JSON.stringify(body),
			}),
		[request],
	);

	const updateTimer = useCallback(
		(id, body) =>
			request(`/api/timers/${id}`, {
				method: "PUT",
				body: JSON.stringify(body),
			}),
		[request],
	);

	const deleteTimer = useCallback(
		(id) => request(`/api/timers/${id}`, { method: "DELETE" }),
		[request],
	);

	return { listTimers, getTimer, createTimer, updateTimer, deleteTimer };
}
