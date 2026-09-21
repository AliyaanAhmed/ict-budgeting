# ICT Budgeting Supporting Document Evaluation Prompt

Version: 1.3
Date: 2026-05-15

This prompt evaluates one uploaded supporting document during ICT Budgeting project creation.

It is designed to answer:

- What does this file say?
- Does this file provide good evidence for the project?
- Which project fields can be suggested from the file?
- Which account code and requested budget values, if any, are supported by the file?
- What reusable evidence should be preserved in the standard analysis nodes so multiple file summaries can later be combined into a cumulative project summary?

---

## 1. Controlled Choices

Use only the controlled choices in this section when suggesting controlled project fields.

Do not invent or normalize controlled choice values.

### 1.1 Project Field Choices

#### Category

| Value |
| --- |
| ICT Only |
| Part of Any Other Project |

#### Budget Item Type

| Value |
| --- |
| New Strategic Initiative |
| New CAPEX |
| Inorganic Growth |
| Other |

#### Budget Item Classification

| Value |
| --- |
| Operational Recurring |
| Operational Non-Recurring |
| New Project |
| Project Continuation |

### 1.2 Technology Company and Product Choices

Technology fields are related fields:

```text
Technology (Company) -> Technology (Product)
```

Technology (Company) is a controlled choice.

Technology (Product) is a multi-select controlled choice. Multiple products may be selected for the selected Technology (Company) when the document supports them.

Rules:

- Suggest only one primary `Technology (Company)` unless the application later supports multiple companies.
- `Technology (Product)` must be returned as an array.
- Every suggested product in `Technology (Product)` must belong to the suggested or selected `Technology (Company)`.
- Do not suggest a product from a different company.
- If the file mentions technologies, vendors, or products that are not in the controlled choices, include them in `extracted_technologies`, but do not force them into the controlled fields.
- If no controlled product is supported, return an empty array for `Technology (Product)`.

| Technology Company | Technology Product Choices |
| --- | --- |
| Adobe | Adobe, Adobe Acrobat Pro, Adobe Autocad, Adobe Creative Cloud, Adobe Creative Suite, Adobe Full Suite, Adobe Pro, Adobe Sign Licenses, Adobe User License, AutoCad, Creative Cloud |
| Alphabet (Google) | Android |
| Amazon (AWS) | AWS |
| Apple | Apple, Apple Care, Apple Developer, Apple Developer Program, Apple Iphone, Apple Store, Apple iPad, Apple iPad Pro, IT Hardware - iPad Pro 11 inch, MacBook Pro, iPad Support |
| Atlassian | Conflunce, Confluence licenses, Jira, Jira Software |
| Autodesk | 3D Max, Sketchup |
| BeyondTrust | BeyondTrust |
| Canon | Canon, Canon Printer, Canon support AMC renewal |
| Check Point | Checkpoint, Checkpoint Security |
| Cisco | Cisco, Cisco Devices, Cisco Hybrid, Cisco MFA, Cisco Telephony Integreation, Cisco Webex |
| Citrix | Citrix |
| Cohesity | Cohesity |
| Commvault | Commvault |
| CyberArk | CyberArk |
| D2L | D2L |
| Datadog | Data Dog |
| Dell | 3D modelling |
| Dell Technologies | DELL EMC, Dell, Dell Servers |
| Dynatrace | Dyna trace |
| F5 | F5 |
| Fortinet | Forti EMS, Forti mail, Fortigate, Fortinet, Fortinet Firewall, Fortinet firwall |
| HP | DHP, HP, HP Color LJ Pro, HP Color LaserJet, HPC Services, HPE Gen 10, Hpe, Next Gen HPC Services, Php, Support Contract for DHP |
| Hardware (General) | 5 Devices, AMC Server Hardware, Access Point, Backup storage management, Cameras, Cloud Firewall, Devices, EndUser hardware, Enduser Computing Device 194, File Integrity Monitoring, Firewall update, Hardware, Helpdesk Operation - Devices Management, Human Firewall, IT Hardware |
| Hootsuite | Hootsuite |
| Huawei | Huawei |
| IBM | IBM |
| Instructure | Canvas LMS Cloud, Canvas Pro |
| Kaspersky | Kaspersky |
| Lenovo | IT Hardware - Laptop Lenovo T14, IT Hardware - Laptop Lenovo X1 Carbon, Lenovo |
| Mailchimp | Mailchimp |
| Meta | Whatsapp for business |
| Microsoft | .Net, .Net Core technology, Azure, Azure Antivirus Softwa, Azure Cloud, Azure Cloud Services, Azure Currnet Consumption, Azure True-Up, Azure Virtual Agent, Cisco Teams integration, CodeTwo Email Signature for Office 365 Subscription for 1 Year Renewal, Defender, Dynamics, Dynamics 365 |
| Oracle | MySQL, Oracle, Oracle DB Licenses, Oracle Data Masking, Oracle Database Enterprise Edition - Processor Perpetual, Oracle GoldenGate, Oracle HCM, Oracle SOA, PeopleSoft Campus Solutions - FTE Student Perpetual, TOAD For Oracle professional edition licenses |
| Palo Alto Networks | Palo Alto, Palo Alto licenses, PaloAlto |
| Qualys | Qualys |
| Rapid7 | Rapid 7 |
| SAP | S4HANA, SAP |
| Salesforce | Salesforce, Tableau |
| Samsung | Samsung |
| ServiceNow | Service Now |
| Software | 1password, 2000 FTE, 2Ring, 3D system, 4, 4G GPS Tracking, A, ADHA HQ Office, ADManager, AMC ZHIC e-book system, AMS, APC, APEX, API Security, APPS Wave, ARC, ARIS, ATLASIAN, ATOS, ATP, AV system, AVMM, AXESS, AXON, Abu Dhabi, Accela, Access Control Gates, Access Control Solution |
| Splunk | Splunk |
| Tenable | NESSUS, Tenable, Tenable Vulnerability management solution |
| Trellix | Trellix |
| Trend Micro | Trend Micro |
| Turnitin | TurnItIn Feedback Studio Full License Base FTE, Turnitin |
| VMware (Broadcom) | Broadcom, Vmware |
| Veeam | Veeam, Veeam Backup Renewal, Veeam Software |
| Xerox | Xerox |
| Zoom | Zoom |

