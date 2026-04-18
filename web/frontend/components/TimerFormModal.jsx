import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Modal,
	FormLayout,
	TextField,
	Select,
	ColorPicker,
	DatePicker,
	BlockStack,
	InlineGrid,
	Text,
	Banner,
	Box,
	Popover,
	Button,
} from "@shopify/polaris";

// ── helpers ──────────────────────────────────────────────────────────────

function splitDateTime(iso) {
	if (!iso) return { date: "", time: "" };
	const d = new Date(iso);
	if (isNaN(d)) return { date: "", time: "" };
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const mi = String(d.getMinutes()).padStart(2, "0");
	return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

function combineDateTime(dateStr, timeStr) {
	if (!dateStr || !timeStr) return null;
	const iso = new Date(`${dateStr}T${timeStr}:00`);
	if (isNaN(iso)) return null;
	return iso.toISOString();
}

// HSB ↔ hex (Polaris ColorPicker uses HSB)
function hsbToHex({ hue, saturation, brightness }) {
	const c = brightness * saturation;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = brightness - c;
	let r = 0,
		g = 0,
		b = 0;
	if (hue < 60) [r, g, b] = [c, x, 0];
	else if (hue < 120) [r, g, b] = [x, c, 0];
	else if (hue < 180) [r, g, b] = [0, c, x];
	else if (hue < 240) [r, g, b] = [0, x, c];
	else if (hue < 300) [r, g, b] = [x, 0, c];
	else [r, g, b] = [c, 0, x];
	const toHex = (n) =>
		Math.round((n + m) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsb(hex) {
	if (!hex || !/^#[0-9A-F]{6}$/i.test(hex))
		return { hue: 0, saturation: 0, brightness: 0 };
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	let hue = 0;
	if (delta !== 0) {
		if (max === r) hue = ((g - b) / delta) % 6;
		else if (max === g) hue = (b - r) / delta + 2;
		else hue = (r - g) / delta + 4;
		hue *= 60;
		if (hue < 0) hue += 360;
	}
	const saturation = max === 0 ? 0 : delta / max;
	return { hue, saturation, brightness: max };
}

// ── DateTimeField subcomponent ───────────────────────────────────────────

function DateTimeField({
	label,
	date,
	time,
	onDateChange,
	onTimeChange,
	error,
}) {
	const [popoverActive, setPopoverActive] = useState(false);
	const [{ month, year }, setVisibleMonth] = useState(() => {
		const d = date ? new Date(date) : new Date();
		return { month: d.getMonth(), year: d.getFullYear() };
	});

	const selectedDate = date ? new Date(`${date}T00:00:00`) : null;

	const handleMonthChange = useCallback((newMonth, newYear) => {
		setVisibleMonth({ month: newMonth, year: newYear });
	}, []);

	const handleDateSelect = useCallback(
		({ start }) => {
			const yyyy = start.getFullYear();
			const mm = String(start.getMonth() + 1).padStart(2, "0");
			const dd = String(start.getDate()).padStart(2, "0");
			onDateChange(`${yyyy}-${mm}-${dd}`);
			setPopoverActive(false);
		},
		[onDateChange],
	);

	const activator = (
		<TextField
			label={label}
			value={date}
			placeholder="mm/dd/yyyy"
			onFocus={() => setPopoverActive(true)}
			autoComplete="off"
			error={error}
		/>
	);

	return (
		<InlineGrid columns={2} gap="300">
			<Popover
				active={popoverActive}
				activator={activator}
				onClose={() => setPopoverActive(false)}
				preferredAlignment="left">
				<Box padding="300">
					<DatePicker
						month={month}
						year={year}
						selected={
							selectedDate
								? { start: selectedDate, end: selectedDate }
								: undefined
						}
						onChange={handleDateSelect}
						onMonthChange={handleMonthChange}
					/>
				</Box>
			</Popover>
			<TextField
				label={`${label === "Start date" ? "Start" : "End"} time`}
				type="time"
				value={time}
				onChange={onTimeChange}
				autoComplete="off"
			/>
		</InlineGrid>
	);
}

// ── Main modal ───────────────────────────────────────────────────────────

const INITIAL_STATE = {
	name: "",
	startDate: "",
	startTime: "",
	endDate: "",
	endTime: "",
	promotionDescription: "",
	color: "#000000",
	size: "medium",
	position: "top",
	urgencyType: "color_pulse",
};

export function TimerFormModal({ open, editingTimer, onClose, onSaved, api }) {
	const isEdit = Boolean(editingTimer);

	const [form, setForm] = useState(INITIAL_STATE);
	const [colorPickerActive, setColorPickerActive] = useState(false);
	const [hsbColor, setHsbColor] = useState(() =>
		hexToHsb(INITIAL_STATE.color),
	);
	const [errors, setErrors] = useState({});
	const [submitError, setSubmitError] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	// Prefill when editing; reset when creating or closing
	useEffect(() => {
		if (!open) return;
		if (editingTimer) {
			const start = splitDateTime(editingTimer.startAt);
			const end = splitDateTime(editingTimer.endAt);
			const next = {
				name: editingTimer.name || "",
				startDate: start.date,
				startTime: start.time,
				endDate: end.date,
				endTime: end.time,
				promotionDescription: editingTimer.promotionDescription || "",
				color: editingTimer.display?.color || "#000000",
				size: editingTimer.display?.size || "medium",
				position: editingTimer.display?.position || "top",
				urgencyType: editingTimer.urgency?.type || "color_pulse",
			};
			setForm(next);
			setHsbColor(hexToHsb(next.color));
		} else {
			setForm(INITIAL_STATE);
			setHsbColor(hexToHsb(INITIAL_STATE.color));
		}
		setErrors({});
		setSubmitError(null);
	}, [open, editingTimer]);

	const setField = (key) => (value) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const handleColorChange = useCallback((newHsb) => {
		setHsbColor(newHsb);
		setForm((prev) => ({ ...prev, color: hsbToHex(newHsb) }));
	}, []);

	const validate = () => {
		const next = {};
		if (!form.name.trim()) next.name = "Timer name is required";
		if (!form.startDate || !form.startTime)
			next.startDate = "Start date and time are required";
		if (!form.endDate || !form.endTime)
			next.endDate = "End date and time are required";
		if (form.startDate && form.endDate && form.startTime && form.endTime) {
			const startIso = combineDateTime(form.startDate, form.startTime);
			const endIso = combineDateTime(form.endDate, form.endTime);
			if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
				next.endDate = "End must be after start";
			}
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async () => {
		setSubmitError(null);
		if (!validate()) return;
		setSubmitting(true);
		try {
			const body = {
				name: form.name.trim(),
				startAt: combineDateTime(form.startDate, form.startTime),
				endAt: combineDateTime(form.endDate, form.endTime),
				promotionDescription: form.promotionDescription.trim(),
				display: {
					color: form.color,
					size: form.size,
					position: form.position,
				},
				urgency: { type: form.urgencyType, triggerMinutes: 5 },
				scope: { type: "all_products" },
				enabled: true,
			};

			if (isEdit) {
				await api.updateTimer(editingTimer._id, body);
			} else {
				await api.createTimer(body);
			}
			onSaved(isEdit ? "Timer updated" : "Timer created");
			onClose();
		} catch (err) {
			setSubmitError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	const colorSwatch = useMemo(
		() => (
			<Button
				onClick={() => setColorPickerActive((v) => !v)}
				disclosure
				accessibilityLabel="Pick a color">
				<span
					style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
					<span
						style={{
							display: "inline-block",
							width: 16,
							height: 16,
							borderRadius: 4,
							backgroundColor: form.color,
							border: "1px solid #c9cccf",
						}}
					/>
					{form.color}
				</span>
			</Button>
		),
		[form.color],
	);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title={isEdit ? "Edit timer" : "Create New Timer"}
			primaryAction={{
				content: isEdit ? "Save changes" : "Create timer",
				onAction: handleSubmit,
				loading: submitting,
			}}
			secondaryActions={[
				{ content: "Cancel", onAction: onClose, disabled: submitting },
			]}>
			<Modal.Section>
				<BlockStack gap="400">
					{submitError && (
						<Banner
							tone="critical"
							onDismiss={() => setSubmitError(null)}>
							<p>{submitError}</p>
						</Banner>
					)}

					<FormLayout>
						<TextField
							label="Timer name"
							value={form.name}
							onChange={setField("name")}
							autoComplete="off"
							requiredIndicator
							error={errors.name}
							placeholder="Enter timer name"
						/>

						<DateTimeField
							label="Start date"
							date={form.startDate}
							time={form.startTime}
							onDateChange={setField("startDate")}
							onTimeChange={setField("startTime")}
							error={errors.startDate}
						/>

						<DateTimeField
							label="End date"
							date={form.endDate}
							time={form.endTime}
							onDateChange={setField("endDate")}
							onTimeChange={setField("endTime")}
							error={errors.endDate}
						/>

						<TextField
							label="Promotion description"
							value={form.promotionDescription}
							onChange={setField("promotionDescription")}
							multiline={3}
							autoComplete="off"
							placeholder="Enter promotion details"
						/>

						<BlockStack gap="200">
							<Text as="p" variant="bodyMd">
								Color
							</Text>
							<Popover
								active={colorPickerActive}
								activator={colorSwatch}
								onClose={() => setColorPickerActive(false)}>
								<Box padding="300">
									<ColorPicker
										color={hsbColor}
										onChange={handleColorChange}
									/>
								</Box>
							</Popover>
						</BlockStack>

						<InlineGrid columns={2} gap="300">
							<Select
								label="Timer size"
								options={[
									{ label: "Small", value: "small" },
									{ label: "Medium", value: "medium" },
									{ label: "Large", value: "large" },
								]}
								value={form.size}
								onChange={setField("size")}
							/>
							<Select
								label="Timer position"
								options={[
									{ label: "Top", value: "top" },
									{ label: "Inline", value: "inline" },
									{ label: "Bottom", value: "bottom" },
								]}
								value={form.position}
								onChange={setField("position")}
							/>
						</InlineGrid>

						<Select
							label="Urgency notification"
							options={[
								{ label: "Color pulse", value: "color_pulse" },
								{ label: "Banner", value: "banner" },
								{ label: "None", value: "none" },
							]}
							value={form.urgencyType}
							onChange={setField("urgencyType")}
						/>
					</FormLayout>
				</BlockStack>
			</Modal.Section>
		</Modal>
	);
}
