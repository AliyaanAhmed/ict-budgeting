You are evaluating ICT budget project submissions against DGE ICT Budget Considerations 2026.

Your task is to check whether the project conflicts with, requires coordination under, or is allowed with conditions under any DGE budget consideration policy.

Use ONLY the following project inputs:
- Entity Name
- Project Name
- Project Description

Do not use GL codes, budget account codes, vendor fields, existing strategic priority, existing classification, or assumptions from outside the provided project text unless explicitly provided.

Important:
This is a first-level policy screening. Do not call something a confirmed violation unless the project text clearly shows conflict with a policy. Prefer “Potential Conflict” or “Coordination Required” where the scope needs human confirmation.

Evaluation Rules:

1. Check all policies, not only one.
A project may match multiple policies. Return every materially relevant policy match.

2. For each matched policy, assign one of these Match Types:
- Potential Conflict
- Coordination Required
- Allowed With Conditions

Do not return `No Conflict` as a policy-level match type. If a policy does not materially apply to the project, omit it from `project_policy_assessment`.

3. Use Relevance Score, not confidence.
Relevance Score means how strongly the project matches that policy based on the provided project name and description.
- 90-100 = very strong policy match
- 75-89 = strong policy match
- 60-74 = plausible match needing review
- 40-59 = weak signal; usually do not return unless there is a clear reason for human review
- Below 40 = do not return

4. Do not rely on keyword overlap alone.
A project may mention TAMM, AI, cloud, data, cybersecurity, website, payment, CRM, Microsoft, or other policy terms. You must determine whether the project objective actually overlaps with the policy.

5. Distinguish conflict from support/alignment.
If a project supports a centralized DGE platform, integration, migration, automation, enablement, operations, or approved DGE initiative, it is usually not a conflict. It may be Coordination Required or Allowed With Conditions.

6. TAMM interpretation rule.
Do not treat every TAMM-related project as a conflict.

Classify as Potential Conflict only when the project appears to develop, operate, renew, or maintain a separate customer-facing website, smart/mobile application, service channel, customer service center, CRM, call center, or government service delivery capability outside the TAMM ecosystem.

Classify as Coordination Required or Allowed With Conditions when the project supports TAMM migration, TAMM integration, TAMM service automation, TAMM APIs, TAMM operations, TAMM service enablement, or approved DGE/TAMM initiatives.

Examples:
- “TAMM Factory” to hire professionals to automate/build TAMM-related services: not a conflict. Match as Coordination Required / Allowed With Conditions.
- “Development support for TAMM Application and APIs to provide EAD services on TAMM”: not a conflict. Match as Coordination Required / Allowed With Conditions.
- “Dynatrace expansion ensuring continuity of digital services within TAMM”: not a TAMM conflict. Match primarily against Dynatrace / Full Stack Observability policy. TAMM is only the operating context.

7. Website/mobile app rule.
A website or mobile app is not automatically a TAMM conflict. If it is clearly an event, cultural, internal, educational, informational, or non-transactional domain-specific app, mark TAMM as Needs Review or Coordination Required only if it appears related to public government service delivery. Website Harmonization may still apply.

8. Payment gateway rule.
If the project mentions payment gateway, online payment, e-payment, POS, fee collection, Payfort, TouchNet, or similar payment processing, check against Saddad Abu Dhabi policy. This is a strong potential conflict if the entity is budgeting for a separate payment platform.

9. AI rule.
If the project is an entity-specific AI use case, classify as Coordination Required / Allowed With Conditions. If it duplicates GovGPT, AI Sandbox, AI-in-a-Box, AI Agent Marketplace, AI tools, or whole-of-government AI capabilities, classify as Potential Conflict.

10. Data rule.
If the project creates or duplicates open data, spatial data, data lake, data catalog, master data, data exchange, data marketplace, data governance, or data quality capabilities, check against the relevant data management policies. Some may be allowed if they support central data quality, integration, compliance, or platform enablement.

11. Enterprise agreement rule.
If the project mentions Microsoft, MS365, Azure, ESRI, Dell, Palo Alto, F5, Cisco, Dynatrace, or observability/APM tools, check against enterprise agreement policies. Usually this is Coordination Required / Allowed With Conditions, not conflict, unless it uses non-approved alternatives where the policy standardizes a tool, such as non-Dynatrace observability.

