import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { isFileAttachment, isFileImageAttachment } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../settings/server';
import { joinRoomMethod } from '../../methods/joinRoom';
import { i18n } from '../../../../../server/lib/i18n';

/**
 * This function returns a string ready to be shown in the notification
 *
 * @param {object} message the message to be parsed
 */
export async function parseMessageTextPerUser(messageText: string, message: IMessage, receiver: IUser): Promise<string> {
	const lng = receiver.language || settings.get('Language') || 'en';

	const firstAttachment = message.attachments?.[0];
	if (!message.msg && firstAttachment && isFileAttachment(firstAttachment) && isFileImageAttachment(firstAttachment)) {
		return firstAttachment.image_type ? i18n.t('User_uploaded_image', { lng }) : i18n.t('User_uploaded_file', { lng });
	}

	if (message.msg && message.t === 'e2e') {
		return i18n.t('Encrypted_message', { lng });
	}

	// perform processing required before sending message as notification such as markdown filtering
	return callbacks.run('renderNotification', messageText);
}

/**
 * Replaces @username with full name
 *
 * @param {string} message The message to replace
 * @param {object[]} mentions Array of mentions used to make replacements
 *
 * @returns {string}
 */
export function replaceMentionedUsernamesWithFullNames(message: string, mentions: NonNullable<IMessage['mentions']>): string {
	if (!mentions?.length) {
		return message;
	}
	mentions.forEach((mention) => {
		if (mention.name) {
			message = message.replace(new RegExp(escapeRegExp(`@${mention.username}`), 'g'), mention.name);
		}
	});
	return message;
}

/**
 * Checks if a message contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */
export function messageContainsHighlight(message: IMessage, highlights: string[]): boolean {
	if (!highlights || highlights.length === 0) {
		return false;
	}

	return highlights.some((highlight: string) => {
		const regexp = new RegExp(escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export async function callJoinRoom(userId: string, rid: string): Promise<void> {
	await joinRoomMethod(userId, rid);
}