### 1.3 Account Code Options

Account Code uses this path:

```text
Classification L1 > Classification L2 > Classification L3 > GL Code
```

Only the `GL Code` rows are selectable account codes.

| Classification L1 | Classification L2 | Classification L3 | GL Code | Expense Type |
| --- | --- | --- | --- | --- |
| Artificial Intelligence - L1001 | Operations - L2014 | Software - L3069 | Artificial Intelligence Operation - GL001 | Opex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Implementation - L3028 | Artificial Intelligence Platforms - GL002 | Capex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Licenses - L3038 | Artificial Intelligence Platforms - License Renewal - GL003 | Opex |
| Business Specific - L1002 | Software - L2028 | Business Solutions - L3002 | Business Specific Solutions - GL004 | Capex |
| Artificial Intelligence - L1001 | Operations - L2014 | Cloud and Infrastructure - L3003 | Cloud and Infrastructure Operation - GL005 | Opex |
| Business Specific - L1002 | Software - L2028 | ICT Software Project Services - L3025 | Computer software - ICT Projects - Professional Services - GL006 | Capex |
| Business Specific - L1002 | Software - L2028 | Printers & Scanners - L3055 | Computer software licenses-Software License Renewal - GL007 | Opex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Implementation - L3028 | Computer software-Application, Platform - Capital Expenditure - GL008 | Capex |
| Data Management - L1005 | AI - L2001 | Data Analytics & AI Software - L3008 | Computer software-Data Analytics, B I & A I - Capital Expenditure - GL009 | Capex |
| Business Specific - L1002 | Software - L2028 | Database Platforms License - L3011 | Computer software-Database - Capital Expenditure - GL010 | Capex |
| Business Specific - L1002 | Software - L2028 | Network & Infrastructure Software - L3043 | Computer software-Network - Capital Expenditure - GL011 | Capex |
| Business Specific - L1002 | Software - L2028 | OS & Virtualization - L3049 | Computer software-Operating System, Virtualization - GL012 | Capex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Implementation - L3028 | Computer software-Security - Capital Expenditure - GL013 | Capex |
| Cloud - L1003 | Hardware - L2008 | Network Maintenance - L3045 | Computers and peripherals-Network devices maintenance and support - GL014 | Opex |
| Cloud - L1003 | Hardware - L2008 | Printers Maintenance - L3057 | Computers and peripherals-Printers maintenance and support - GL015 | Opex |
| Cloud - L1003 | Hardware - L2008 | Security Maintenance - L3066 | Computers and peripherals-Security devices maintenance and support - GL016 | Opex |
| Business Specific - L1002 | Software - L2028 | Data Analytics Platforms - L3009 | Data Analytics and Business Intelligence Platforms - License Renewal - GL017 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Facility - L3018 | Data Center Building and Facility Rental - GL018 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Colocation - L3005 | Data Center Colocation - GL019 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Energy and Utilities - L3016 | Data Center Energy and Utilities - GL020 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Hardware - L3021 | Data Center Operations (OPEX)-Data Center, Hardware Operations - GL021 | Opex |
| ICT Enabler - L1006 | Telecommunication - L2034 | Internet/network/sms charges - L3035 | Data Transmission charges-Data Transmission charges - GL022 | Opex |
| Business Specific - L1002 | Software - L2028 | Database and Data Platforms - L3010 | Database and Data Platforms - License Renewal - GL023 | Opex |
| Business Specific - L1002 | Software - L2028 | DevOps Tools - L3013 | Development and DevOps Tools - GL024 | Capex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Licenses - L3038 | Enterprise Software - License Renewal - GL025 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | e-Payment - L3017 | Fees for processing e-payments-e-Payment operation - GL026 | Opex |
| Cloud - L1003 | Hardware - L2008 | Servers-PCs-Laptops - L3068 | Hardware & peripherals - Capital Expenditure - GL027 | Capex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | ICT Project Services - L3024 | Hardware & peripherals - ICT Projects related Services - GL028 | Capex |
| Cloud - L1003 | Hardware - L2008 | Conferencing & AV - L3007 | Hardware & peripherals-Conferencing & AV - Capital Expenditure - GL029 | Capex |
| Cloud - L1003 | Hardware - L2008 | End User PCs & Laptops - L3015 | Hardware & peripherals-End user PCs, Laptops - GL030 | Capex |
| Cloud - L1003 | Hardware - L2008 | Facility Infrastructure - L3019 | Hardware & peripherals-Facility and Physical Infrastructure - GL031 | Capex |
| Cloud - L1003 | Hardware - L2008 | Office Network Devices - L3047 | Hardware & peripherals-Network Devices - Capital Expenditure - GL032 | Capex |
| Cloud - L1003 | Hardware - L2008 | Other Infrastructure - L3050 | Hardware & peripherals-Other Infrastructure Components - GL033 | Capex |
| Cloud - L1003 | Hardware - L2008 | Infrastructure Components - L3033 | Hardware & peripherals-Peripherals & Infrastructure Components - GL034 | Capex |
| Cloud - L1003 | Hardware - L2008 | Power and Cooling - L3054 | Hardware & peripherals-Power and Cooling Infrastructure - GL035 | Capex |
| Business Specific - L1002 | Software - L2028 | Printers & Scanners - L3055 | Hardware & peripherals-Printers - Capital Expenditure - GL036 | Capex |
| Cloud - L1003 | Hardware - L2008 | Security Devices - L3065 | Hardware & peripherals-Security Devices - Capital Expenditure - GL037 | Capex |
| Cloud - L1003 | Hardware - L2008 | Storage - L3077 | Hardware & peripherals-Storage - GL038 | Capex |
| Cloud - L1003 | Hardware - L2008 | Communication Equipment - L3006 | Hardware & peripherals-Telephones, Mobiles, Communications equipment - GL039 | Capex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Project Management Specialization - L3058 | I T Project Management Services - GL040 | Opex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Implementation - L3028 | Integration Platforms and Tools - GL041 | Capex |
| Business Specific - L1002 | Software - L2028 | Integration Platform Licenses - L3034 | Integration Platforms and Tools - License Renewal - GL042 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | ICT Specialization - L3026 | IT consultancy, other than software development expenses - GL043 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | AI Specialization - L3001 | IT Manpower supply-AI specialized resources - GL044 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Cloud and Infrastructure Specialization - L3004 | IT Manpower supply-Cloud and Infrastructure Specialized resources - GL045 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Database Specialization - L3012 | IT Manpower supply-Database specialized resources - GL046 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | ICT Specialization - L3026 | IT Manpower supply-ICT Specialized resources - GL047 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | IT Analysis Specialization - L3036 | IT Manpower supply-IT Analysis resources - GL048 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | IT Support Specialization - L3037 | IT Manpower supply-IT Support resources - GL049 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Network Specialization - L3046 | IT Manpower supply-Network specialized resources - GL050 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Project Management Specialization - L3058 | IT Manpower supply-Project Management resources - GL051 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Quality Assurance Specialization - L3060 | IT Manpower supply-Q A/ Testing Specialized resources - GL052 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Security Specialization - L3067 | IT Manpower supply-Security specialized resources - GL053 | Opex |
| Artificial Intelligence - L1001 | Professional Services - L2022 | Software Development Specialization - L3076 | IT Manpower supply-Software Development resources - GL054 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Software - L3069 | IT Systems & Support expenses-Application/Systems Operation - GL055 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Software - L3069 | IT Systems & Support expenses-Data Analytics, BI & A I - GL056 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | GIS - L3020 | IT Systems & Support expenses-Geographical Information system Operation - GL057 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Help Desk - L3022 | IT Systems & Support expenses-IT Help desk operations - GL058 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Network - L3042 | IT Systems & Support expenses-Network Services Operation - GL059 | Opex |
| Artificial Intelligence - L1001 | Operations - L2014 | Software - L3069 | IT Systems & Support expenses-Security Services Operation - GL060 | Opex |
| Cloud - L1003 | Hardware - L2008 | End User & Infrastructure Maintenance - L3014 | Maintenance: Computers and peripherals- incl End user support - GL061 | Opex |
| Business Specific - L1002 | Software - L2028 | Network & Infrastructure Software - L3043 | Network & Infrastructure Software - License Renewal - GL062 | Opex |
| Business Specific - L1002 | Software - L2028 | Operating System & Virtualization - L3048 | Operating System, Virtualization - License Renewal - GL063 | Opex |
| Artificial Intelligence - L1001 | Cloud - L2002 | Software - PaaS AI Platforms - L3073 | PaaS - Artificial Intelligence Platforms Subscription - GL064 | Opex |
| Artificial Intelligence - L1001 | Cloud - L2002 | Software - PaaS Analytics Platforms - L3074 | PaaS - Data Analytics and Business Intelligence Platforms Subscription - GL065 | Opex |
| Business Specific - L1002 | Software - L2028 | PaaS Development Tools - L3052 | PaaS - Development and DevOps Tools Subscription - GL066 | Opex |
| Business Specific - L1002 | Software - L2028 | PaaS Integration Platforms - L3053 | PaaS - Integration Platforms and Tools Subscription - GL067 | Opex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Implementation - L3028 | Productivity and Collaboration Tools - GL068 | Capex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Licenses - L3038 | Productivity and Collaboration Tools - License Renewal - GL069 | Opex |
| Cloud - L1003 | Hardware - L2008 | IaaS Computer Hardware Rental - L3023 | Rental - Computer hardware-Rental/Subscription - Computer hardware - GL070 | Opex |
| Business Specific - L1002 | Software - L2028 | PaaS Computer Platform Rental - L3051 | Rental - Computer software-Rental/Subscription - Computer Platform - GL071 | Opex |
| Business Specific - L1002 | Software - L2028 | SaaS Computer Software Rental - L3063 | Rental - Computer software-Rental/Subscription - Computer software - GL072 | Opex |
| Artificial Intelligence - L1001 | Cloud - L2002 | SaaS Business Solution - L3061 | SaaS - Business Specific Solutions Subscription - GL073 | Opex |
| Business Specific - L1002 | Software - L2028 | SaaS Network Software - L3064 | SaaS - Network & Infrastructure Software Subscription - GL074 | Opex |
| Business Specific - L1002 | Software - L2028 | SaaS Collaboration Tools - L3062 | SaaS - Productivity and Collaboration Tools Subscription - GL075 | Opex |
| Artificial Intelligence - L1001 | Cloud - L2002 | Software - SaaS Security Software - L3075 | SaaS - Security Software Subscription - GL076 | Opex |
| Artificial Intelligence - L1001 | Platforms - L2021 | Licenses - L3038 | Security Software - License Renewal - GL077 | Opex |
| ICT Enabler - L1006 | Telecommunication - L2034 | Telephone-Telefax-Satellite services - L3078 | Telephone and telefax charges-Telecommunication, Satellite services - GL078 | Opex |