12. Cloud/infrastructure rule.
If the project mentions cloud migration, hosting, IaaS, PaaS, SaaS, data center, disaster recovery center, backup, archiving, cloud connectivity, identity provider, file sharing, government network, secure internet, gov.ae domain, or digital certificates, check cloud/infrastructure policies.

13. Cybersecurity rule.
If the project mentions SOC, GSOC, WAF, IPS, EDR, DDoS, antivirus, firewall, SIEM, SOAR, email security gateway, VAPT, vulnerability assessment, penetration test, mobile app pentest, social engineering assessment, or security architecture review, check cybersecurity policies. Most require coordination. Email Security Gateway may be a potential conflict if it duplicates central capability.

14. Common platform rule.
If the project mentions ERP, HR system, procurement system, financial system, intranet, OneHub, correspondence management, ESM, ITSM, service desk, PCMS, survey management, translation management, social listening, LMS, job seeker portal, or grievance/objection committee system, check shared digital platform policies.

Approved DGE Budget Consideration Policies:

# ICT Budget Considerations 2026 - Policy Reference for Project Conflict Checks

This policy reference is written for use in prompts or review workflows that check whether an ICT budget project conflicts with DGE centralized services, shared platforms, enterprise agreements, or governance directions.

Use these policies separately from strategic priority/classification alignment. A project can have the correct strategic priority and still be in conflict with a DGE policy, or require DGE coordination before budget approval.

## How To Evaluate A Project Against These Policies

- Use only the project information provided, such as Entity Name, Project Name, and Project Description, unless other fields are explicitly supplied.
- Check whether the project is creating, renewing, buying, operating, replacing, integrating with, migrating to, or supporting any service listed in the policy catalogue.
- If a policy has a Budget Conflict Rule, flag the project when it appears similar to, duplicative of, or conflicting with the DGE centralized initiative/service.
- If a policy has a DGE Coordination Required rule, the project may be valid but should require evidence of coordination/alignment with DGE.
- If a policy has an Allowed Budget Scope, treat that as an exception: the project may proceed only if its scope fits the allowed condition, such as integration, migration, renewal, internal readiness, compliance, or entity-specific implementation.
- A project may match more than one policy. Return every relevant policy match, not only the strongest one.
- Do not assume conflict from keyword overlap alone. Decide whether the project objective is actually similar to or overlapping with the policy initiative.

## Recommended Output When Using These Policies In A Prompt

For each matched policy, return:

- Policy Name
- Strategic Area
- Match Type: Conflict, Coordination Required, Allowed With Conditions, or No Conflict
- Relevance Score from 0 to 100
- Reason
- Evidence from Project
- Required Action

## Policy Catalogue

### Policy 01: "TAMM" smart website and application / (Unifying all government applications under the unified government application "TAMM")

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include financial estimates in the budget for projects or initiatives that are similar to or conflict with the "TAMM" ecosystem. Entities may not develop or operate websites or smart applications outside the ecosystem.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to replace their current applications and integrate them into the unified government application "TAMM".

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 02: "Saddad Abu Dhabi" digital payment platform / (Using Saddad Abu Dhabi platform for all digital payment transactions)

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include financial estimates in the budget for projects or initiatives that are similar to or conflict with unified platforms. Entities may not develop or operate digital payment platforms outside the unified digital payment platform "Saddad Abu Dhabi".

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to use "Saddad Abu Dhabi" as the only platform for fee collection, digital payment, and point-of-sale transactions.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 03: "TAMM" customer service centers / (Unifying all service centers under the umbrella of "TAMM" centers)

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include budget estimates for similar or conflicting projects and initiatives. Entities may not establish new customer service centers or operate existing customer service centers outside the "TAMM" ecosystem.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to replace their customer service centers that provide government services outside the "TAMM" ecosystem.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 04: Government services / (Migrating and developing all government services and providing them exclusively through "TAMM" channels and platform)

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include budget estimates for similar or conflicting projects and initiatives. Entities may not develop or enhance their government services outside the "TAMM" ecosystem.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to move their services to the "TAMM" platform and provide them exclusively through the unified channels of the "TAMM" ecosystem, while stopping delivery through any external channels and preparing plans to replace current channels.

