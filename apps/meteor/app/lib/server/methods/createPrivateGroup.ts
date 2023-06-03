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
		createPrivateGroup(
			name: string,
			members: string[],
			readOnly?: boolean,
			customFields?: Record<string, unknown>,
			extraData?: Record<string, unknown>,
		): ICreatedRoom;
	}
}

export const createPrivateGroupMethod = async (
	userId: string,
	name: string,
	members: string[],
	readOnly = false,
	customFields = {},
	extraData = {},
): Promise<
	ICreatedRoom & {
		rid: string;
	}
> => {
	check(name, String);
	check(members, Match.Optional([String]));
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createPrivateGroup',
		});
	}
	const user = await Users.findOneById(userId, { projection: { username: 1 } });
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'createPrivateGroup',
		});
	}

	if (!(await hasPermissionAsync(userId, 'create-p'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
	}

	return createRoom('p', name, user.username, members, readOnly, {
		customFields,
		...extraData,
	});
};

Meteor.methods<ServerMethods>({
	async createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		return createPrivateGroupMethod(uid, name, members, readOnly, customFields, extraData);
	},
});
