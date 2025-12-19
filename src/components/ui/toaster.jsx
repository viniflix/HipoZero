import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

export function Toaster({ position = "bottom-right" }) {
	const { toasts } = useToast();

	// Map position to className (override default positioning)
	const positionClasses = {
		'top-center': '!top-4 !left-1/2 !-translate-x-1/2 !right-auto !bottom-auto',
		'top-right': '!top-4 !right-4 !left-auto !bottom-auto',
		'top-left': '!top-4 !left-4 !right-auto !bottom-auto',
		'bottom-center': '!bottom-4 !left-1/2 !-translate-x-1/2 !right-auto !top-auto',
		'bottom-right': '!bottom-4 !right-4 !left-auto !top-auto',
		'bottom-left': '!bottom-4 !left-4 !right-auto !top-auto',
	};

	const viewportClassName = positionClasses[position] || positionClasses['bottom-right'];

	return (
		<ToastProvider>
			{toasts.map(({ id, title, description, action, ...props }) => {
				return (
					<Toast key={id} {...props}>
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport className={viewportClassName} />
		</ToastProvider>
	);
}