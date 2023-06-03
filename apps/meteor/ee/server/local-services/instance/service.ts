import os from 'os';

import type { BrokerNode } from 'moleculer';
import { ServiceBroker, Transporters } from 'moleculer';
import { License, ServiceClassInternal } from '@rocket.chat/core-services';
import { InstanceStatus as InstanceStatusRaw } from '@rocket.chat/models';
import { InstanceStatus } from '@rocket.chat/instance-status';

import { StreamerCentral } from '../../../../server/modules/streamer/streamer.module';
import type { IInstanceService } from '../../sdk/types/IInstanceService';
import { getTransporter } from './getTransporter';

export class InstanceService extends ServiceClassInternal implements IInstanceService {
	protected name = 'instance';

	private broadcastStarted = false;

	private transporter: Transporters.TCP | Transporters.NATS;

	private isTransporterTCP = true;

	private broker: ServiceBroker;

	private troubleshootDisableInstanceBroadcast = false;

	constructor() {
		super();

		const tx = getTransporter({ transporter: process.env.TRANSPORTER, port: process.env.TCP_PORT });
		if (typeof tx === 'string') {
			this.transporter = new Transporters.NATS({ url: tx });
			this.isTransporterTCP = false;
		} else {
			this.transporter = new Transporters.TCP(tx);
		}

		if (this.isTransporterTCP) {
			this.onEvent('watch.instanceStatus', async ({ clientAction, data }): Promise<void> => {
				if (clientAction === 'removed') {
					return;
				}

				if (clientAction === 'inserted' && data?.extraInformation?.tcpPort) {
					this.connectNode(data);
				}
			});
		}

		this.onEvent('license.module', async ({ module, valid }) => {
			if (module === 'scalability' && valid) {
				await this.startBroadcast();
			}
		});

		this.onEvent('watch.settings', async ({ clientAction, setting }): Promise<void> => {
			if (clientAction === 'removed') {
				return;
			}

			const { _id, value } = setting;
			if (_id !== 'Troubleshoot_Disable_Instance_Broadcast') {
				return;
			}

			if (typeof value !== 'boolean') {
				return;
			}

			if (this.troubleshootDisableInstanceBroadcast === value) {
				return;
			}

			this.troubleshootDisableInstanceBroadcast = value;
		});
	}

	async created() {
		this.broker = new ServiceBroker({
			nodeID: InstanceStatus.id(),
			transporter: this.transporter,
		});

		this.broker.createService({
			name: 'matrix',
			events: {
				broadcast(ctx: any) {
					const { eventName, streamName, args } = ctx.params;

					const instance = StreamerCentral.instances[streamName];
					if (!instance) {
						return 'stream-not-exists';
					}

					if (instance.serverOnly) {
						instance.__emit(eventName, ...args);
					} else {
						// @ts-expect-error not sure why it thinks _emit needs an extra argument
						StreamerCentral.instances[streamName]._emit(eventName, args);
					}
				},
			},
		});
	}

	async started() {
		await this.broker.start();

		const instance = {
			host: process.env.INSTANCE_IP ? String(process.env.INSTANCE_IP).trim() : 'localhost',
			port: String(process.env.PORT).trim(),
			tcpPort: (this.broker.transit?.tx as any)?.nodes?.localNode?.port,
			os: {
				type: os.type(),
				platform: os.platform(),
				arch: os.arch(),
				release: os.release(),
				uptime: os.uptime(),
				loadavg: os.loadavg(),
				totalmem: os.totalmem(),
				freemem: os.freemem(),
				cpus: os.cpus().length,
			},
			nodeVersion: process.version,
		};

		await InstanceStatus.registerInstance('rocket.chat', instance);

		const hasLicense = await License.hasLicense('scalability');
		if (!hasLicense) {
			return;
		}

		await this.startBroadcast();
	}

	private async startBroadcast() {
		if (this.broadcastStarted) {
			return;
		}

		this.broadcastStarted = true;

		StreamerCentral.on('broadcast', this.sendBroadcast.bind(this));

		if (this.isTransporterTCP) {
			await InstanceStatusRaw.find(
				{
					'extraInformation.tcpPort': {
						$exists: true,
					},
				},
				{
					sort: {
						_createdAt: -1,
					},
				},
			).forEach(this.connectNode.bind(this));
		}
	}

	private connectNode(record: any) {
		if (record._id === InstanceStatus.id()) {
			return;
		}

		const { host, tcpPort } = record.extraInformation;

		(this.broker?.transit?.tx as any).addOfflineNode(record._id, host, tcpPort);
	}

	private sendBroadcast(streamName: string, eventName: string, args: unknown[]) {
		if (this.troubleshootDisableInstanceBroadcast) {
			return;
		}

		void this.broker.broadcast('broadcast', { streamName, eventName, args });
	}

	async getInstances(): Promise<BrokerNode[]> {
		return this.broker.call('$node.list', { onlyAvailable: true });
	}
}