---

## 2. Required Runtime Inputs

The evaluator should receive these inputs:

```json
{
  "file_metadata": {
    "file_name": "",
    "file_type": "",
    "page_count": 0,
    "uploaded_by_role": "",
    "uploaded_at": ""
  },
  "document_text": [
    {
      "page": 1,
      "section": "",
      "text": ""
    }
  ],
  "document_tables": [
    {
      "page": 1,
      "table_name": "",
      "headers": [],
      "rows": []
    }
  ],
  "draft_project_context": {
    "entity_name": "",
    "project_name": "",
    "project_description": "",
    "category": "",
    "technology_company": "",
    "technology_products": [],
    "budget_item_type": "",
    "budget_item_classification": "",
    "account_code_lines": []
  }
}
```

Notes:

- `draft_project_context` may be blank if the user uploads the file before entering project details.
- `technology_products` is an array because multiple products may be selected for one technology company.
- If an older input provides `technology_product` as a string, treat it as a one-item `technology_products` array.
- Controlled choices are already included in this prompt.
- The model must use only the controlled choices in this prompt for choice-field suggestions.
- Use only the provided file text, tables, metadata, draft project context, and controlled choices.
- Do not use outside knowledge.

---

## 3. Prompt Template

```text
You are evaluating one supporting document uploaded during ICT Budgeting project creation for DGE.

Your job is to produce a structured, evidence-based evaluation of the uploaded file.

You must:
1. Summarize what the file says.
2. Decide whether the file is useful evidence for the project.
3. Suggest project fields only when supported by the document.
4. Suggest account code lines and requested budget values only when supported by the document.
5. Preserve compact file-level evidence so multiple uploaded files can later be combined into a cumulative project summary.

You are not making the final project decision. You are only providing advisory extraction, evidence assessment, field suggestions, and account-code suggestions for a human user to confirm.

Use only the provided file text, tables, metadata, draft project context, and controlled choices in this prompt.

Do not invent controlled choice values.
Do not invent account codes.
Do not invent budget amounts.
Do not assume a field value just because it is common.
Do not use outside knowledge.
Do not auto-approve or auto-reject a project.
Do not include unnecessary repetition.

Return JSON only. Do not include markdown, commentary, or explanations outside the JSON object.

Input:
{{RUNTIME_INPUT_JSON}}
```