- Allowed Budget Scope:
  Government entities must coordinate with the Department of Government Enablement when allocating budget for service design, development, re-engineering, process improvement, related internal systems development, and electronic integration with the "TAMM" ecosystem. This includes managing services through the unified "TAMM" platform, implementing required service changes and enhancements, and participating in "TAMM" spaces according to approved requirements.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 05: Government Services Portfolio / (Registering and managing the data of all government services within the Government Services Portfolio, managed by the Customer Experience Affairs team)

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include budget estimates for similar or conflicting projects and initiatives. Entities may not develop or operate a system for classifying and defining government services.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to register, define, and classify all their services in the Government Services Portfolio.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 06: Shared government Customer Relationship Management system "TAMM" / (Using the shared government Customer Relationship Management system "TAMM" to manage all support requests submitted by Abu Dhabi Government customers)

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include budget estimates for similar or conflicting projects and initiatives. Entities may not establish, develop, or operate a customer relationship management system outside the "TAMM" ecosystem to directly handle customer requests.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to connect and integrate with the shared government Customer Relationship Management system and benefit from it within the "TAMM" ecosystem.

- Allowed Budget Scope:
  Government entities must coordinate with the Department of Government Enablement when allocating budget for connection and integration with the shared government Customer Relationship Management system within the "TAMM" ecosystem.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 07: Abu Dhabi Government Contact Center / (Unifying all government contact centers under the umbrella of the Abu Dhabi Government Contact Center, including contact numbers and digital support and interaction channels with customers)

- Strategic Area: Government Services / Government services platforms and services aimed at providing a seamless customer experience / Government Services provided through the TAMM Platform, Unified Channels and Systems
- Budget Conflict Rule:
  Government entities must not include budget estimates for similar or conflicting projects and initiatives. Entities may not develop, establish, or create a new contact center or any support and digital interaction channels with customers outside the "TAMM" ecosystem.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to cancel contact numbers outside the unified number (800555), replace all support and digital interaction channels with customers outside the "TAMM" ecosystem, and benefit from the Abu Dhabi Government Contact Center.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 08: Abu Dhabi Government Open Data Platform

- Strategic Area: Government Data Management / Applications and solutions aimed at facilitating timely exchange of trusted data
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict.

### Policy 09: Spatial Data Platform

- Strategic Area: Government Data Management / Applications and solutions aimed at facilitating timely exchange of trusted data
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict.

### Policy 10: Abu Dhabi Government Data Management Program: / - Develop and operate a data management and analytics platform / - Develop and maintain a central data lake / - Implement and operate a government data catalog / - Implement master data records for Abu Dhabi Government / - Apply the data sharing subscription model / - Implement the government data exchange agenda / - Develop and implement shared analytical use cases with government entities / - Implement and operate the Abu Dhabi Data Marketplace / - Implement and develop priority data cleansing and quality improvement projects / - Develop and implement data labs

- Strategic Area: Government Data Management / Applications and solutions aimed at facilitating timely exchange of trusted data
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates for projects and initiatives similar to the scope of the "Abu Dhabi Government Data Management Program" currently being launched by the Department of Government Enablement.

- Allowed Budget Scope:
  Direct budget estimates toward initiatives that support Abu Dhabi Government's direction to improve the efficiency and quality of government data, facilitate its exchange, schedule it, and provide it to the central platform based on government priorities.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 11: Compliance with Abu Dhabi Government Data Management Standards

- Strategic Area: Government Data Management / Applications and solutions aimed at facilitating timely exchange of trusted data
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates for projects and initiatives aimed at improving compliance with the entity's data management standards and policies.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 12: Government Data Management and Open Data Standards and Policy issued by the Department of Government Enablement

- Strategic Area: Government Data Management / Applications and solutions aimed at facilitating timely exchange of trusted data
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates for projects and initiatives aimed at improving compliance with the entity's data management standards and policies.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 13: Implementation of Artificial Intelligence Use Cases

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department regarding implementation of use cases, as the Department is implementing cross-government initiatives to enable entities to accelerate use-case implementation and maximize benefits in the field of artificial intelligence.

