/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback } from 'react';
import { i18n } from '@kbn/i18n';
import { useUserPrivileges } from '../../../common/components/user_privileges';
import {
  ActionLogButton,
  getEndpointResponseActionsConsoleCommands,
} from '../../components/endpoint_responder';
import { useConsoleManager } from '../../components/console';
import type { HostMetadata } from '../../../../common/endpoint/types';
import { HeaderEndpointInfo } from '../../components/endpoint_responder/header_endpoint_info';
import { OfflineCallout } from '../../components/endpoint_responder/offline_callout';

type ShowEndpointResponseActionsConsole = (endpointMetadata: HostMetadata) => void;

const RESPONDER_PAGE_TITLE = i18n.translate('xpack.securitySolution.responder_overlay.pageTitle', {
  defaultMessage: 'Response console',
});

export const useWithShowEndpointResponder = (): ShowEndpointResponseActionsConsole => {
  const consoleManager = useConsoleManager();
  const { canAccessResponseConsole } = useUserPrivileges().endpointPrivileges;

  return useCallback(
    (endpointMetadata: HostMetadata) => {
      // If no authz, just exit and log something to the console
      if (!canAccessResponseConsole) {
        window.console.error(new Error('Access denied to endpoint response actions console'));
        return;
      }

      const endpointAgentId = endpointMetadata.agent.id;
      const endpointRunningConsole = consoleManager.getOne(endpointAgentId);

      if (endpointRunningConsole) {
        endpointRunningConsole.show();
      } else {
        consoleManager
          .register({
            id: endpointAgentId,
            meta: {
              endpoint: endpointMetadata,
            },
            consoleProps: {
              commands: getEndpointResponseActionsConsoleCommands(endpointAgentId),
              'data-test-subj': 'endpointResponseActionsConsole',
              TitleComponent: () => <HeaderEndpointInfo endpointId={endpointAgentId} />,
            },
            PageTitleComponent: () => <>{RESPONDER_PAGE_TITLE}</>,
            PageBodyComponent: () => <OfflineCallout endpointId={endpointAgentId} />,
            ActionComponents: [ActionLogButton],
          })
          .show();
      }
    },
    [canAccessResponseConsole, consoleManager]
  );
};
