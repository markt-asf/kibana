/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/* eslint-disable no-console */

import { argv } from 'yargs';
import Url from 'url';
import cypress from 'cypress';
import { FtrProviderContext } from './ftr_provider_context';
import { createApmUsers } from '../scripts/create_apm_users/create_apm_users';
import { esArchiverLoad, esArchiverUnload } from './cypress/tasks/es_archiver';

export async function cypressStart(
  getService: FtrProviderContext['getService'],
  cypressExecution: typeof cypress.run | typeof cypress.open
) {
  const config = getService('config');

  const kibanaUrl = Url.format({
    protocol: config.get('servers.kibana.protocol'),
    hostname: config.get('servers.kibana.hostname'),
    port: config.get('servers.kibana.port'),
  });

  // Creates APM users
  await createApmUsers({
    elasticsearch: {
      username: config.get('servers.elasticsearch.username'),
      password: config.get('servers.elasticsearch.password'),
    },
    kibana: {
      hostname: kibanaUrl,
    },
  });

  const esNode = Url.format({
    protocol: config.get('servers.elasticsearch.protocol'),
    port: config.get('servers.elasticsearch.port'),
    hostname: config.get('servers.elasticsearch.hostname'),
    auth: `${config.get('servers.elasticsearch.username')}:${config.get(
      'servers.elasticsearch.password'
    )}`,
  });

  const esRequestTimeout = config.get('timeouts.esRequestTimeout');
  const archiveName = 'apm_mappings_only_8.0.0';
  const metricsArchiveName = 'metrics_8.0.0';

  console.log(`Creating APM mappings`);
  await esArchiverLoad(archiveName);
  console.log(`Creating Metrics mappings`);
  await esArchiverLoad(metricsArchiveName);

  const spec = argv.grep as string | undefined;
  const res = await cypressExecution({
    ...(spec ? { spec } : {}),
    config: { baseUrl: kibanaUrl },
    env: {
      KIBANA_URL: kibanaUrl,
      ES_NODE: esNode,
      ES_REQUEST_TIMEOUT: esRequestTimeout,
      TEST_CLOUD: process.env.TEST_CLOUD,
    },
  });

  console.log('Removing APM mappings');
  await esArchiverUnload(archiveName);
  console.log('Removing Metrics mappings');
  await esArchiverUnload(metricsArchiveName);

  return res;
}
