import { Box, FieldGroup, TextInput, Field } from '@rocket.chat/fuselage';
import { useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, SyntheticEvent } from 'react';
import React, { useState } from 'react';

import GenericModal from '../GenericModal';
import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorEmailModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	emailOrUsername: string;
	invalidAttempt?: boolean;
};

const TwoFactorEmailModal = ({ onConfirm, onClose, emailOrUsername, invalidAttempt }: TwoFactorEmailModalProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus<HTMLInputElement>();

	const sendEmailCode = useEndpoint('POST', '/v1/users.2fa.sendEmailCode');

	const onClickResendCode = async (): Promise<void> => {
		try {
			await sendEmailCode({ emailOrUsername });
			dispatchToastMessage({ type: 'success', message: t('Email_sent') });
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-email-send-failed', { message: error }),
			});
		}
	};

	const onConfirmEmailCode = (e: SyntheticEvent): void => {
		e.preventDefault();
		onConfirm(code, Method.EMAIL);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	const id = useUniqueId();

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onConfirmEmailCode} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Two-factor_authentication_email')}
			onClose={onClose}
			variant='warning'
			icon='info'
			confirmDisabled={!code}
		>
			<FieldGroup>
				<Field>
					<Field.Label alignSelf='stretch' htmlFor={id}>
						{t('Verify_your_email_with_the_code_we_sent')}
					</Field.Label>
					<Field.Row>
						<TextInput id={id} ref={ref} value={code} onChange={onChange} placeholder={t('Enter_authentication_code')} />
					</Field.Row>
					{invalidAttempt && <Field.Error>{t('Invalid_password')}</Field.Error>}
				</Field>
			</FieldGroup>
			<Box display='flex' justifyContent='end' is='a' onClick={onClickResendCode}>
				{t('Cloud_resend_email')}
			</Box>
		</GenericModal>
	);
};

export default TwoFactorEmailModal;
