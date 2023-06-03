import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ICreatedRoom } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { createRoom } from '../functions';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		createChannel(
			name: string,
			members: string[],
			readOnly?: boolean,
			customFields?: Record<string, any>,
			extraData?: Record<string, any>,
		): ICreatedRoom;
	}
}

export const createChannelMethod = async (
	userId: string,
	name: string,
	members: string[],
	readOnly = false,
	customFields: Record<string, any> = {},
	extraData: Record<string, any> = {},
) => {
	check(name, String);
	check(members, Match.Optional([String]));
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
	}

	const user = await Users.findOneById(userId, { projection: { username: 1 } });

	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
	}

	if (!(await hasPermissionAsync(userId, 'create-c'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
	}
	return createRoom('c', name, user.username, members, readOnly, {
		customFields,
		...extraData,
	});
};

Meteor.methods<ServerMethods>({
	async createChannel(name, members, readOnly = false, customFields = {}, extraData = {}) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		return createChannelMethod(uid, name, members, readOnly, customFields, extraData);
	},
});
