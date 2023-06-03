import { Meteor } from 'meteor/meteor';
import type { AtLeast, IMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Uploads, Users } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';

import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { Apps } from '../../../../ee/server/apps';
import { canDeleteMessageAsync } from '../../../authorization/server/functions/canDeleteMessage';

export const deleteMessageValidatingPermission = async (message: AtLeast<IMessage, '_id'>, userId: IUser['_id']): Promise<void> => {
	if (!message?._id) {
		throw new Meteor.Error('error-invalid-message', 'Invalid message');
	}
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const user = await Users.findOneById(userId);
	const originalMessage = await Messages.findOneById(message._id);

	if (!originalMessage || !user || !(await canDeleteMessageAsync(userId, originalMessage))) {
		throw new Meteor.Error('error-action-not-allowed', 'Not allowed');
	}

	return deleteMessage(originalMessage, user);
};

export async function deleteMessage(message: IMessage, user: IUser): Promise<void> {
	const deletedMsg = await Messages.findOneById(message._id);
	const isThread = (deletedMsg?.tcount || 0) > 0;
	const keepHistory = settings.get('Message_KeepHistory') || isThread;
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus') || isThread;
	const bridges = Apps?.isLoaded() && Apps.getBridges();

	if (deletedMsg && bridges) {
		const prevent = await bridges.getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg);
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	if (deletedMsg?.tmid) {
		await Messages.decreaseReplyCountById(deletedMsg.tmid, -1);
	}

	const files = (message.files || [message.file]).filter(Boolean); // Keep compatibility with old messages

	if (keepHistory) {
		if (showDeletedStatus) {
			// TODO is there a better way to tell TS "IUser[username]" is not undefined?
			await Messages.cloneAndSaveAsHistoryById(message._id, user as Required<Pick<IUser, '_id' | 'username' | 'name'>>);
		} else {
			await Messages.setHiddenById(message._id, true);
		}

		for await (const file of files) {
			file?._id && (await Uploads.updateOne({ _id: file._id }, { $set: { _hidden: true } }));
		}
	} else {
		if (!showDeletedStatus) {
			await Messages.removeById(message._id);
		}

		for await (const file of files) {
			file?._id && (await FileUpload.getStore('Uploads').deleteById(file._id));
		}
	}

	const room = await Rooms.findOneById(message.rid, { projection: { lastMessage: 1, prid: 1, mid: 1, federated: 1 } });
	await callbacks.run('afterDeleteMessage', deletedMsg, room);

	// update last message
	if (settings.get('Store_Last_Message')) {
		if (!room?.lastMessage || room.lastMessage._id === message._id) {
			await Rooms.resetLastMessageById(message.rid, deletedMsg);
		}
	}

	// decrease message count
	await Rooms.decreaseMessageCountById(message.rid, 1);

	if (showDeletedStatus) {
		// TODO is there a better way to tell TS "IUser[username]" is not undefined?
		await Messages.setAsDeletedByIdAndUser(message._id, user as Required<Pick<IUser, '_id' | 'username' | 'name'>>);
	} else {
		void api.broadcast('notify.deleteMessage', message.rid, { _id: message._id });
	}

	if (bridges) {
		void bridges.getListenerBridge().messageEvent('IPostMessageDeleted', deletedMsg, user);
	}
}
