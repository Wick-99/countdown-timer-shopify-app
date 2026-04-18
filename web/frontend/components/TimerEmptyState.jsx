import { Card, EmptyState } from "@shopify/polaris";
import { notFoundImage } from "../assets";

export function TimerEmptyState({ onCreateTimer }) {
	return (
		<Card>
			<EmptyState
				heading="Create your first countdown timer"
				action={{
					content: "Create timer",
					onAction: onCreateTimer,
				}}
				image={notFoundImage}>
				<p>
					Drive urgency on your product pages by scheduling promotions with
					a visible countdown.
				</p>
			</EmptyState>
		</Card>
	);
}
