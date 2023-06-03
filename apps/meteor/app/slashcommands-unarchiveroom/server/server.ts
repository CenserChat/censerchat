import { Meteor } from 'meteor/meteor';
import { api } from '@rocket.chat/core-services';
import { isRegisterUser } from '@rocket.chat/core-typings';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users, Rooms } from '@rocket.chat/models';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { roomCoordinator } from '../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { unarchiveRoom } from '../../lib/server';
import { i18n } from '../../../server/lib/i18n';

slashCommands.add({
	command: 'unarchive',
	callback: async function Unarchive({ params, message, userId }: SlashCommandCallbackParams<'unarchive'>): Promise<void> {
		let channel = params.trim();
		let room;

		if (channel === '') {
			room = await Rooms.findOneById(message.rid);
			if (room?.name) {
				channel = room.name;
			}
		} else {
			channel = channel.replace('#', '');
			room = await Rooms.findOneByName(channel);
		}

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
		if (!user || !isRegisterUser(user)) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		if (!room) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Channel_doesnt_exist', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		// You can not archive direct messages.
		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.ARCHIVE, userId))) {
			return;
		}

		if (!room.archived) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('Channel_already_Unarchived', {
					postProcess: 'sprintf',
					sprintf: [channel],
					lng: settings.get('Language') || 'en',
				}),
			});
			return;
		}

		await unarchiveRoom(room._id, user);

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: i18n.t('Channel_Unarchived', {
				postProcess: 'sprintf',
				sprintf: [channel],
				lng: settings.get('Language') || 'en',
			}),
		});
	},
	options: {
		description: 'Unarchive',
		params: '#channel',
		permission: 'unarchive-room',
	},
});
