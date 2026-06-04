import { loadEnv } from 'vite';

type ConfigOptions<T = string> = {
  envDir: string;
  fallback?: T;
  mode: string;
};

type Env = Partial<Record<string, string>>;

type Options<T = string> = {
  fallback?: T;
  parse?: Parser<T>;
  validate?: Validator<T>;
};

type Parser<T> = (value: string) => T;

type Validator<T> = (value: T) => boolean;

export default class EnvVariableFinder {
  static getFromConfig<T = string>(key: string, options: ConfigOptions<T> & Options<T>): T {
    return EnvVariableFinder.getFromEnv(loadEnv(options.mode, options.envDir, ''), key, options);
  }

  static getFromProcess<T = string>(key: string, options: Options<T> = {}): T {
    return EnvVariableFinder.getFromEnv(process.env, key, options);
  }

  private static getFromEnv<T = string>(env: Env, key: string, options: Options<T>): T {
    const value = env[key];
    if (value === undefined) {
      if ('fallback' in options) {
        return options.fallback;
      }
      throw new Error(`${key} must be defined.`);
    }
    const parsedValue = options.parse === undefined ? (value as T) : options.parse(value);
    const isInvalid = options.validate?.(parsedValue) ?? false;
    if (isInvalid) {
      throw new Error(`${key} is invalid.`);
    }
    return parsedValue;
  }
}
