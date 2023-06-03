import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, MouseEventHandler } from 'react';
import React, { memo } from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarAction,
	ContextualbarContent,
	ContextualbarFooter,
} from '../../../../../../client/components/Contextualbar';
import { useScopeDict } from '../../../hooks/useScopeDict';

const CannedResponse: FC<{
	canEdit: boolean;
	data: {
		departmentName: ILivechatDepartment['name'];
		shortcut: IOmnichannelCannedResponse['shortcut'];
		text: IOmnichannelCannedResponse['text'];
		scope: IOmnichannelCannedResponse['scope'];
		tags: IOmnichannelCannedResponse['tags'];
	};
	onClickBack: MouseEventHandler<HTMLOrSVGElement>;
	onClickEdit: MouseEventHandler<HTMLOrSVGElement>;
	onClickUse: MouseEventHandler<HTMLOrSVGElement>;
}> = ({ canEdit, data: { departmentName, shortcut, text, scope: dataScope, tags }, onClickBack, onClickEdit, onClickUse }) => {
	const t = useTranslation();
	const scope = useScopeDict(dataScope, departmentName);

	return (
		<Contextualbar color='default' display='flex' flexDirection='column' width='full' overflow='hidden' zIndex={100} insetBlock={0}>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarAction onClick={onClickBack} title={t('Back_to_threads')} name='arrow-back' />}
				<ContextualbarTitle>!{shortcut}</ContextualbarTitle>
			</ContextualbarHeader>
			<ContextualbarContent>
				<Box pb='24px'>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Shortcut')}:
						</Box>
						<Box fontScale='c1' color='hint'>
							!{shortcut}
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Content')}:
						</Box>
						<Box fontScale='c1' color='hint'>
							"{text}"
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Sharing')}:
						</Box>
						<Box fontScale='c1' color='hint'>
							{scope}
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Tags')}:
						</Box>
						<Box display='flex' flexDirection='row'>
							{tags && tags.length > 0 ? (
								<Box display='flex' w='full' flexDirection='row' mbs='8px' flexWrap='wrap'>
									{tags.map((tag: string, idx: number) => (
										<Box key={idx} mie='4px' mbe='4px'>
											<Tag>{tag}</Tag>
										</Box>
									))}
								</Box>
							) : (
								'-'
							)}
						</Box>
					</Box>
				</Box>
			</ContextualbarContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{canEdit && <Button onClick={onClickEdit}>{t('Edit')}</Button>}
					<Button primary onClick={onClickUse}>
						{t('Use')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</Contextualbar>
	);
};

export default memo(CannedResponse);
