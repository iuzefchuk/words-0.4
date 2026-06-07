import { resolve } from 'node:path';

const getDirectory = (path: string): string => resolve(process.cwd(), '.', path);

export const DIRECTORY = {
  dist: getDirectory('dist'),
  gitignore: getDirectory('.gitignore'),
  playwright: getDirectory('.playwright'),
  public: getDirectory('public'),
  root: getDirectory(''),
  src: getDirectory('src'),
  srcInterface: getDirectory('src/interface'),
  tests: getDirectory('tests'),
  testsSnapshots: getDirectory('tests/snapshots'),
} as const;

export const FILE_GLOB = {
  app: 'src/app/**',
  domain: 'src/domain/**',
  infrastructure: 'src/infrastructure/**',
  interface: 'src/interface/**',
} as const;

export const IMPORT_GLOB = {
  app: '@/app/**',
  domain: '@/domain/**',
  domainEntities: '@/domain/entities/**',
  domainEvents: '@/domain/events/**',
  domainPolicies: '@/domain/policies/**',
  domainServices: '@/domain/services/**',
  infrastructure: '@/infrastructure/**',
  interface: '@/interface/**',
} as const;
