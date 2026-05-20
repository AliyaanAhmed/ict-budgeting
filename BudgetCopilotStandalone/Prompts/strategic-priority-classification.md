# ICT Budgeting Strategic Priority Classification Prompt

Version: 1.0
Date: 2026-05-15

This prompt evaluates ICT budget project submissions and suggests the two most relevant Strategic Priority and Strategic Priority Classification combinations.

---

You are evaluating ICT budget project submissions for strategic priority alignment.

Your task is to suggest the two most relevant Strategic Priority and Strategic Priority Classification combinations for a project using ONLY the following inputs:

- Entity Name
- Project Name
- Project Description

Do NOT use budget account codes, GL codes, vendor name, existing selected priority, existing selected classification, or any other fields unless explicitly provided.

You must choose only from the approved taxonomy below. Do not invent new priorities or classifications.

Approved Strategic Priority Taxonomy:

1. Artificial Intelligence
- AI Adoption/Expansion/Others
- AI Maturity Index requirements/AI policy compliance
- AI Planning & Strategy
- Others
- Use Case Development

2. Business Specific Core Solution
- Application/Software Development
- Application/Software Support/Licenses/Maintenance
- Subscriptions (SaaS)

3. Common Digital Platform
- Correspondence
- ERP
- Inspection Management
- IT Assets Management
- Job Seeker
- Knowledge and Document Management
- MS 365
- One Hub
- Potential CDPs
- Procurement Committee Management System
- Service Management
- Social listening platform
- Stakeholder engagement and communication strategy
- Survey management platform
- Time and Attendance Management
- Translation management platform
- Visitors Management
- Website Harmonization Platform

4. Connectivity
- Connectivity

5. Cybersecurity
- Access Management
- Business Continuity
- Cyber Threat Intelligence
- GRC
- GSOC
- Mission Engineering
- Others
- Security Architecture
- Security Assurance
- Security Awareness
- Security Solution Implementation

6. Data Management Program
- Data Governance Audit
- Data Implementation
- Data Strategy

7. Digital Infrastructure and Cloud
- Data Centers On Cloud
- Data Centers On Prim
- Disaster Recovery as a service (DRaaS)
- Disaster Recovery DR On Prim
- Infrastructure as a service (IaaS)
- Others
- Platform as a service (PaaS)
- Software as a service (SaaS)

8. Digital Strategic Sourcing
- Digital Strategic Sourcing - Others
- ICT Manpower Agreement
- Technology Enterprise Agreement Addons
- Technology Enterprise Agreement Licenses

9. Government Services
- Government Services - Others
- TAMM Services Development/Enhancement

10. ICT Enabler
- Consultancy (Digital Strategy Development/Refresh/Others)
- Enterprise Solutions/Architecture
- Hardware (peripherals devices/laptops/printers/monitors..etc.)
- Hardware Maintenance / Support
- IT Managed Services
- Others
- Software (Non Core) Development/Acquisition
- Software (Non Core) Licenses / Maintenance / Support

Evaluation Principles:

1. Identify the primary business objective first.
Do not classify based only on technology keywords. A project may mention cloud, AI, data, cybersecurity, or infrastructure, but the correct category depends on what the project is mainly trying to achieve.

2. Always suggest two priority/classification combinations.
The first suggestion should be the best fit. The second suggestion should be the next most plausible fit, especially where the project has mixed signals such as AI inside a business platform, data workloads running on cloud infrastructure, or cybersecurity roles inside a manpower contract.

3. Use Relevance Score, not Confidence Score.
Relevance Score means how strongly that priority/classification matches the project based on the provided inputs.
- 90-100 = very strong fit
- 75-89 = strong fit
- 60-74 = plausible fit but needs review
- 40-59 = weak secondary fit
- Below 40 = usually should not be returned unless no better second option exists

4. Entity-specific operational platforms usually belong to Business Specific Core Solution.
If the project is a domain-specific platform or application supporting the entity’s core mandate, choose:
Business Specific Core Solution / Application/Software Development
or
Business Specific Core Solution / Application/Software Support/Licenses/Maintenance

Example:
A disaster management digital twin platform for simulation, preparedness, prediction, monitoring, evacuation, and resource allocation should be treated primarily as a business-specific core solution, not automatically as AI, Data, or Infrastructure.

5. Contractor/resource/staff augmentation projects should usually belong to Digital Strategic Sourcing.
If the project description is mainly about contractors, manpower, outsourced resources, role quantities, specialists, developers, administrators, architects, project managers, support staff, or MSS contract resources, choose:
Digital Strategic Sourcing / ICT Manpower Agreement

Important:
Do not over-weight individual role names such as Data Governance Specialist, Security Specialist, Cloud Administrator, Database Administrator, Developer, or Architect. If these are part of a broader resource pool, classify the project as ICT Manpower Agreement, not Data Management, Cybersecurity, Cloud, or Application Development.

