import js from '@eslint/js';
import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist/**', 'node_modules/**', 'gulpfile.js'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['nodes/**/*.ts'],
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.community.rules,
		},
	},
	{
		files: ['test/**/*.ts'],
		rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
	},
);
