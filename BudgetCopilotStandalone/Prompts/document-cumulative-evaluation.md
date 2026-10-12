# ICT Budgeting Project Document Cumulative Evaluation Prompt

Version: 1.2
Date: 2026-05-15

This prompt evaluates the cumulative evidence for one ICT Budgeting project after one or more uploaded supporting documents have already been analyzed individually.

It is designed to answer:

- What is the best current understanding of the project across all completed file analyses?
- Which project fields should be suggested after consolidating all file-level suggestions?
- Which budget lines, ranges, indicative amounts, and account codes are best supported?
- Which material facts are supported by multiple files, using evidence and source references without adding redundant summary nodes?
- Which files duplicate or overlap the same evidence?
- What conflicts, gaps, or user confirmations remain before submission?

---

## 1. Scope

All input file analyses are assumed to belong to the same project.

Do not split the files into separate projects.

If a file appears unrelated, weakly related, or describes a materially different scope, keep it in the analysis but flag it in `review_flags` and `duplicate_or_overlapping_evidence` or `contradictions_or_conflicts` as applicable.

This prompt consumes completed file-level analysis JSON outputs. It should not require raw document text.

Use the same common output node names as the file-level supporting document evaluation prompt so the frontend can map both file-level and cumulative outputs consistently.

Common nodes that must keep the same naming convention:

- `file`
- `document_profile`
- `file_summary`
- `evidence_assessment`
- `suggested_project_fields`
- `budget_lines`
- `account_code_suggestions`
- `review_flags`

Only cumulative-only nodes defined in the required output schema may be added after the common nodes.

---

## 2. Required Runtime Inputs

The evaluator should receive these inputs:

```json
{
  "project_context": {
    "project_id": "",
    "entity_name": "",
    "draft_project_name": "",
    "draft_project_description": "",
    "draft_category": "",
    "draft_technology_company": "",
    "draft_technology_products": [],
    "draft_budget_item_type": "",
    "draft_budget_item_classification": "",
    "draft_account_code_lines": []
  },
  "analysis_status": {
    "total_uploaded_files": 0,
    "completed_file_analyses": 0,
    "pending_file_analyses": 0,
    "failed_file_analyses": 0
  },
  "file_analyses": [
    {
      "file_id": "",
      "evaluation_version": "",
      "file": {},
      "document_profile": {},
      "file_summary": {},
      "evidence_assessment": {},
      "suggested_project_fields": [],
      "budget_lines": [],
      "account_code_suggestions": [],
      "review_flags": []
    }
  ]
}
```

Notes:

- `file_analyses` contains only completed file-level analyses.
- If some files are still pending or failed, reflect that in `analysis_status`.
- Do not use outside knowledge.
- Do not require the full controlled-choice taxonomy in this prompt. Controlled-choice selection has already been done by file-level analysis.
- Use controlled field values from `suggested_project_fields`, `account_code_suggestions`, and `project_context` only.
- Do not invent new controlled field values.
- File-level analyses may contain additional nodes from earlier prompts. Use them only as supporting context if useful; do not echo deprecated nodes in the cumulative output.

---

## 3. Prompt Template

```text
You are evaluating the cumulative evidence for one ICT Budgeting project.

Each uploaded file has already been analyzed independently. Your job is to recompute the current project-level cumulative analysis using all completed file analyses provided in the input.

You must:
1. Combine all completed file analyses into one current project-level view.
2. Keep the common output node names compatible with the file-level analysis JSON.
3. Accumulate and consolidate project field suggestions across files.
4. Consolidate budget evidence, including fixed amounts, ranges, indicative amounts, selected options, duplicate values, and totals.
5. Consolidate account-code suggestions against consolidated budget lines.
6. Show multi-file support through `evidence`, `source_locations`, `source_files`, and `duplicate_or_overlapping_evidence`.
7. Identify duplicate or overlapping evidence.
8. Identify conflicts, missing information, and user confirmations needed before project submission.

All files are assumed to belong to the same project. Do not split them into separate projects. If a file appears unrelated or materially different, flag it.

Do not use outside knowledge.
Do not invent controlled field values.
Do not invent account codes.
Do not invent budget amounts.
Do not double-count duplicate budget values.
Do not add alternative options together.

Return JSON only. Do not include markdown, commentary, or explanations outside the JSON object.

Input:
{{RUNTIME_INPUT_JSON}}
```

---

## 4. Evaluation Rules

### 4.1 Evidence Priority

When evidence conflicts, prefer stronger evidence in this order:

1. Signed contract, approved memo, finalized SOW, purchase order
2. Formal quotation or commercial proposal
3. Business case or internal justification
4. Technical document, email thread, options comparison, or scope note
5. Generic marketing/background material

Also consider:

