import { afterAll, describe, it } from 'vitest';
import { request } from '../utils/request';
import { restartApp } from '../utils/setup';

const resetEmvVariables = () => {
  process.env.MAINTENANCE_MODE = undefined;
};

describe('maintenance', () => {
  afterAll(resetEmvVariables);

  it('should respond with `200` status code when maintenance mode is disabled', async () => {
    process.env.MAINTENANCE_MODE = 'false';

    await restartApp();

    await request().get(`/api/v1/health`).expect(200);
  });

  it('should respond with `503` status code when maintenance mode is enabled', async () => {
    process.env.MAINTENANCE_MODE = 'true';

    await restartApp();

    await request().get(`/api/v1/health`).expect(503);
  });

  it('should respond with `200` status code when maintenance mode is not set', async () => {
    process.env.MAINTENANCE_MODE = undefined;

    await restartApp();

    await request().get(`/api/v1/health`).expect(200);
  });
});
