import { IconButton } from '@rocket.chat/fuselage';
import { forwardRef } from 'react';

const ToolBoxAction = forwardRef<HTMLButtonElement, any>(function ToolBoxAction(
	{ id, icon, action, index, title, 'data-tooltip': tooltip, ...props },
	ref,
) {
	return (
		<IconButton
			data-qa-id={`ToolBoxAction-${icon}`}
			ref={ref}
			onClick={() => action(id)}
			data-toolbox={index}
			key={id}
			icon={icon}
			tiny
			position='relative'
			overflow='visible'
			{...(tooltip ? { 'data-tooltip': tooltip, 'title': '' } : { title })}
			{...props}
		/>
	);
});

export default ToolBoxAction;
