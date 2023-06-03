import { Agenda } from '@rocket.chat/agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import { LivechatRooms, Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { Livechat } from '../../../../../app/livechat/server/lib/LivechatTyped';
import { schedulerLogger } from './logger';
import type { MainLogger } from '../../../../../server/lib/logger/getPino';

const SCHEDULER_NAME = 'omnichannel_auto_close_on_hold_scheduler';

class AutoCloseOnHoldSchedulerClass {
	scheduler: Agenda;

	schedulerUser: IUser;

	running: boolean;

	logger: MainLogger;

	constructor() {
		this.logger = schedulerLogger.section('AutoCloseOnHoldScheduler');
	}

	public async init(): Promise<void> {
		if (this.running) {
			this.logger.debug('Already running');
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		await this.scheduler.start();
		this.running = true;
		this.logger.debug('Started');
	}

	public async scheduleRoom(roomId: string, timeout: number, comment: string): Promise<void> {
		this.logger.debug(`Scheduling room ${roomId} to be closed in ${timeout} seconds`);
		await this.unscheduleRoom(roomId);

		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		const when = moment(new Date()).add(timeout, 's').toDate();

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId, comment });
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		this.logger.debug(`Unscheduling room ${roomId}`);
		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		await this.scheduler.cancel({ name: jobName });
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		this.logger.debug(`Executing job for room ${data.roomId}`);
		const { roomId, comment } = data;

		const [room, user] = await Promise.all([LivechatRooms.findOneById(roomId), this.getSchedulerUser()]);
		if (!room || !user) {
			throw new Error(
				`Unable to process AutoCloseOnHoldScheduler job because room or user not found for roomId: ${roomId} and userId: rocket.cat`,
			);
		}

		const payload = {
			room,
			user,
			comment,
		};

		this.logger.debug(`Closing room ${roomId}`);
		await Livechat.closeRoom(payload);
	}

	private async getSchedulerUser(): Promise<IUser> {
		if (!this.schedulerUser) {
			const schedulerUser = await Users.findOneById('rocket.cat');
			if (!schedulerUser) {
				throw new Error('Scheduler user not found');
			}
			this.schedulerUser = schedulerUser;
		}

		return this.schedulerUser;
	}
}

export const AutoCloseOnHoldScheduler = new AutoCloseOnHoldSchedulerClass();

Meteor.startup(() => {
	void AutoCloseOnHoldScheduler.init();
});
