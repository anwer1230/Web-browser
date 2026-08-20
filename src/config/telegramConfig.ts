import configData from '../../telegram.config.json';

export interface TelegramAppConfig {
  NODE_VERSION: string;
  NODE_ENV: string;
  TDLIB_API_ID: number;
  TDLIB_API_HASH: string;
  PORT: number;
  notes?: Record<string, string>;
}

export const APP_CONFIG: TelegramAppConfig = {
  NODE_VERSION: (typeof process !== 'undefined' && process.env?.NODE_VERSION) ? process.env.NODE_VERSION : (configData.NODE_VERSION || '20.18.0'),
  NODE_ENV: (typeof process !== 'undefined' && process.env?.NODE_ENV) ? process.env.NODE_ENV : (configData.NODE_ENV || 'production'),
  TDLIB_API_ID: (typeof process !== 'undefined' && process.env?.TDLIB_API_ID) ? Number(process.env.TDLIB_API_ID) : (Number(configData.TDLIB_API_ID) || 22043994),
  TDLIB_API_HASH: (typeof process !== 'undefined' && process.env?.TDLIB_API_HASH) ? process.env.TDLIB_API_HASH : (configData.TDLIB_API_HASH || '56f64582b363d367280db96586b97801'),
  PORT: (typeof process !== 'undefined' && process.env?.PORT) ? Number(process.env.PORT) : (Number(configData.PORT) || 3000),
  notes: configData.notes,
};

export default APP_CONFIG;
