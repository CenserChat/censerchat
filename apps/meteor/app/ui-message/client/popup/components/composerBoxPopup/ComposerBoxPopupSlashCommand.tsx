import React from 'react';
import { OptionColumn, OptionContent, OptionDescription, OptionInput } from '@rocket.chat/fuselage';

export type ComposerBoxPopupSlashCommandProps = {
	_id: string;
	description?: string;
	params?: string;
};

const ComposerPopupSlashCommand = ({ _id, description, params }: ComposerBoxPopupSlashCommandProps) => {
	return (
		<>
			<OptionContent>
				{_id} <OptionDescription>{params}</OptionDescription>
			</OptionContent>
			<OptionColumn>
				<OptionInput>{description}</OptionInput>
			</OptionColumn>
		</>
	);
};

export default ComposerPopupSlashCommand;