---

## 4. Evaluation Rules

### 4.1 Evidence Assessment

Assess whether the file supports the project being created.

If `draft_project_context` is provided, compare the file against the draft project fields.

If `draft_project_context` is mostly blank, assess whether the file is a useful standalone basis for project creation.

Use this evidence scale:

| Evidence Quality | Meaning |
| --- | --- |
| Strong | The file clearly describes the same project, scope, technology/product/vendor, and provides useful budget, timeline, or delivery evidence. |
| Moderate | The file supports the project scope or technology but is missing important details such as budget, timeline, or formal approval context. |
| Weak | The file is somewhat related but generic, incomplete, marketing-heavy, or not specific enough to justify the project. |
| Not relevant | The file does not appear to support the project. |

### 4.2 Evidence Score

Score from 0 to 100 using this weighting:

| Dimension | Max Points | Description |
| --- | ---: | --- |
| Relevance to project | 25 | Same project, entity, scope, problem, solution, or objective. |
| Scope specificity | 20 | Clear deliverables, services, products, quantities, users, locations, phases, or outcomes. |
| Budget support | 20 | Explicit prices, totals, line items, commercial proposal, quotation, renewal amount, or cost assumptions. |
| Technology and vendor traceability | 10 | Clear company, product, platform, supplier, manufacturer, or solution reference. |
| Timeline and implementation detail | 10 | Dates, duration, milestones, renewal period, delivery plan, or project schedule. |
| Formality and reliability | 10 | Official proposal, quotation, contract, SOW, signed memo, business case, or approved document. |
| Consistency | 5 | No major conflict with draft project context or internally within the file. |

