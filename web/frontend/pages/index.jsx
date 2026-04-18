import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Page,
	Card,
	Text,
	BlockStack,
	InlineStack,
	InlineGrid,
	Spinner,
	Banner,
	Button,
	Toast,
	Frame,
	TextField,
	Select,
	Icon,
	Box,
} from "@shopify/polaris";
import { useTimerApi } from "../hooks/useTimerApi";
import { TimerCard } from "../components/TimerCard";
import { TimerEmptyState } from "../components/TimerEmptyState";
import { TimerFormModal } from "../components/TimerFormModal";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { SearchIcon } from "@shopify/polaris-icons";

export default function HomePage() {
	const api = useTimerApi();
	const { listTimers, deleteTimer } = api;
	const [timers, setTimers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [toast, setToast] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingTimer, setEditingTimer] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState("date_desc");

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

	const handleDeleteTimer = useCallback((timer) => {
		setDeleteTarget(timer);
	}, []);

	const confirmDelete = useCallback(async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await deleteTimer(deleteTarget._id);
			setToast({ content: "Timer deleted", error: false });
			setDeleteTarget(null);
			loadTimers();
		} catch (err) {
			setToast({ content: err.message, error: true });
		} finally {
			setDeleting(false);
		}
	}, [deleteTarget, deleteTimer, loadTimers]);

	const visibleTimers = useMemo(() => {
		let list = timers;

		// Search filter
		const q = searchQuery.trim().toLowerCase();
		if (q) {
			list = list.filter(
				(t) =>
					t.name.toLowerCase().includes(q) ||
					(t.promotionDescription || "").toLowerCase().includes(q),
			);
		}

		// Sort
		list = [...list].sort((a, b) => {
			const aStart = new Date(a.startAt).getTime();
			const bStart = new Date(b.startAt).getTime();
			switch (sortBy) {
				case "date_asc":
					return aStart - bStart;
				case "date_desc":
					return bStart - aStart;
				case "name_asc":
					return a.name.localeCompare(b.name);
				case "name_desc":
					return b.name.localeCompare(a.name);
				default:
					return 0;
			}
		});

		return list;
	}, [timers, searchQuery, sortBy]);

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

		if (timers.length > 0 && visibleTimers.length === 0) {
			return (
				<Card>
					<BlockStack gap="200" inlineAlign="center">
						<Text as="p" tone="subdued">
							No timers match your search.
						</Text>
					</BlockStack>
				</Card>
			);
		}

		return (
			<BlockStack gap="300">
				{visibleTimers.map((timer) => (
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
				{timers.length > 0 && (
					<Box paddingBlockEnd="400">
						<InlineGrid columns={{ xs: 1, md: "2fr 1fr" }} gap="300">
							<TextField
								label=""
								labelHidden
								value={searchQuery}
								onChange={setSearchQuery}
								placeholder="Search timers"
								prefix={<Icon source={SearchIcon} tone="subdued" />}
								clearButton
								onClearButtonClick={() => setSearchQuery("")}
								autoComplete="off"
							/>
							<Select
								label=""
								labelHidden
								options={[
									{ label: "Date (newest first)", value: "date_desc" },
									{ label: "Date (oldest first)", value: "date_asc" },
									{ label: "Name (A–Z)", value: "name_asc" },
									{ label: "Name (Z–A)", value: "name_desc" },
								]}
								value={sortBy}
								onChange={setSortBy}
							/>
						</InlineGrid>
					</Box>
				)}
				{renderContent()}
			</Page>
			<TimerFormModal
				open={modalOpen}
				editingTimer={editingTimer}
				onClose={() => setModalOpen(false)}
				onSaved={handleModalSaved}
				api={api}
			/>
			<DeleteConfirmModal
				open={Boolean(deleteTarget)}
				timer={deleteTarget}
				onConfirm={confirmDelete}
				onClose={() => !deleting && setDeleteTarget(null)}
				loading={deleting}
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
