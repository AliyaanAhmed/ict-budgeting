/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "accounts": {
    "tableId": "",
    "version": "",
    "primaryKey": "accountid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "audits": {
    "tableId": "",
    "version": "",
    "primaryKey": "auditid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_app_notificationses": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_app_notificationsid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_classifications": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_classificationid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_cycles": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_cycleid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_ict_budget_dga_technology_productset": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_ict_budget_dga_technology_productid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "sharepointdocuments": {
    "tableId": "",
    "version": "",
    "primaryKey": "sharepointdocumentid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_ict_budget_instances": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_ict_budget_instanceid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_ict_budget_line_items": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_ict_budget_line_itemid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_ict_budgets": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_ict_budgetid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_ict_clarifications": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_ict_clarificationid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_module_configurations": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_module_configurationid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_module_types": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_module_typeid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "roles": {
    "tableId": "",
    "version": "",
    "primaryKey": "roleid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_strategic_prioritieses": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_strategic_prioritiesid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "systemuserrolescollection": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserroleid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "teammemberships": {
    "tableId": "",
    "version": "",
    "primaryKey": "teammembershipid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "teams": {
    "tableId": "",
    "version": "",
    "primaryKey": "teamid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_technologies": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_technologyid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "systemusers": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "dga_work_streams": {
    "tableId": "",
    "version": "",
    "primaryKey": "dga_work_streamid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "ictbudget_clarificaitons_deletefilefromsharepoint": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          },
          "default": {
            "type": "object"
          }
        }
      }
    }
  },
  "ictbudget_clarifications_uploadfilesinsharepoint": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          }
        }
      }
    }
  },
  "powerappv2_calluploadfileflow": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Connector",
    "apis": {
      "Run": {
        "path": "/{connectionId}/triggers/manual/run",
        "method": "POST",
        "parameters": [
          {
            "name": "connectionId",
            "in": "path",
            "required": true,
            "type": "string"
          },
          {
            "name": "input",
            "in": "body",
            "required": true,
            "type": "object"
          },
          {
            "name": "api-version",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "202": {
            "type": "void"
          }
        }
      }
    }
  },
  "dga_webapiforportal": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "dga_WebApiForPortal": {
        "path": "/api/data/v9.2/dga_WebApiForPortal",
        "method": "POST",
        "parameters": [
          { "name": "actionName", "in": "body", "required": true, "type": "string" },
          { "name": "isAdmin", "in": "body", "required": true, "type": "boolean" },
          { "name": "userId", "in": "body", "required": false, "type": "string" },
          { "name": "tableName", "in": "body", "required": false, "type": "string" },
          { "name": "relatedId", "in": "body", "required": false, "type": "string" },
          { "name": "targetId", "in": "body", "required": false, "type": "string" },
          { "name": "fetchXml", "in": "body", "required": true, "type": "string" }
        ]
      }
    }
  }
};
