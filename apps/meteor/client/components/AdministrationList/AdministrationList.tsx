import { OptionDivider } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { Fragment } from 'react';

type AdministrationListProps = {
	optionsList: (false | JSX.Element)[];
};

const AdministrationList = ({ optionsList }: AdministrationListProps): ReactElement => {
	return (
		<>
			{optionsList.map((item, index) => (
				<Fragment key={index}>
					{index > 0 && <OptionDivider />}
					{item}
				</Fragment>
			))}
		</>
	);
};

export default AdministrationList;
