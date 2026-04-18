import { useCallback, useEffect, useState } from "react";
import {
	Page,
	Card,
	Text,
	BlockStack,
	InlineStack,
	Spinner,
	Banner,
	Button,
	Toast,
	Frame,
} from "@shopify/polaris";
import { useTimerApi } from "../hooks/useTimerApi";
import { TimerCard } from "../components/TimerCard";
import { TimerEmptyState } from "../components/TimerEmptyState";
import { TimerFormModal } from "../components/TimerFormModal";

export default function HomePage() {
	const api = useTimerApi();
	const { listTimers, deleteTimer } = api;
	const [timers, setTimers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [toast, setToast] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingTimer, setEditingTimer] = useState(null);

	const loadTimers = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const { timers } = await listTimers();
			setTimers(timers || []);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [listTimers]);

	useEffect(() => {
		loadTimers();
	}, [loadTimers]);

	const handleCreateTimer = useCallback(() => {
		setEditingTimer(null);
		setModalOpen(true);
	}, []);

	const handleEditTimer = useCallback((timer) => {
		setEditingTimer(timer);
		setModalOpen(true);
	}, []);

	const handleModalSaved = useCallback(
		(message) => {
			setToast({ content: message, error: false });
			loadTimers();
		},
		[loadTimers],
	);

	const handleDeleteTimer = useCallback(
		async (timer) => {
			if (!window.confirm(`Delete "${timer.name}"? This cannot be undone.`))
				return;
			try {
				await deleteTimer(timer._id);
				setToast({ content: "Timer deleted", error: false });
				loadTimers();
			} catch (err) {
				setToast({ content: err.message, error: true });
			}
		},
		[deleteTimer, loadTimers],
	);

	const renderContent = () => {
		if (loading) {
			return (
				<Card>
					<BlockStack inlineAlign="center" gap="200">
						<Spinner size="small" />
						<Text as="p" tone="subdued">
							Loading timers…
						</Text>
					</BlockStack>
				</Card>
			);
		}

		if (error) {
			return (
				<Banner
					tone="critical"
					title="Failed to load timers"
					onDismiss={() => setError(null)}>
					<p>{error}</p>
				</Banner>
			);
		}

		if (timers.length === 0) {
			return <TimerEmptyState onCreateTimer={handleCreateTimer} />;
		}

		return (
			<BlockStack gap="300">
				{timers.map((timer) => (
					<TimerCard
						key={timer._id}
						timer={timer}
						onEdit={handleEditTimer}
						onDelete={handleDeleteTimer}
					/>
				))}
			</BlockStack>
		);
	};

	return (
		<Frame>
			<Page
				title="Countdown Timer Manager"
				subtitle="Create and manage countdown timers for your promotions"
				primaryAction={{
					content: "Create timer",
					onAction: handleCreateTimer,
				}}>
				{renderContent()}
			</Page>
			<TimerFormModal
				open={modalOpen}
				editingTimer={editingTimer}
				onClose={() => setModalOpen(false)}
				onSaved={handleModalSaved}
				api={api}
			/>
			{toast && (
				<Toast
					content={toast.content}
					error={toast.error}
					onDismiss={() => setToast(null)}
				/>
			)}
		</Frame>
	);
}