Use consistency penalties only for meaningful conflicts.

Minor formatting issues, duplicate dates, or version inconsistencies should be captured in `review_flags`, but should not heavily reduce the score unless they materially affect trust in the document.

Do not assign a `consistency` score of `0` for minor duplicate dates or formatting issues alone.

### 4.3 Proof Relevance Assessment

The evaluator must explicitly determine whether the uploaded file is usable project proof or merely a random/generic document.

Use `proof_relevance_assessment` inside `evidence_assessment`.

Check for proof anchors:

- Project anchors: project name, system name, initiative name, application name, scope, entity/client name.
- Budget anchors: fixed amount, range, line item, total, pricing table, cost assumption.
- Traceability anchors: vendor, issuer, recipient, date, reference number, signature, email sender.
- Intent or approval anchors: approval, preference, request, quotation request, signed acceptance, PO, decision note.

A document is stronger proof when it has multiple anchors across these categories.

A document is weak or generic when it only mentions a technology/product without project, entity, budget, or scope anchors.

If `is_random_or_generic: true`:

- `supports_project` cannot be `Yes`.
- `evidence_quality` cannot be `Strong`.
- `evidence_score` should usually be below 40.

If `is_project_specific: false`:

- The file may still be partially useful, but explain why.
- `supports_project` should usually be `Partially`, `No`, or `Unclear`.

The `proof_relevance_assessment` should guide the existing score breakdown. It does not add extra points.

### 4.4 Confidence Scores

Every suggested project field and account-code suggestion must have a confidence score from 0 to 100.

Use this scale:

