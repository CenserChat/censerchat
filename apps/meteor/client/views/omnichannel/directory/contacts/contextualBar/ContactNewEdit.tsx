import type { ILivechatVisitor, Serialized } from '@rocket.chat/core-typings';
import { Field, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../../../app/authorization/client';
import { validateEmail } from '../../../../../../lib/emailValidator';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../../components/Contextualbar';
import { CustomFieldsForm } from '../../../../../components/CustomFieldsFormV2';
import { createToken } from '../../../../../lib/utils/createToken';
import { useFormsSubscription } from '../../../additionalForms';
import { FormSkeleton } from '../../components/FormSkeleton';
import { useCustomFieldsMetadata } from '../../hooks/useCustomFieldsMetadata';

type ContactNewEditProps = {
	id: string;
	data?: { contact: Serialized<ILivechatVisitor> | null };
	close(): void;
};

type ContactFormData = {
	token: string;
	name: string;
	email: string;
	phone: string;
	username: string;
	customFields: Record<any, any>;
};

const DEFAULT_VALUES = {
	token: '',
	name: '',
	email: '',
	phone: '',
	username: '',
	customFields: {},
};

const getInitialValues = (data: ContactNewEditProps['data']): ContactFormData => {
	if (!data) {
		return DEFAULT_VALUES;
	}

	const { name, token, phone, visitorEmails, livechatData, contactManager } = data.contact ?? {};

	return {
		token: token ?? '',
		name: name ?? '',
		email: visitorEmails ? visitorEmails[0].address : '',
		phone: phone ? phone[0].phoneNumber : '',
		customFields: livechatData ?? {},
		username: contactManager?.username ?? '',
	};
};

const ContactNewEdit = ({ id, data, close }: ContactNewEditProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canViewCustomFields = (): boolean =>
		hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const { useContactManager } = useFormsSubscription();

	const ContactManager = useContactManager?.();

	const [userId, setUserId] = useState('no-agent-selected');
	const saveContact = useEndpoint('POST', '/v1/omnichannel/contact');
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const getUserData = useEndpoint('GET', '/v1/users.info');

	const { data: customFieldsMetadata = [], isInitialLoading: isLoadingCustomFields } = useCustomFieldsMetadata({
		scope: 'visitor',
		enabled: canViewCustomFields(),
	});

	const initialValue = getInitialValues(data);
	const { username: initialUsername } = initialValue;

	const {
		register,
		formState: { errors, isValid, isDirty },
		control,
		setValue,
		handleSubmit,
		setError,
	} = useForm<ContactFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: initialValue,
	});

	useEffect(() => {
		if (!initialUsername) {
			return;
		}

		getUserData({ username: initialUsername }).then(({ user }) => {
			setUserId(user._id);
		});
	}, [getUserData, initialUsername]);

	const validateEmailFormat = (email: string): boolean | string => {
		if (!email || email === initialValue.email) {
			return true;
		}

		if (!validateEmail(email)) {
			return t('error-invalid-email-address');
		}

		return true;
	};

	const validateContactField = async (name: 'phone' | 'email', value: string, optional = true) => {
		if ((optional && !value) || value === initialValue[name]) {
			return true;
		}

		const query = { [name]: value } as Record<'phone' | 'email', string>;
		const { contact } = await getContactBy(query);
		return !contact || contact._id === id;
	};

	const validateName = (v: string): string | boolean => (!v.trim() ? t('The_field_is_required', t('Name')) : true);

	const handleContactManagerChange = async (userId: string): Promise<void> => {
		setUserId(userId);

		if (userId === 'no-agent-selected') {
			setValue('username', '', { shouldDirty: true });
			return;
		}

		const { user } = await getUserData({ userId });
		setValue('username', user.username || '', { shouldDirty: true });
	};

	const validateAsync = async ({ phone = '', email = '' } = {}) => {
		const isEmailValid = await validateContactField('email', email);
		const isPhoneValid = await validateContactField('phone', phone);

		!isEmailValid && setError('email', { message: t('Email_already_exists') });
		!isPhoneValid && setError('phone', { message: t('Phone_already_exists') });

		return isEmailValid && isPhoneValid;
	};

	const handleSave = async (data: ContactFormData): Promise<void> => {
		if (!(await validateAsync(data))) {
			return;
		}

		const { name, phone, email, customFields, username, token } = data;

		const payload = {
			name,
			phone,
			email,
			customFields,
			token: token || createToken(),
			...(username && { contactManager: { username } }),
			...(id && { _id: id }),
		};

		try {
			await saveContact(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	if (isLoadingCustomFields) {
		return <FormSkeleton />;
	}

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				<Field>
					<Field.Label>{t('Name')}*</Field.Label>
					<Field.Row>
						<TextInput {...register('name', { validate: validateName })} error={errors.name?.message} flexGrow={1} />
					</Field.Row>
					<Field.Error>{errors.name?.message}</Field.Error>
				</Field>
				<Field>
					<Field.Label>{t('Email')}</Field.Label>
					<Field.Row>
						<TextInput {...register('email', { validate: validateEmailFormat })} error={errors.email?.message} flexGrow={1} />
					</Field.Row>
					<Field.Error>{errors.email?.message}</Field.Error>
				</Field>
				<Field>
					<Field.Label>{t('Phone')}</Field.Label>
					<Field.Row>
						<TextInput {...register('phone')} error={errors.phone?.message} flexGrow={1} />
					</Field.Row>
					<Field.Error>{errors.phone?.message}</Field.Error>
				</Field>
				{canViewCustomFields() && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
				{ContactManager && <ContactManager value={userId} handler={handleContactManagerChange} />}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button flexGrow={1} onClick={close}>
						{t('Cancel')}
					</Button>
					<Button mie='none' type='submit' onClick={handleSubmit(handleSave)} flexGrow={1} disabled={!isValid || !isDirty} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default ContactNewEdit;
