export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	transform: {
		'^.+\\.(ts|tsx)$': [
			'@swc/jest',
			{
				sourceMaps: true,
				jsc: {
					parser: {
						syntax: 'typescript',
						tsx: true,
						decorators: false,
						dynamicImport: false,
					},
					transform: {
						react: {
							runtime: 'automatic',
						},
					},
				},
			},
		],
	},
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
};