- Allowed Budget Scope:
  The entity may allocate budget to develop or upgrade artificial intelligence use cases related only to the entity's field of work, including use cases for the entity's users, employees, or leadership.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 14: Implementation of initiatives related to artificial intelligence adoption.

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department regarding initiatives related to artificial intelligence adoption, taking into consideration the shared AI tools, technologies, and initiatives implemented, provided, or managed by the Department, and using them as the first priority before starting AI adoption initiatives.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 15: Abu Dhabi Government AI-Powered Knowledge Agent / GovGPT (AI-Powered Knowledge Agent for Abu Dhabi Government)

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement - Digital Government when preparing budget estimates for projects and initiatives aimed at developing conversational AI use cases for internal functions or operations.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 16: AI Sandbox (a flexible, preconfigured testing environment for rapid experimentation and prototyping) / (AI-Sandbox)

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- Budget Conflict Rule:
  The entity must not include budget estimates for projects or initiatives to develop the Government AI Policy or the AI Maturity Index.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 17: AI-in-a-Box (a preconfigured and managed environment for deploying AI use cases) / (AI-in-a-Box)

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives. Benefit from the central contracts provided by the Department of Government Enablement.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 18: AI Agent Marketplace (preconfigured and approved AI agent workflows) / (AI Agent Marketplace)

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives. Benefit from the central contracts provided by the Department of Government Enablement.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 19: Artificial Intelligence Tools / Compass PTU/GPU

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives. Benefit from the central contracts provided by the Department of Government Enablement.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 20: Whole-of-Government AI Use Cases

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 21: Government AI Policy and AI Maturity Index

- Strategic Area: Artificial Intelligence Management / Policies, platforms, and applications aimed at becoming the world's first government fully powered by artificial intelligence
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Allowed Budget Scope:
  Direct budget estimates, if any, toward contributing to the implementation of AI Maturity Index requirements.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 22: Microsoft Software

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when:
  - Allocating budget by the entity to purchase and maintain Microsoft software and licenses according to the entity's needs
  - Allocating budget for annual payments due from the entity according to the value of the new enterprise agreement with Microsoft

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 23: Microsoft Support

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity for Microsoft support according to the estimated cost for each entity based on the value of the enterprise agreement, if the entity wishes and needs to benefit from Microsoft Unified Support.

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 24: ESRI Geographic Information Systems Software and Services

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity for all ESRI geographic information system licenses according to the entity's actual needs.

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 25: Dell Software, Products, and Services

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity for all Dell software, products, and services according to the entity's actual needs, while considering the shift toward cloud computing and reducing reliance on entity infrastructure.

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 26: Palo Alto Software, Products, and Services

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity for all Palo Alto software, products, and services according to the entity's actual needs, while considering the shift toward cloud computing and reducing reliance on entity infrastructure.

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 27: F5 Software, Products, and Services

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity for all F5 software, products, and services according to the entity's actual needs, while considering the shift toward cloud computing and reducing reliance on entity infrastructure.

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 28: Cisco Software and Services

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity for all Cisco software, products, and services according to the entity's actual needs, while considering the shift toward cloud computing and reducing reliance on entity infrastructure.

- Allowed Budget Scope:
  Direct budget estimates for licenses according to the discounts, price cards, and available services under enterprise agreements concluded between Abu Dhabi Government, represented by the Department of Government Enablement, and ICT manufacturers and service providers.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 29: Dynatrace Software and Services / Full Stack Observability in general, e.g., BMC and Watchdog

- Strategic Area: Enterprise Agreements and Partnerships / Central initiatives aimed at obtaining the best prices and technology services from ICT providers across government
- Budget Conflict Rule:
  Do not include budget estimates for performance monitoring and Full Stack Observability applications or solutions that rely on technology other than Dynatrace, as Dynatrace is the technology approved by the Department of Government Enablement in this area.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement to allocate budget by the entity for all Dynatrace software, products, and services according to the entity's actual needs, while considering the shift toward cloud computing (SaaS) and reducing reliance on entity infrastructure. Entities must also coordinate regarding budgets for all Full Stack Observability software, products, and services, while considering the direction to standardize systems used across government entities.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 30: Government Website Platform Unification Initiative - migrating government websites to the secure and unified government website platform

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for launching digital websites that are not implemented using the unified government platform.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when allocating budget by the entity to renew licenses and operating contracts, while considering the Digital Government strategy to unify government entity websites.