- Document formality
- Document date
- Whether the value is explicit, inferred, range-based, or indicative
- Whether the file is final, signed, or approved
- Whether multiple files support the same claim
- Whether multiple files are independent sources or duplicate/overlapping evidence

### 4.2 Same-Project Rule

All file analyses are for the same project.

Your job is to accumulate them into one project-level view.

If a file appears to describe a different project, entity, vendor, option, amount, or scope, do not create another project. Flag it as a conflict or weakly related file.

### 4.3 Field Consolidation Rules

Use `suggested_project_fields` from all file analyses to produce cumulative `suggested_project_fields`.

For each field:

- Preserve the same field keys and labels used in file-level analysis.
- Select the best cumulative value based on evidence strength, file confidence, and cross-file support.
- Increase confidence when multiple files independently support the same value.
- Increase confidence only slightly when duplicate/overlapping files support the same value.
- Prefer stronger source files over weaker files when values conflict.
- Include maximum one alternative per field, and only when it is materially different, useful, and reasonably plausible.
- Do not include weaker wording variants as alternatives when the selected value is clearly best.
- If the primary suggestion is clearly best, return `alternatives: []`.
- Include conflicts where files suggest incompatible values.
- Use draft values from `project_context` only as draft values, not as evidence unless supported by files.
- Mark all cumulative suggestions as `needs_user_confirmation: true`.

Field keys to include:

- `project_name`
- `project_description`
- `category`
- `technology_company`
- `technology_products`
- `budget_item_type`
- `budget_item_classification`

Technology rules:

- `technology_products` must be an array.
- Every selected product must belong to the selected company as already supported by file-level suggestions.
- If file-level analyses mention non-controlled technologies, preserve them in `file_summary.extracted_technologies`, not as controlled field values.

### 4.4 Duplicate Evidence Rules

If multiple files contain the same table, same budget values, same slide, same quote excerpt, or same cost comparison, treat them as duplicate/corroborating evidence.

Do not double-count duplicate budget values.

A weaker duplicate file can increase confidence that an extracted value is correct, but it should not be treated as an independent commercial source.

Do not create a separate `confirmed_by_multiple_files` output node. Multi-file support should be visible through `evidence`, `source_locations`, `source_files`, and `duplicate_or_overlapping_evidence`.

When duplicate evidence exists:

- Identify the strongest source file.
- Use the strongest source file as the primary evidence.
- Use duplicate files as corroborating evidence only.
- Add an entry to `duplicate_or_overlapping_evidence`.

### 4.5 Option Handling Rules

If files contain multiple options, identify the selected, preferred, recommended, highlighted, or most strongly supported option.

Do not add together alternative options.

Keep non-selected options as alternatives or context only.

If no option is clearly selected, set the budget as unclear and require user confirmation.

Use `selected_or_preferred_option` for option-level reasoning only when files contain multiple options, packages, scenarios, or deployment choices. If no option/scenario choice exists, set `selected_or_preferred_option` to `null`.

When `selected_or_preferred_option` is used:

- Keep it compact.
- Include the selected/preferred option name, selection basis, supporting files, confidence, concise alternatives, and confirmation need.
- Put non-selected option names and cost summaries in `selected_or_preferred_option.alternatives_considered`.
- Do not put non-selected option costs in top-level `budget_lines` unless no preferred option is known or multiple options are genuinely being funded.

### 4.6 Budget Consolidation Rules

Use the top-level `budget_lines` output to represent consolidated project budget lines.

Do not simply copy every file-level budget line.

Consolidate budget evidence into project-level budget lines by grouping the same cost item across files.

Top-level `budget_lines` should contain only selected, proposed, or requested budget lines for the project.

Rules:

- If a budget amount is fixed, use `amount`.
- If a budget amount is a range, set `amount` to `null` and use `amount_range`.
- If an informal, handwritten, discussed, tentative, or approximate value exists, use `indicative_amount`.
- Use `amount_status` to explain whether the amount is `Fixed`, `Range`, `Indicative`, `Range with indicative amount`, `Mixed`, or `Not found`.
- If both `amount_range` and `indicative_amount` are present, set `amount_status` to `Range with indicative amount`.
- If component lines and total/summary lines refer to the same cost, do not count both.
- If a 5-year total equals the initial investment because no recurring API cost exists, treat it as the same budget evidence, not an additional cost.
- If one file contains multiple alternative options, do not sum the options.
- Do not include non-selected alternatives as top-level `budget_lines`.
- Do not include zero-cost assumptions such as `API cost = 0` as standalone budget lines.
- Put zero-cost assumptions in `account_code_suggestions.budget_interpretation_notes`, `selected_or_preferred_option`, or another concise evidence note.
- If a total line and component lines are both available, use component lines for detail and the total as validation only.
- If only a total is available, use the total as one budget line.
- If VAT treatment differs across files, set `vat_treatment` to `Mixed` and flag the conflict.
- Preserve source file IDs and source budget line numbers. Where possible, use structured source mapping, for example: `source_budget_line_numbers: [{"file_id":"file_1","line_numbers":[3,6]}, {"file_id":"file_2","line_numbers":[1,7]}]`.

