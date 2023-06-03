import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Modal, Skeleton } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useLayoutContextualBarExpanded, useToastMessageDispatch, useTranslation, useUserId } from '@rocket.chat/ui-contexts';
import type { VFC } from 'react';
import React from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarAction,
	ContextualbarActions,
	ContextualbarClose,
	ContextualbarBack,
	ContextualbarInnerContent,
} from '../../../../components/Contextualbar';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import { useGoToThreadList } from '../../hooks/useGoToThreadList';
import ChatProvider from '../../providers/ChatProvider';
import ThreadChat from './components/ThreadChat';
import ThreadSkeleton from './components/ThreadSkeleton';
import ThreadTitle from './components/ThreadTitle';
import { useThreadMainMessageQuery } from './hooks/useThreadMainMessageQuery';
import { useToggleFollowingThreadMutation } from './hooks/useToggleFollowingThreadMutation';

type ThreadProps = {
	tmid: IMessage['_id'];
};

const Thread: VFC<ThreadProps> = ({ tmid }) => {
	const goToThreadList = useGoToThreadList({ replace: true });
	const closeTabBar = useTabBarClose();

	const mainMessageQueryResult = useThreadMainMessageQuery(tmid, {
		onDelete: () => {
			closeTabBar();
		},
	});

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canExpand = useLayoutContextualBarExpanded();
	const [expanded, setExpanded] = useLocalStorage('expand-threads', false);

	const uid = useUserId();
	const following = uid ? mainMessageQueryResult.data?.replies?.includes(uid) ?? false : false;
	const toggleFollowingMutation = useToggleFollowingThreadMutation({
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleBackdropClick = () => {
		closeTabBar();
	};

	const handleGoBack = () => {
		goToThreadList();
	};

	const handleToggleExpand = () => {
		setExpanded((expanded) => !expanded);
	};

	const handleToggleFollowing = () => {
		const rid = mainMessageQueryResult.data?.rid;

		if (!rid) {
			return;
		}

		toggleFollowingMutation.mutate({ rid, tmid, follow: !following });
	};

	const handleClose = () => {
		closeTabBar();
	};

	return (
		<ContextualbarInnerContent>
			{canExpand && expanded && <Modal.Backdrop onClick={handleBackdropClick} />}
			<Box flexGrow={1} position={expanded ? 'static' : 'relative'}>
				<Contextualbar
					rcx-thread-view
					className={
						canExpand && expanded
							? css`
									max-width: 855px !important;
									@media (min-width: 780px) and (max-width: 1135px) {
										max-width: calc(100% - var(--sidebar-width)) !important;
									}
							  `
							: undefined
					}
					position={expanded ? 'fixed' : 'absolute'}
					display='flex'
					flexDirection='column'
					width='full'
					overflow='hidden'
					zIndex={100}
					insetBlock={0}
					border='none'
				>
					<ContextualbarHeader expanded={expanded}>
						<ContextualbarBack onClick={handleGoBack} />
						{(mainMessageQueryResult.isLoading && <Skeleton width='100%' />) ||
							(mainMessageQueryResult.isSuccess && <ThreadTitle mainMessage={mainMessageQueryResult.data} />) ||
							null}
						<ContextualbarActions>
							{canExpand && (
								<ContextualbarAction
									name={expanded ? 'arrow-collapse' : 'arrow-expand'}
									title={expanded ? t('Collapse') : t('Expand')}
									onClick={handleToggleExpand}
								/>
							)}
							<ContextualbarAction
								name={following ? 'bell' : 'bell-off'}
								title={following ? t('Following') : t('Not_Following')}
								disabled={!mainMessageQueryResult.isSuccess || toggleFollowingMutation.isLoading}
								onClick={handleToggleFollowing}
							/>
							<ContextualbarClose onClick={handleClose} />
						</ContextualbarActions>
					</ContextualbarHeader>

					{(mainMessageQueryResult.isLoading && <ThreadSkeleton />) ||
						(mainMessageQueryResult.isSuccess && (
							<ChatProvider tmid={tmid}>
								<ThreadChat mainMessage={mainMessageQueryResult.data} />
							</ChatProvider>
						)) ||
						null}
				</Contextualbar>
			</Box>
		</ContextualbarInnerContent>
	);
};

export default Thread;
