import { ContextualbarAction } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { memo } from 'react';

type ContextualbarCloseProps = Partial<ComponentProps<typeof ContextualbarAction>>;

const ContextualbarClose = (props: ContextualbarCloseProps): ReactElement => {
	const t = useTranslation();
	return <ContextualbarAction data-qa='ContextualbarActionClose' {...props} title={t('Close')} name='cross' />;
};

export default memo(ContextualbarClose);