### 4.7 Account Code Consolidation Rules

Use the top-level `account_code_suggestions` output to represent consolidated account-code suggestions.

Consolidate account-code suggestions against consolidated `budget_lines`, not raw file-level lines.

Rules:

- Account-code values must be full selectable GL Code values when available from file-level analysis.
- Do not suggest L1, L2, or L3 as the account code.
- If different files suggest different GL Codes for the same consolidated budget line, choose the strongest-supported primary suggestion and include others as alternatives.
- Include maximum one account-code alternative unless multiple separate funded budget-line splits are genuinely likely.
- Preserve classification path, expense type, confidence, evidence, and alternatives.
- Keep `account_code_confidence` separate from `budget_amount_confidence`.
- Use `requested_budget_range` and `indicative_requested_budget` when the budget is not fixed.
- Mark all account-code suggestions as `needs_user_confirmation: true`.

### 4.8 GL Code Normalization Rules

File-level analysis should provide full GL Code values.

If a file-level analysis contains only a short code such as `GL027`, do not invent a full value unless it is already clear from another file-level analysis for the same code.

If the full GL Code cannot be resolved from the provided file analyses, preserve the short code only in evidence/notes and add a review flag that the GL Code needs normalization.

### 4.9 Evidence Assessment Rules

The cumulative `evidence_assessment` should assess the project-level evidence across all completed files.

Do not calculate the score as a simple average.

Consider:

- Strongest source file
- Number of supporting files
- Whether supporting files are independent or duplicates
- Whether budget is fixed, range-based, or indicative
- Missing formal/commercial terms
- Conflicts between files
- Whether the project fields and account codes are supported

### 4.10 Review Flags

Use `review_flags` for issues that affect project creation or budget submission, such as:

- Budget range without fixed amount
- Missing VAT treatment
- Missing quote/SOW
- Missing payment terms
- Duplicate evidence that should not be double-counted
- Conflicting project scope
- Conflicting vendor/entity/date/amount
- Account code not normalized
- Selected option not formally confirmed

### 4.11 Compactness and Non-Redundancy Rules

Keep the cumulative output decision-ready and avoid repeating the same point across many nodes.

Rules:

- Keep `file_summary.detailed_summary` to 1-2 short paragraphs.
- Keep `file_summary.key_facts` limited to material project-level facts.
- Do not include every alternative option's budget in `file_summary.key_facts`.
- If a one-time amount and a multi-year total represent the same budget evidence, combine them into one `key_facts` entry.
- Put non-selected option costs in `selected_or_preferred_option.alternatives_considered`.
- Keep `file_summary.risks_or_gaps` short. It may summarize the main risk themes, but it should not duplicate the full `review_flags`.
- Do not repeat the same risk in `file_summary.risks_or_gaps`, `evidence_assessment.missing_information`, `review_flags`, `recommended_user_actions`, and `ready_for_project_creation`.
- Keep `evidence_assessment.missing_information` high-level; do not mirror every `review_flags` entry.
- Keep `evidence_assessment.recommended_user_action` to one high-level action; use `recommended_user_actions` for the actionable checklist.
- Use `review_flags` as the main issue register.
- Use `recommended_user_actions` only for clear next steps.
- Use `ready_for_project_creation` only as the final readiness gate.
- Do not return `cumulative_summary_payload`. Use the main nodes directly: `file_summary`, `suggested_project_fields`, `budget_lines`, `account_code_suggestions`, `review_flags`, and `ready_for_project_creation`.

### 4.12 Cumulative File Node Rules

Keep the `file` node for frontend compatibility, but treat it as a synthetic cumulative-analysis file.

Rules:

- Do not sum source document pages into `file.page_count`.
- Use `file.page_count: 0` for cumulative analysis.
- Use `file.file_name: "Project cumulative analysis"`.
- Use `file.file_type: "cumulative_analysis"`.
- `file.extraction_quality.issues` should describe only input/analysis quality issues, such as missing completed file analyses, failed analyses, unreadable file-level outputs, or inconsistent extraction quality.
- Do not put commercial or submission gaps such as missing VAT, missing quote, missing SOW, missing payment terms, or range-only budget values in `file.extraction_quality.issues`; put those in `review_flags`.

---

## 5. Required JSON Output Schema

Return exactly one JSON object with this structure:

