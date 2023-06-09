import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../notifications/client';
import { updateEmojiCustom } from '../lib/emojiCustom';

Meteor.startup(() => Notifications.onLogged('updateEmojiCustom', (data) => updateEmojiCustom(data.emojiData)));
