/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is manually aligned with the generated service pattern for the Dataverse audit table.
 */

export interface AuditsBase {
  auditid: string;
  additionalinfo?: string | null;
  changedata?: string | null;
  attributemask?: string | null;
  createdon?: string | null;
  objecttypecode?: string | null;
  _objectid_value?: string | null;
  _userid_value?: string | null;
  "_userid_value@OData.Community.Display.V1.FormattedValue"?: string;
  "_userid_value@Microsoft.Dynamics.CRM.lookuplogicalname"?: string;
  "createdon@OData.Community.Display.V1.FormattedValue"?: string;
  "objecttypecode@OData.Community.Display.V1.FormattedValue"?: string;
}

export interface Audits extends AuditsBase {}