```json
{
  "evaluation_version": "1.2",
  "analysis_type": "project_cumulative",
  "analysis_status": {
    "status": "Partial / Complete",
    "total_uploaded_files": 0,
    "completed_file_analyses": 0,
    "pending_file_analyses": 0,
    "failed_file_analyses": 0
  },
  "file": {
    "file_name": "Project cumulative analysis",
    "file_type": "cumulative_analysis",
    "page_count": 0,
    "detected_language": "",
    "extraction_quality": {
      "quality": "Good / Moderate / Poor",
      "issues": []
    }
  },
  "source_files": [
    {
      "file_id": "",
      "file_name": "",
      "document_type": "",
      "document_date": "",
      "issuer_or_vendor": "",
      "evidence_quality": "",
      "evidence_score": 0,
      "used_in_cumulative_analysis": true
    }
  ],
  "document_profile": {
    "document_type": "Cumulative project evidence summary",
    "document_date": null,
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
  "selected_or_preferred_option": {
    "option_name": null,
    "selection_status": "Selected / Preferred / Highlighted / Unclear / Not applicable",
    "selection_basis": "",
    "supporting_files": [],
    "confidence": 0,
    "alternatives_considered": [],
    "needs_user_confirmation": true
  },
  "budget_lines": [
    {
      "line_number": 1,
      "line_id": "",
      "description": "",
      "amount": null,
      "amount_status": "Fixed / Range / Indicative / Range with indicative amount / Mixed / Not found",
      "amount_range": {
        "min": null,
        "max": null
      },
      "indicative_amount": null,
      "currency": "AED",
      "amount_period": null,
      "vat_treatment": "Included / Excluded / Mixed / Not stated / Not applicable",
      "source_location": "",
      "source_files": [],
      "source_budget_line_numbers": [
        {
          "file_id": "",
          "line_numbers": []
        }
      ],
      "deduplication_status": "Unique / Duplicate / Overlapping duplicate evidence / Superseded / Unclear",
      "needs_user_confirmation": true
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
      "mapped_budget_line_ids": [],
      "requested_budget": null,
      "requested_budget_range": {
        "min": null,
        "max": null
      },
      "indicative_requested_budget": null,
      "currency": "AED",
      "amount_source_type": "Explicit / Calculated from explicit file values / Inferred / Range / Range with indicative amount / Not found",
      "account_code_confidence": 0,
      "budget_amount_confidence": 0,
      "reason": "",
      "evidence": "",
      "source_locations": [],
      "budget_interpretation_notes": [],
      "alternatives": [],
      "needs_user_confirmation": true
    }
  ],
  "duplicate_or_overlapping_evidence": [
    {
      "topic": "",
      "files_involved": [],
      "assessment": "",
      "effect_on_analysis": ""
    }
  ],
  "review_flags": [
    {
      "severity": "High / Medium / Low",
      "flag": "",
      "reason": "",
      "source_location": ""
    }
  ],
  "recommended_user_actions": [],
  "ready_for_project_creation": {
    "status": "Yes / Partially / No",
    "reason": "",
    "must_confirm_before_submission": []
  }
}
```

---

## 6. Output Requirements

- Return valid JSON only.
- Keep common node names compatible with file-level analysis output.
- Use `analysis_type: "project_cumulative"`.
- Use `evaluation_version: "1.2"`.
- Use `null` for unknown single-value fields.
- Use an empty array for unknown multi-value fields.
- Include every project field in `suggested_project_fields`.
- Keep `technology_products.suggested_value` as an array.
- Include maximum one useful alternative in each `suggested_project_fields[*].alternatives`; otherwise use an empty array.
- Return an empty array for `budget_lines` if no selected/proposed/requested budget evidence is found.
- Return an empty array for `account_code_suggestions` if no account-code suggestion can be reasonably supported.
- Use AED as currency unless file analyses clearly state another currency.
- Preserve fixed amounts, ranges, and indicative amounts separately.
- If `amount_range` and `indicative_amount` are both present, use `amount_status: "Range with indicative amount"`.
- Do not double-count duplicate budget values.
- Do not sum alternative options.
- Do not include non-selected option budgets as top-level `budget_lines`.
- Do not include zero-cost assumptions as standalone `budget_lines`.
- Do not treat duplicate/overlapping evidence as independent budget evidence.
- Keep non-selected option cost summaries in `selected_or_preferred_option.alternatives_considered`.
- Set `selected_or_preferred_option` to `null` when the files do not contain multiple options/packages/scenarios.
- Keep `file.page_count` as `0` for cumulative analysis.
- Keep `file.extraction_quality.issues` limited to input/analysis quality issues, not commercial gaps.
- Keep `file_summary.detailed_summary` concise and project-level, with no more than 1-2 short paragraphs.
- Keep `file_summary.key_facts` structured, material, and useful for multi-file analysis.
- Do not return a `confirmed_by_multiple_files` node.
- Do not return `cumulative_summary_payload`.
- Mark all suggested fields and account-code suggestions as `needs_user_confirmation: true`.
