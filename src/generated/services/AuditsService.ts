/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file follows the generated Dataverse service pattern used in this app.
 */

import type { Audits } from '../models/AuditsModel';
import type { GetEntityMetadataOptions, EntityMetadata } from '@microsoft/power-apps/data/metadata/dataverse';
import type { IGetOptions, IGetAllOptions } from '../models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';

export class AuditsService {
  private static readonly dataSourceName = 'audits';

  private static readonly client = getClient(dataSourcesInfo);

  public static async get(id: string, options?: IGetOptions): Promise<IOperationResult<Audits>> {
    return AuditsService.client.retrieveRecordAsync<Audits>(
      AuditsService.dataSourceName,
      id,
      options
    );
  }

  public static async getAll(options?: IGetAllOptions): Promise<IOperationResult<Audits[]>> {
    return AuditsService.client.retrieveMultipleRecordsAsync<Audits>(
      AuditsService.dataSourceName,
      options
    );
  }

  public static getMetadata(
    options: GetEntityMetadataOptions<Audits> = {}
  ): Promise<IOperationResult<Partial<EntityMetadata>>> {
    return AuditsService.client.executeAsync({
      dataverseRequest: {
        action: 'getEntityMetadata',
        parameters: {
          tableName: AuditsService.dataSourceName,
          options: options as GetEntityMetadataOptions,
        },
      },
    });
  }
}
