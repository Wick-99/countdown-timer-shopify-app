import { Modal, Text, BlockStack } from "@shopify/polaris";

export function DeleteConfirmModal({
	open,
	timer,
	onConfirm,
	onClose,
	loading,
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Delete timer?"
			primaryAction={{
				content: "Delete timer",
				destructive: true,
				loading,
				onAction: onConfirm,
			}}
			secondaryActions={[
				{
					content: "Cancel",
					onAction: onClose,
					disabled: loading,
				},
			]}>
			<Modal.Section>
				<BlockStack gap="200">
					<Text as="p">
						Are you sure you want to delete{" "}
						<Text as="span" fontWeight="semibold">
							{timer?.name}
						</Text>
						?
					</Text>
					<Text as="p" tone="subdued">
						This action cannot be undone. The timer will be removed from
						all product pages immediately.
					</Text>
				</BlockStack>
			</Modal.Section>
		</Modal>
	);
}
