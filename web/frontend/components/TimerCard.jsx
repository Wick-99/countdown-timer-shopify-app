import {
	Card,
	Text,
	BlockStack,
	InlineStack,
	Badge,
	Button,
	Popover,
	ActionList,
	Box,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

function getStatus(timer) {
	const now = new Date();
	const start = new Date(timer.startAt);
	const end = new Date(timer.endAt);

	if (!timer.enabled) return { label: "Disabled", tone: "subdued" };
	if (now < start) return { label: "Scheduled", tone: "info" };
	if (now >= start && now <= end) return { label: "Live", tone: "success" };
	return { label: "Ended", tone: "subdued" };
}

function formatDate(iso) {
	return new Date(iso).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function TimerCard({ timer, onEdit, onDelete }) {
	const [menuActive, setMenuActive] = useState(false);
	const status = getStatus(timer);

	const toggleMenu = useCallback(() => setMenuActive((v) => !v), []);

	const menuActivator = (
		<Button
			variant="tertiary"
			onClick={toggleMenu}
			accessibilityLabel="More actions">
			…
		</Button>
	);

	return (
		<Card>
			<InlineStack
				wrap={false}
				align="space-between"
				blockAlign="start"
				gap="400">
				<Box minWidth="0">
					<BlockStack gap="100">
						<InlineStack gap="200" blockAlign="center">
							<Text as="h3" variant="headingMd">
								{timer.name}
							</Text>
							<Badge tone={status.tone}>{status.label}</Badge>
						</InlineStack>

						{timer.promotionDescription && (
							<Text as="p" tone="subdued">
								{timer.promotionDescription}
							</Text>
						)}

						<Text as="p" tone="subdued" variant="bodySm">
							Start: {formatDate(timer.startAt)} · End:{" "}
							{formatDate(timer.endAt)}
						</Text>
					</BlockStack>
				</Box>

				<Popover
					active={menuActive}
					activator={menuActivator}
					onClose={toggleMenu}
					preferredAlignment="right">
					<ActionList
						actionRole="menuitem"
						items={[
							{
								content: "Edit",
								onAction: () => {
									toggleMenu();
									onEdit(timer);
								},
							},
							{
								content: "Delete",
								destructive: true,
								onAction: () => {
									toggleMenu();
									onDelete(timer);
								},
							},
						]}
					/>
				</Popover>
			</InlineStack>
		</Card>
	);
}
