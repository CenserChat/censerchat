import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { muteUserInRoom } from '../../../server/methods/muteUserInRoom';
import { i18n } from '../../../server/lib/i18n';

/*
 * Mute is a named function that will replace /mute commands
 */

slashCommands.add({
	command: 'mute',
	callback: async function Mute({ params, message, userId }: SlashCommandCallbackParams<'mute'>): Promise<void> {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}

		const mutedUser = await Users.findOneByUsernameIgnoringCase(username);
		if (mutedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
		}

		await muteUserInRoom(userId, {
			rid: message.rid,
			username,
		});
	},
	options: {
		description: 'Mute_someone_in_room',
		params: '@username',
		permission: 'mute-user',
	},
});
