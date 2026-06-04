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
