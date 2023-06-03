import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

const EmojiPickerFooter = (props: Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>) => {
	return (
		<Box
			{...props}
			bg='neutral'
			display='flex'
			flexDirection='column'
			alignItems='center'
			color='secondary-info'
			fontScale='micro'
			pb='x8'
		/>
	);
};

export default EmojiPickerFooter;
