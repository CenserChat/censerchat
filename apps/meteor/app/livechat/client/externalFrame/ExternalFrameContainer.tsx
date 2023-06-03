import React, { useMemo } from 'react';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { encrypt, getKeyFromString } from './crypto';
import { useRoom } from '../../../../client/views/room/contexts/RoomContext';
import { sdk } from '../../../utils/client/lib/SDKClient';

const ExternalFrameContainer = () => {
	const uid = useUserId();
	const room = useRoom();
	const { 'X-Auth-Token': authToken } = sdk.rest.getCredentials() || {};
	const keyStr = useSetting<string>('Omnichannel_External_Frame_Encryption_JWK');
	const frameURLSetting = useSetting<string>('Omnichannel_External_Frame_URL');

	const token = useQuery(['externalFrame', keyStr, authToken], async () => {
		if (!keyStr || !authToken) {
			return '';
		}
		return encrypt(authToken, await getKeyFromString(keyStr));
	});

	const externalFrameUrl = useMemo(() => {
		if (!frameURLSetting || !uid || !room._id || !authToken || !token.data) {
			return '';
		}
		const frameURL = new URL(frameURLSetting);

		frameURL.searchParams.append('uid', uid);
		frameURL.searchParams.append('rid', room._id);
		frameURL.searchParams.append('t', authToken);

		return frameURL.toString();
	}, [frameURLSetting, uid, room._id, authToken, token.data]);

	if (!externalFrameUrl) {
		return null;
	}

	return (
		<div className='flex-nav'>
			<iframe className='external-frame' src={externalFrameUrl} />
		</div>
	);
};

export default ExternalFrameContainer;