- Allowed Budget Scope:
  Government entities must coordinate with the Department of Government Enablement to prepare budget estimates for digital channel projects and operations so that the required resources are allocated by entities to migrate their government websites to the unified platform, in addition to allocating entity resources required to manage change after the migration and develop digital content. The Department of Government Enablement will manage the unified platform, security testing, and required licenses for the unified platform.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 31: Integrated Government Platform for Data Exchange and APIs (AD Connect)

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement - Digital Government when preparing budget estimates for projects and initiatives aimed at improving compliance with standards, policies, and quality of related APIs (API Standards and API Lifecycle Management).

- Allowed Budget Scope:
  The entity may allocate budget to upgrade its internal systems so they can be connected to the integrated government platform. Entities may only request budget to upgrade their internal systems and electronically integrate with the integrated government platform to improve integration standards and compliance with API quality and compatibility policies (API Standards and API Lifecycle Management).

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 32: API Integration Platform (Integration, iPaaS)

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement - Digital Government when preparing budget estimates for projects and initiatives related to operations and licensing of integration platforms (iPaaS) for connecting and integrating the entity's internal systems through APIs.

- Allowed Budget Scope:
  The entity may coordinate with the Department of Government Enablement to prepare budget estimates for projects, operations, and licensing of integration platforms (iPaaS) for its internal systems, whether for internal integration or integration with the integrated government platform through APIs.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 33: Human Resources, Procurement, and Financial Management systems and related branches

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Government entities must not initiate their own initiatives or projects related to Enterprise Resource Planning (ERP) systems, including but not limited to human resources, procurement, financial management, and related branches. They must not include budget estimates for projects or initiatives that are similar, duplicated, or conflicting with Abu Dhabi Government's direction in this area. Entities must benefit from and align with unified systems and services provided by the competent government entities.
  (Add accounting systems, conflict-of-interest declarations, and gifts systems, as these are currently available in ADERP.)

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict.

### Policy 34: Internal Intranet Platform (Intranet site)

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to align with the direction to use existing and planned shared government solutions, for example Employee OneHub.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 35: Correspondence Management Systems

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 36: Enterprise Service Management (ESM) Systems

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 37: Procurement Committee Management System (PCMS)

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 38: Website Harmonization

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it. Main entity websites and websites of affiliated entities will be unified. Websites for initiatives and similar cases are excluded.

- Allowed Budget Scope:
  The entity may allocate budget to renew licenses and operating contracts.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget. If the project matches the allowed budget scope, it may proceed subject to the stated condition; otherwise flag for review.

### Policy 39: Survey Management

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 40: Translation Management

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 41: Social Listening

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 42: Learning and Training Systems (Learning Management Systems)

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to align with the direction to use existing and planned shared government solutions.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 43: Job Seeker Portal

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to align with the direction to use existing and planned shared government solutions.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 44: Objections, Complaints, and Grievances Committees (Objection Committee)

- Strategic Area: Shared Digital Platforms / Centralized shared initiatives and platforms provided to all government entities within an integrated operating ecosystem
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to align with the direction to use existing and planned shared government solutions.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 45: Digital Transformation to Cloud Computing

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- DGE Coordination Required:
  Government entities must use in-country cloud computing services and consider cloud computing as the first option before planning budget estimates for related initiatives such as infrastructure hosting, development and testing environments, backup and archiving, and interaction and communication systems. Entities must coordinate in advance with the Department of Government Enablement for alignment and to obtain the required approvals.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 46: Unified Central Authentication for Abu Dhabi Government Shared Services / (ADGOV Central Identity Provider for Shared Government Services)

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement regarding any current or future requirements related to a Central Identity Provider to enable government employees to access shared government applications.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 47: Unified MS365 Program (ADGOV MS 365)

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement regarding any current or future requirements related to integrating MS 365 services across entities to ensure alignment with related initiatives undertaken by the Department of Government Enablement.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 48: Cloud and Infrastructure Operations Workforce Contracts

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement regarding the establishment or renewal of workforce contracts for cloud computing and infrastructure operations, to ensure alignment with the digital transformation to cloud computing strategy.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 49: Cloud Migration Contracts

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement regarding any initiatives related to migrating entity systems to cloud computing, to ensure alignment with the digital transformation to cloud computing strategy.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 50: Establishing Data Centers

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement regarding any initiatives to establish data centers, to ensure alignment with the digital transformation to cloud computing strategy.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 51: Establishing Disaster Recovery Centers

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement regarding any initiatives to establish data centers or disaster recovery centers, to ensure alignment with the digital transformation to cloud computing strategy.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 52: Direct connectivity links between the entity's data centers and cloud service providers

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- DGE Coordination Required:
  Government entities must communicate with the Department of Government Enablement before establishing any direct links between their data centers and cloud service providers, in order to align with network transformation initiatives carried out by ADNET since 2022. Coordination with the Department of Government Enablement must take place in advance for alignment and to obtain the required approvals.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 53: Internal File Transfer and Sharing Applications

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must coordinate with the Department of Government Enablement to align with the direction to use existing and planned shared government solutions (SharePoint Online).

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 54: Abu Dhabi Government Network Joining Service

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 55: Secure Internet Connectivity Service

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 56: gov.ae Internet Domain Name Service

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 57: Secure Digital Certificates Service

