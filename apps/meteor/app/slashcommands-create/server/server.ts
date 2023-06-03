import { api } from '@rocket.chat/core-services';
import { Rooms } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { i18n } from '../../../server/lib/i18n';
import { createPrivateGroupMethod } from '../../lib/server/methods/createPrivateGroup';
import { createChannelMethod } from '../../lib/server/methods/createChannel';

slashCommands.add({
	command: 'create',
	callback: async function Create({ params, message, userId }: SlashCommandCallbackParams<'create'>): Promise<void> {
		function getParams(str: string): string[] {
			const regex = /(--(\w+))+/g;
			const result = [];
			let m;
			while ((m = regex.exec(str)) !== null) {
				if (m.index === regex.lastIndex) {
					regex.lastIndex++;
				}
				result.push(m[2]);
			}
			return result;
		}

		const regexp = new RegExp(settings.get('UTF8_Channel_Names_Validation') as string);

		const channel = regexp.exec(params.trim());

		if (!channel) {
			return;
		}

		const channelStr: string = channel ? channel[0] : '';
		if (channelStr === '') {
			return;
		}

		const room = await Rooms.findOneByName(channelStr);
		if (room != null) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Channel_already_exist', {
					postProcess: 'sprintf',
					sprintf: [channelStr],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		if (getParams(params).indexOf('private') > -1) {
			await createPrivateGroupMethod(userId, channelStr, []);
			return;
		}

		await createChannelMethod(userId, channelStr, []);
	},
	options: {
		description: 'Create_A_New_Channel',
		params: '#channel',
		permission: ['create-c', 'create-p'],
	},
});
