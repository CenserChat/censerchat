import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { unmuteUserInRoom } from '../../../server/methods/unmuteUserInRoom';
import { i18n } from '../../../server/lib/i18n';

/*
 * Unmute is a named function that will replace /unmute commands
 */

slashCommands.add({
	command: 'unmute',
	callback: async function Unmute({ params, message, userId }: SlashCommandCallbackParams<'unmute'>): Promise<void> {
		const username = params.trim().replace('@', '');
		if (username === '') {
			return;
		}
		const unmutedUser = await Users.findOneByUsernameIgnoringCase(username);
		if (unmutedUser == null) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Username_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [username],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await unmuteUserInRoom(userId, {
			rid: message.rid,
			username,
		});
	},
	options: {
		description: 'Unmute_someone_in_room',
		params: '@username',
		permission: 'mute-user',
	},
});