6. Data Management Program should be used when the project’s core purpose is data.
Choose Data Management Program when the project is primarily about data governance, data strategy, data platforms, data integration, data implementation, analytics enablement, data ingestion, transformation, BI, dashboards, data quality, master data, or enterprise data management.

Example:
A Microsoft Fabric, Azure Data Factory, Synapse, Databricks, analytics, BI, or data integration project should usually be:
Data Management Program / Data Implementation

Do not classify such projects as Digital Infrastructure and Cloud just because Azure or cloud hosting is mentioned, unless the main purpose is infrastructure hosting rather than data capability.

Use Data Management Program / Data Governance Audit only when the project is clearly about auditing, assessing, reviewing, or validating data governance maturity, compliance, controls, or governance practices. Do not use this classification just because a “Data Governance Specialist” is mentioned as a resource.

7. Digital Infrastructure and Cloud should be used when infrastructure is the main deliverable.
Choose Digital Infrastructure and Cloud when the project is mainly about compute, servers, storage, hosting, cloud infrastructure, data centers, virtualization, containerization platforms, backup infrastructure, disaster recovery infrastructure, network infrastructure, platform hosting, or cloud capacity.

Example:
A backend infrastructure and computation project involving GPU/CPU servers, scalable storage, content delivery infrastructure, virtualization, backup, DR, and secure hosting should be:
Digital Infrastructure and Cloud / Infrastructure as a service (IaaS)

8. Artificial Intelligence should be used only when AI is the main subject of the project.
Choose Artificial Intelligence when the project is primarily about AI strategy, AI governance, AI maturity, AI compliance, AI adoption, AI use-case development, AI model implementation, AI assistant/chatbot capability, or AI enablement itself.

Do not classify a project as Artificial Intelligence merely because it mentions prediction, automation, digital twin, analytics, or AI-assisted features if the main project is actually a domain-specific business platform.

However, if the project is fundamentally centered on AI or LLM capability, AI should be ranked first. For example, an AI-powered collaborative authoring system using an LLM for ideation, drafting, optimization, or content generation should rank:
1. Artificial Intelligence / Use Case Development
2. Business Specific Core Solution / Application/Software Development

9. Common Digital Platform should be used for known government/common platforms.
If the project is clearly about ERP, MS 365, correspondence, service management, document management, One Hub, TAMM-related common services, visitor management, survey management, procurement committee systems, website harmonization, or other listed shared platforms, choose the corresponding Common Digital Platform classification.

10. Cybersecurity should be used when the main objective is security.
Choose Cybersecurity when the project is primarily about access control, identity/security access management, GRC, security architecture, threat intelligence, SOC/GSOC, security assurance, awareness, cybersecurity implementation, cyber resilience, or cyber mission engineering.

Do not classify a broad manpower project as Cybersecurity only because it includes security specialists.

11. ICT Enabler should be used for general ICT support, non-core software, hardware, managed services, consulting, and architecture.
Use ICT Enabler when the project supports general ICT operations or enablement but is not clearly a core business application, common platform, cybersecurity, data, cloud infrastructure, AI, connectivity, or strategic sourcing project.

12. When multiple categories are possible, choose the category that represents the main budget object.
Ask: “What is the organization actually buying or funding?”
- Funding a resource pool? Digital Strategic Sourcing / ICT Manpower Agreement
- Funding a business application/platform? Business Specific Core Solution
- Funding a data platform or analytics/data integration capability? Data Management Program
- Funding servers, storage, hosting, cloud capacity, DR, or backend infrastructure? Digital Infrastructure and Cloud
- Funding security controls or cybersecurity program? Cybersecurity
- Funding AI capability itself? Artificial Intelligence
- Funding general hardware/support/managed services? ICT Enabler

Required Output Format:

Return exactly two rows using this structure:

[
  {
    "Rank": 1,
    "Strategic Priority": "",
    "Strategic Priority Classification": "",
    "Relevance Score": 0,
    "Reason": ""
  },
  {
    "Rank": 2,
    "Strategic Priority": "",
    "Strategic Priority Classification": "",
    "Relevance Score": 0,
    "Reason": ""
  }
]

Rules for output:
- Relevance Score must be from 0 to 100.
- Rank 1 must be the best-fit suggestion.
- Rank 2 must be the next most plausible suggestion.
- Use only the approved taxonomy.
- Do not invent new strategic priorities or classifications.
- Do not include markdown.
- Do not include explanations outside the output structure.

Input:

Entity Name: {{ENTITY_NAME}}
Project Name: {{PROJECT_NAME}}
Project Description: {{PROJECT_DESCRIPTION}}
