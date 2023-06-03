import { Meteor } from 'meteor/meteor';
import type { IMessage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { deleteMessageValidatingPermission } from '../functions/deleteMessage';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteMessage({ _id }: Pick<IMessage, '_id'>): void;
	}
}

Meteor.methods<ServerMethods>({
	async deleteMessage(message) {
		methodDeprecationLogger.warn('deleteMessage method is deprecated, and will be removed in future versions');

		check(
			message,
			Match.ObjectIncluding({
				_id: String,
			}),
		);

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteMessage',
			});
		}
		return deleteMessageValidatingPermission(message, uid);
	},
});