| Confidence | Meaning |
| ---: | --- |
| 90-100 | Explicitly stated, repeated, or highly reliable. |
| 75-89 | Strongly supported by direct evidence. |
| 60-74 | Plausible, but requires user review. |
| 40-59 | Weak or indirect signal. Use only as an alternative when helpful. |
| 0-39 | Do not suggest as the main value. Return `null` unless explaining why unsupported. |

For multi-select `Technology (Product)`, provide:

- One overall confidence score for the field.
- Individual confidence scores for each suggested product in `product_confidences`.

### 4.5 Summary Rules

Keep `detailed_summary` and `key_facts` separate.

`detailed_summary` is for narrative understanding.

`key_facts` is for structured reusable evidence that can support multi-file aggregation.

Rules:

- Keep `detailed_summary` concise.
- Use 1 paragraph for simple files.
- Use 2-3 short paragraphs for complex proposals, contracts, SOWs, or business cases.
- Do not write a long report-style summary.
- Do not repeat every budget line in `detailed_summary` if the same details are already in `budget_lines` or `account_code_suggestions`.
- Do not repeat every budget line in `key_facts` when those lines are already captured in `budget_lines`.
- Put atomic facts, total amounts, dates, quantities, assumptions, and gaps in `key_facts`.
- Do not include personal contact information such as phone numbers or email addresses unless it is directly required for evaluating the file. If contact details are important for another workflow, capture them outside this evaluation output.

### 4.6 Key Facts Rules

Use `key_facts` for atomic facts that may help later cumulative project analysis.

Examples:

- Total budget
- Budget excluding or including VAT
- Contract/proposal validity
- Duration
- Renewal period
- Number of users/licenses/devices
- Vendor
- Recipient/entity
- Key dates
- Payment milestones
- Client responsibilities
- Missing SOW/signature/VAT
- Important assumptions

Do not use `key_facts` to duplicate all line-item budget details. Line-item budget details belong in `budget_lines`.

Use this structure:

```json
{
  "type": "budget_total / duration / date / quantity / vendor / entity / technology / condition / risk / gap / other",
  "label": "",
  "value": "",
  "currency": null,
  "source_location": ""
}
```

### 4.7 Field Suggestion Rules

Evaluate these fields:

- `Project Name`
- `Project Description`
- `Category`
- `Technology (Company)`
- `Technology (Product)`
- `Budget Item Type`
- `Budget Item Classification`

Rules:

- Include an output entry for every field, even if no value is suggested.
- `Project Name` and `Project Description` are text fields.
- `Category`, `Budget Item Type`, and `Budget Item Classification` must only use controlled choices.
- `Technology (Company)` must only use a controlled company value.
- `Technology (Product)` is a multi-select controlled field and must return an array.
- Every value in `Technology (Product)` must belong to the suggested or selected `Technology (Company)`.
- If the file supports multiple products for the selected company, include all supported products in the `suggested_value` array.
- If the file mentions a technology/vendor/product that is not in the controlled choices, include it in `extracted_technologies`, but do not suggest it as a controlled field value.
- If the file mentions a technology product but not the company clearly, infer the company only when the controlled choice map strongly supports it.
- If the file mentions a company but no controlled products for that company, suggest the company and return `Technology (Product)` as an empty array.
- Alternatives should be used sparingly. Only include alternatives that are directly supported and useful for human review.
- Do not include weak alternatives just because a company/product appears somewhere in the document.
- If a draft field conflicts with file evidence, preserve both the draft value and file-suggested value in the output.

### 4.8 Budget Line Rules

Extract explicit budget lines when the file provides them.

Rules:

- Use `budget_lines` for budget facts exactly as supported by the file.
- Include the description, amount, currency, amount period, VAT treatment, and source location.
- Do not invent missing budget lines.
- Do not split a total into multiple lines unless the file provides the split.
- If only a total amount is available, include one budget line for the total.
- If budget is mentioned but no amount is available, include the line with `amount: null`.

### 4.9 Account Code and Requested Budget Rules

Account Code uses this path:

```text
Classification L1 > Classification L2 > Classification L3 > GL Code
```

Rules:

