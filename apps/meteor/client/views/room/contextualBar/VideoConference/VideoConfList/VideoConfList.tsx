import type { IGroupVideoConference } from '@rocket.chat/core-typings';
import { Box, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
	ContextualbarSkeleton,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarEmptyContent,
} from '../../../../../components/Contextualbar';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';
import { getErrorMessage } from '../../../../../lib/errorHandling';
import VideoConfListItem from './VideoConfListItem';

type VideoConfListProps = {
	onClose: () => void;
	total: number;
	videoConfs: IGroupVideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: (min: number, max: number) => void;
};

const VideoConfList = ({ onClose, total, videoConfs, loading, error, reload, loadMoreItems }: VideoConfListProps): ReactElement => {
	const t = useTranslation();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	if (loading) {
		return <ContextualbarSkeleton />;
	}

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='phone' />
				<ContextualbarTitle>{t('Calls')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>

			<ContextualbarContent paddingInline={0} ref={ref}>
				{(total === 0 || error) && (
					<Box display='flex' flexDirection='column' justifyContent='center' height='100%'>
						{error && (
							<States>
								<StatesIcon name='circle-exclamation' variation='danger' />
								<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
								<StatesSubtitle>{getErrorMessage(error)}</StatesSubtitle>
							</States>
						)}
						{!error && total === 0 && (
							<ContextualbarEmptyContent
								icon='phone'
								title={t('No_history')}
								subtitle={t('There_is_no_video_conference_history_in_this_room')}
							/>
						)}
					</Box>
				)}
				{videoConfs.length > 0 && (
					<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
						<Virtuoso
							style={{
								height: blockSize,
								width: inlineSize,
							}}
							totalCount={total}
							endReached={(start): unknown => loadMoreItems(start, Math.min(50, total - start))}
							overscan={25}
							data={videoConfs}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(_index, data): ReactElement => <VideoConfListItem videoConfData={data} reload={reload} />}
						/>
					</Box>
				)}
			</ContextualbarContent>
		</>
	);
};

export default VideoConfList;
