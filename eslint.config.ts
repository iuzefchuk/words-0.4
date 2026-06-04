import prettierConfig from '@vue/eslint-config-prettier';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginVue from 'eslint-plugin-vue';
import { includeIgnoreFile } from 'eslint/config';
import { DIRECTORY } from './workspace/constants.ts';
import { FileGlob, ImportGlob } from './workspace/enums.ts';

export default defineConfigWithVueTs(
  includeIgnoreFile(DIRECTORY.gitignore),
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,
  vueTsConfigs.stylisticTypeChecked,
  perfectionist.configs['recommended-alphabetical'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: DIRECTORY.root,
      },
    },
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['strictCamelCase', 'UPPER_CASE'],
          selector: 'variableLike',
        },
        {
          filter: { match: true, regex: '^_' },
          format: null,
          modifiers: ['unused'],
          selector: 'parameter',
        },
        {
          format: ['strictCamelCase', 'UPPER_CASE'],
          modifiers: ['const', 'global'],
          selector: 'variable',
        },
        {
          format: ['UPPER_CASE'],
          modifiers: ['static', 'readonly'],
          selector: 'classProperty',
        },
        {
          format: ['StrictPascalCase'],
          selector: 'typeLike',
        },
        {
          format: ['StrictPascalCase'],
          selector: 'enumMember',
        },
      ],
      '@typescript-eslint/no-extraneous-class': ['error', { allowStaticOnly: true }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableBoolean: false,
          allowNullableNumber: false,
          allowNullableObject: false,
          allowNullableString: false,
          allowNumber: false,
          allowString: false,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      eqeqeq: ['error', 'always'],
      'id-length': ['error', { exceptions: ['_'], min: 2 }],
      'lines-between-class-members': ['error', 'always'],
      'max-depth': ['error', 4],
      'max-params': ['error', 7],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-param-reassign': 'error',
      'no-var': 'error',
      'perfectionist/sort-imports': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type', 'unknown'],
          internalPattern: ['^@/.+'],
          newlinesBetween: 0,
        },
      ],
      'prefer-const': 'error',
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false }],
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots', 'defineExpose'],
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-refs': 'error',
      'vue/no-v-html': 'off',
    },
  },
  {
    files: [FileGlob.Domain],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [ImportGlob.Application, ImportGlob.Infrastructure, ImportGlob.Interface],
              message: 'domain must not import from application, infrastructure, or interface',
            },
          ],
        },
      ],
    },
  },
  {
    files: [FileGlob.Application],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [ImportGlob.Infrastructure, ImportGlob.Interface],
              message: 'application must not import from infrastructure or interface',
            },
          ],
        },
      ],
    },
  },
  {
    files: [FileGlob.Infrastructure],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [ImportGlob.Domain, ImportGlob.Interface],
              message: 'infrastructure must not import from domain or interface; depend on application aliases instead',
            },
          ],
        },
      ],
    },
  },
  {
    files: [FileGlob.Interface],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [ImportGlob.Domain, ImportGlob.Infrastructure],
              message: 'interface must not import from domain or infrastructure; depend on application ports instead',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
);
