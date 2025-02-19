/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Panel } from '../../common/types';
import { PANEL_TYPES } from '../../common/enums';
import { ConvertTsvbToLensVisualization } from './types';

const getConvertFnByType = (
  type: PANEL_TYPES
): Promise<ConvertTsvbToLensVisualization> | undefined => {
  const convertionFns: { [key in PANEL_TYPES]?: () => Promise<ConvertTsvbToLensVisualization> } = {
    [PANEL_TYPES.TIMESERIES]: async () => {
      const { convertToLens } = await import('./timeseries');
      return convertToLens;
    },
  };

  return convertionFns[type]?.();
};

/*
 * This function is used to convert the TSVB model to compatible Lens model.
 * Returns the Lens model, only if it is supported. If not, it returns null.
 * In case of null, the menu item is disabled and the user can't navigate to Lens.
 */
export const convertTSVBtoLensConfiguration = async (model: Panel) => {
  // Disables the option for not timeseries charts, for the string mode and for series with annotations
  if (!model.use_kibana_indexes || (model.annotations && model.annotations.length > 0)) {
    return null;
  }
  const convertFn = await getConvertFnByType(model.type);

  return (await convertFn?.(model)) ?? null;
};