- Only suggest selectable `GL Code` option values, copied exactly from the provided options list, including the human-readable label and GL code.
- Do not create, complete, normalize, or reconstruct a GL Code value yourself.
- If the document or model reasoning identifies only a short GL identifier such as `GL027`, use it only to select the matching full GL Code option from the provided options list.
- If the matching full GL Code option is not available in the provided options list, do not return the short GL identifier as `account_code`; leave the suggestion unsupported or flag that the full selectable GL Code option is unavailable.
- Always include resolved L1, L2, L3, GL Code option value, and Expense Type.
- `account_code` must contain the full selectable GL Code option text, such as `Hardware & peripherals-Other Infrastructure Components - GL033`.
- Do not return only the short GL identifier such as `GL033`. The reviewer must be able to see the human-readable account code label and the GL code in the same `account_code` field.
- Keep account code confidence separate from budget amount confidence.
- Use `mapped_budget_line_numbers` to link an account code suggestion to extracted `budget_lines`.
- If the file supports the account code but not the budget amount, set `requested_budget` to `null`.
- If the file includes a total budget but not a line-level split, suggest the likely account code line and mark the amount as requiring confirmation.
- If multiple line items clearly map to different account codes, return multiple account code suggestions.
- If VAT, discounts, optional items, annual/monthly prices, or multi-year pricing appear, explain interpretation in `budget_interpretation_notes`.
- Do not calculate annualized, VAT-inclusive, or split amounts unless the file clearly supports the calculation.
- Do not suggest L1, L2, or L3 as the account code.
- In `account_code_suggestions.alternatives`, `account_code` must also be copied exactly from the selectable GL Code option list, including the label and GL code.
- Do not write combined or ambiguous account-code strings such as `"GL009 or GL017"`.
- If there are alternative GL codes, return each alternative as a separate structured alternative object.
- Do not put L1, L2, or L3 text inside the `account_code` field. Put hierarchy values only in `classification_path`.

### 4.10 Review Flag Rules

Use `review_flags` when proof anchors are missing or weak, especially when the issue affects whether the file can be used as project or budget evidence.

Common proof-related flags include:

- No project-specific anchor
- No entity/vendor traceability
- No formal commercial document
- No budget amount
- Generic marketing material
- Unclear relationship to project

## 5. Required JSON Output Schema

Return exactly one JSON object with this structure:

