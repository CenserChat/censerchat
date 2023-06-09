import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Contextualbar } from '../../../../../components/Contextualbar';
import FileItem from './FileItem';

export default {
	title: 'Room/Contextual Bar/RoomFiles/FileItem',
	component: FileItem,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} as ComponentMeta<typeof FileItem>;

export const Default: ComponentStory<typeof FileItem> = (args) => <FileItem {...args} />;
Default.storyName = 'FileItem';
Default.args = {
	fileData: {
		name: 'Lorem Ipsum Indolor Dolor',
		url: '#',
		uploadedAt: 'May 02, 2020 01:00 PM',
		user: {
			username: 'loremIpsum',
		},
	},
};
