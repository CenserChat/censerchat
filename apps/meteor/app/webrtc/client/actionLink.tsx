import type { IMessage } from '@rocket.chat/core-typings';

import { actionLinks } from '../../../client/lib/actionLinks';
import { ChatRoom } from '../../models/client';
import { Notifications } from '../../notifications/client';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { t } from '../../utils/lib/i18n';
import { sdk } from '../../utils/client/lib/SDKClient';

actionLinks.register('joinLivechatWebRTCCall', (message: IMessage) => {
	const room = ChatRoom.findOne({ _id: message.rid });
	if (!room) {
		throw new Error('Room not found');
	}
	const { callStatus, _id } = room;
	if (callStatus === 'declined' || callStatus === 'ended') {
		dispatchToastMessage({ type: 'info', message: t('Call_Already_Ended') });
		return;
	}
	window.open(`/meet/${_id}`, _id);
});

actionLinks.register('endLivechatWebRTCCall', async (message: IMessage) => {
	const room = ChatRoom.findOne({ _id: message.rid });
	if (!room) {
		throw new Error('Room not found');
	}
	const { callStatus, _id } = room;
	if (callStatus === 'declined' || callStatus === 'ended') {
		dispatchToastMessage({ type: 'info', message: t('Call_Already_Ended') });
		return;
	}
	await sdk.rest.put(`/v1/livechat/webrtc.call/${message._id}`, { rid: _id, status: 'ended' });
	Notifications.notifyRoom(_id, 'webrtc' as any, 'callStatus', { callStatus: 'ended' });
});