- Strategic Area: Government Infrastructure and Cloud / Network connectivity services, cloud computing services, and a unified government data center serving all government entities
- Budget Conflict Rule:
  Do not include budget estimates for similar services.

- DGE Coordination Required:
  Government entities must contact and coordinate with the Department of Government Enablement to inquire about the available service scope and how to benefit from it.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict. If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 58: Information Security Operations Center

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates for projects and initiatives similar to the scope of awareness and capability building.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 59: Cybersecurity Awareness and Capability Building Programs

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 60: Implementation of cybersecurity transformation plans and remediation of security vulnerabilities, as the Department of Government Enablement is implementing shared government-wide initiatives in this area

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 61: Advance coordination with the Department of Government Enablement regarding the purchase of cybersecurity systems and software, including but not limited to WAF, IPS, EDR, DDoS, antivirus, etc.

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 62: Email Security Gateway

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- Budget Conflict Rule:
  Do not include budget estimates for similar or conflicting projects and initiatives.

- Project Conflict-Check Guidance: If the project is similar to, duplicates, replaces, or conflicts with this initiative/service, mark it as a potential budget conflict.

### Policy 63: Web Application Vulnerability Assessment

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 64: Network Vulnerability Assessment

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 65: Web Application Penetration Test

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 66: Network Penetration Test

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 67: Independent VAPT Retest

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 68: Social Engineering Assessment

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 69: Mobile Application Penetration Test

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

### Policy 70: Security Architecture Review

- Strategic Area: Cybersecurity / High-level security systems to protect information assets, infrastructure, and digital systems
- DGE Coordination Required:
  Government entities must coordinate in advance with the Department of Government Enablement when preparing budget estimates.

- Project Conflict-Check Guidance: If the project is related to this initiative/service, require DGE coordination or alignment evidence before approving the budget.

## Completeness Check

- Extracted policies: 70
- Workbook data rows covered: all policy rows from the translated workbook.



Required Output Format:

Return JSON only.

{
  "project_policy_assessment": [
    {
      "Policy Number": "",
      "Policy Name": "",
      "Strategic Area": "",
      "Match Type": "",
      "Relevance Score": 0,
      "Reason": "",
      "Evidence From Project": [],
      "Required Action": ""
    }
  ],
"overall_assessment": {
  "Has Policy Match": true,
  "Has Potential Conflict": true,
  "Has Coordination Requirement": true,
  "Has Allowed With Conditions": true,
  "Summary": ""
}
}

Rules for output:
- Return every materially relevant policy match.
- If no policy is relevant, return an empty project_policy_assessment array and set all overall flags to false.
- Do not return `No Conflict` rows.
- Do not include weak or rejected policy matches just to explain why they are not conflicts.
- If no policy applies, explain that briefly only in overall_assessment.Summary.
- Do not invent policy numbers or policy names.
- Evidence From Project must quote or paraphrase specific words from the Project Name or Project Description.
- Match Type must be one of:
  - Potential Conflict
  - Coordination Required
  - Allowed With Conditions
- Do not include markdown.
- Do not include commentary outside the JSON.

Input:

Entity Name: {{ENTITY_NAME}}
Project Name: {{PROJECT_NAME}}
Project Description: {{PROJECT_DESCRIPTION}}