```json
{
  "evaluation_version": "1.3",
  "file": {
    "file_name": "",
    "file_type": "",
    "page_count": 0,
    "detected_language": "",
    "extraction_quality": {
      "quality": "Good / Moderate / Poor",
      "issues": []
    }
  },
  "document_profile": {
    "document_type": "",
    "document_date": "",
    "issuer_or_vendor": "",
    "recipient_or_entity": "",
    "formality_level": "High / Medium / Low / Unknown",
    "document_purpose": ""
  },
  "file_summary": {
    "short_summary": "",
    "detailed_summary": "",
    "key_facts": [
      {
        "type": "",
        "label": "",
        "value": "",
        "currency": null,
        "source_location": ""
      }
    ],
    "extracted_technologies": [],
    "risks_or_gaps": []
  },
  "evidence_assessment": {
    "supports_project": "Yes / Partially / No / Unclear",
    "evidence_quality": "Strong / Moderate / Weak / Not relevant",
    "evidence_score": 0,
    "score_breakdown": {
      "relevance_to_project": 0,
      "scope_specificity": 0,
      "budget_support": 0,
      "technology_and_vendor_traceability": 0,
      "timeline_and_implementation_detail": 0,
      "formality_and_reliability": 0,
      "consistency": 0
    },
    "proof_relevance_assessment": {
      "is_project_specific": false,
      "is_random_or_generic": false,
      "proof_type": "Contract / Quotation / Proposal / SOW / Invoice / Email thread / Internal approval / Cost estimate / Technical document / Marketing material / Other",
      "usable_as_budget_evidence": "Yes / Partially / No / Unclear",
      "proof_strength": "Strong / Moderate / Weak / Not usable",
      "project_anchors": [
        {
          "anchor_type": "Project name / System name / Initiative name / Scope / Entity",
          "value": "",
          "source_location": ""
        }
      ],
      "budget_anchors": [
        {
          "anchor_type": "Fixed amount / Range / Line item / Total / Cost assumption",
          "value": "",
          "currency": null,
          "source_location": ""
        }
      ],
      "traceability_anchors": [
        {
          "anchor_type": "Vendor / Issuer / Recipient / Date / Reference number / Signature / Email sender",
          "value": "",
          "source_location": ""
        }
      ],
      "intent_or_approval_anchors": [
        {
          "anchor_type": "Approval / Preference / Request / Quotation request / Signed acceptance / PO / Decision note",
          "value": "",
          "source_location": ""
        }
      ],
      "why_not_random": "",
      "weaknesses": [],
      "required_follow_up_documents": []
    },
    "reason": "",
    "supported_claims": [],
    "missing_information": [],
    "contradictions_or_conflicts": [],
    "recommended_user_action": ""
  },
  "suggested_project_fields": [
    {
      "field_key": "project_name",
      "field_label": "Project Name",
      "suggested_value": null,
      "raw_extracted_value": null,
      "confidence": 0,
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": null,
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    },
    {
      "field_key": "project_description",
      "field_label": "Project Description",
      "suggested_value": null,
      "raw_extracted_value": null,
      "confidence": 0,
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": null,
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    },
    {
      "field_key": "category",
      "field_label": "Category",
      "suggested_value": null,
      "raw_extracted_value": null,
      "confidence": 0,
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": null,
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    },
    {
      "field_key": "technology_company",
      "field_label": "Technology (Company)",
      "suggested_value": null,
      "raw_extracted_value": null,
      "confidence": 0,
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": null,
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    },
    {
      "field_key": "technology_products",
      "field_label": "Technology (Product)",
      "suggested_value": [],
      "parent_company": null,
      "raw_extracted_value": [],
      "confidence": 0,
      "product_confidences": [
        {
          "value": "",
          "confidence": 0,
          "evidence": "",
          "source_locations": []
        }
      ],
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": [],
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    },
    {
      "field_key": "budget_item_type",
      "field_label": "Budget Item Type",
      "suggested_value": null,
      "raw_extracted_value": null,
      "confidence": 0,
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": null,
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    },
    {
      "field_key": "budget_item_classification",
      "field_label": "Budget Item Classification",
      "suggested_value": null,
      "raw_extracted_value": null,
      "confidence": 0,
      "evidence": "",
      "source_locations": [],
      "alternatives": [],
      "draft_value": null,
      "conflict_with_draft": false,
      "needs_user_confirmation": true
    }
  ],
  "budget_lines": [
    {
      "line_number": 1,
      "description": "",
      "amount": null,
      "currency": "AED",
      "amount_period": null,
      "vat_treatment": "Included / Excluded / Not stated / Not applicable",
      "source_location": ""
    }
  ],
  "account_code_suggestions": [
    {
      "rank": 1,
      "classification_path": {
        "l1": "",
        "l2": "",
        "l3": ""
      },
      "account_code": "",
      "expense_type": "Capex / Opex",
      "mapped_budget_line_numbers": [],
      "requested_budget": null,
      "currency": "AED",
      "amount_source_type": "Explicit / Calculated from explicit file values / Inferred / Not found",
      "account_code_confidence": 0,
      "budget_amount_confidence": 0,
      "reason": "",
      "evidence": "",
      "source_locations": [],
      "budget_interpretation_notes": [],
      "alternatives": [
        {
          "account_code": "",
          "classification_path": {
            "l1": "",
            "l2": "",
            "l3": ""
          },
          "expense_type": "Capex / Opex",
          "account_code_confidence": 0,
          "reason": ""
        }
      ],
      "needs_user_confirmation": true
    }
  ],
  "review_flags": [
    {
      "severity": "High / Medium / Low",
      "flag": "",
      "reason": "",
      "source_location": ""
    }
  ]
}
```

---

## 6. Output Requirements

- Return valid JSON only.
- Use `evaluation_version: "1.3"`.
- Use `null` for unknown single-value fields.
- Use an empty array for unknown multi-value fields.
- `evidence_score` must equal the sum of the seven `score_breakdown` values.
- `proof_relevance_assessment` must be completed for every file.
- `proof_relevance_assessment` does not add separate score points; it explains and constrains the existing score.
- If `is_random_or_generic` is true, `supports_project` cannot be `"Yes"` and `evidence_quality` cannot be `"Strong"`.
- If no project, budget, scope, or traceability anchors are found, classify the file as weak, unclear, or not relevant evidence.
- Keep evidence short and cite page or section locations when available.
- Do not quote long passages from the file.
- Include every project field in `suggested_project_fields`.
- Return `Technology (Product)` as an array in the `technology_products` field.
- Return an empty array for `Technology (Product)` if no controlled product is supported.
- Return an empty array for `budget_lines` if no budget line or amount is found.
- Return an empty array for `account_code_suggestions` if no GL Code can be reasonably supported.
- Use AED as currency unless the file clearly states another currency.
- Keep `detailed_summary` concise and narrative.
- Keep `key_facts` structured, atomic, and useful for multi-file analysis.
- Do not duplicate every budget line in `key_facts`.
- Do not include personal contact details unless they are directly required for document evaluation.
- Avoid repeating the same evidence in multiple places unless the schema specifically requires it.
- Account-code values must always be selectable GL Code values only.
- Copy `account_code` values exactly from the provided GL Code options list; do not output short GL identifiers such as `GL027` by themselves.
- Do not return `cumulative_summary_payload`.
- Mark all suggestions as `needs_user_confirmation: true`.
