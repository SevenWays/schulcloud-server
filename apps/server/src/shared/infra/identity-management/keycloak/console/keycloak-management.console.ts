import { Command, CommandOption, Console } from 'nestjs-console';
import { ConsoleWriterService } from '@shared/infra/console';
import { KeycloakManagementUc } from '../uc/Keycloak-management.uc';

const defaultError = new Error('IDM is not reachable or authentication failed.');

interface IRetryOptions {
	retryCount: number;
	retryDelay: number;
}

@Console({ command: 'idm', description: 'Prefixes all Identity Management (IDM) related console commands.' })
export class KeycloakConsole {
	constructor(
		private readonly console: ConsoleWriterService,
		private readonly keycloakManagementUc: KeycloakManagementUc
	) {}

	static retryFlags: CommandOption[] = [
		{
			flags: '-rc, --retry-count <value>',
			description: 'If the command fails, it will be retried this number of times. Default is no retry.',
			required: false,
			defaultValue: 1,
		},
		{
			flags: '-rd, --retry-delay <value>',
			description: 'If "retry" is active, this delay is used between each retry. Default is 10 seconds.',
			required: false,
			defaultValue: 10,
		},
	];

	@Command({ command: 'check', description: 'Test the connection to the IDM.' })
	async check(): Promise<void> {
		if (await this.keycloakManagementUc.check()) {
			this.console.info('Connected to IDM');
		} else {
			throw defaultError;
		}
	}

	@Command({
		command: 'clean',
		description: 'Remove all users from the IDM.',
		options: KeycloakConsole.retryFlags,
	})
	async clean(options: IRetryOptions): Promise<void> {
		await this.repeatCommand(
			'clean',
			async () => {
				const count = await this.keycloakManagementUc.clean();
				this.console.info(`Cleaned ${count} users into IDM`);
				return count;
			},
			options.retryCount,
			options.retryDelay
		);
	}

	@Command({
		command: 'seed',
		description: 'Add all seed users to the IDM.',
		options: KeycloakConsole.retryFlags,
	})
	async seed(options: IRetryOptions): Promise<void> {
		await this.repeatCommand(
			'seed',
			async () => {
				const count = await this.keycloakManagementUc.seed();
				this.console.info(`Seeded ${count} users into IDM`);
				return count;
			},
			options.retryCount,
			options.retryDelay
		);
	}

	@Command({
		command: 'configure',
		description: 'Configures Keycloak identity providers.',
		options: KeycloakConsole.retryFlags,
	})
	async configureIdentityProviders(options: IRetryOptions): Promise<void> {
		await this.repeatCommand(
			'configure',
			async () => {
				const count = await this.keycloakManagementUc.configureIdentityProviders();
				this.console.info(`Configured ${count} identity provider(s).`);
			},
			options.retryCount,
			options.retryDelay
		);
	}

	private async repeatCommand<T>(
		commandName: string,
		command: () => Promise<T>,
		count: number,
		delay: number
	): Promise<T> {
		let repetitions = 0;
		while (repetitions < count) {
			repetitions += 1;
			try {
				// eslint-disable-next-line no-await-in-loop
				return await command();
			} catch {
				if (repetitions < count) {
					this.console.info(
						`Command '${commandName}' failed, retry in ${delay} seconds. Execution ${repetitions} / ${count}`
					);
					// eslint-disable-next-line no-await-in-loop
					await this.delay(delay * 1000);
				} else {
					break;
				}
			}
		}
		throw defaultError;
	}

	private delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
