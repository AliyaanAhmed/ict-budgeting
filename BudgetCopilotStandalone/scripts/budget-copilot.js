(function () {
  const STORAGE_KEY = "budgetCopilotLocalConfig";
  const MAX_FILE_BYTES = 25 * 1024 * 1024;
  const DEFAULT_PROXY_BASE_URL = "http://localhost:8087";
  const CORE42_CHAT_ENDPOINT = "/api/core42/chat/completions";
  const CORE42_RESPONSES_ENDPOINT = "/api/core42/responses";
  const FOUNDRY_RESPONSES_ENDPOINT = "/api/foundry/responses";
  const FOUNDRY_DISPLAY_ENDPOINT =
    "https://foundry-dge-dev-ae.services.ai.azure.com/api/projects/aiproj-ict-dev/openai/v1/responses";
  const DOCUMENT_PROMPT_PATH = "Prompts/supporting-document-evaluation.md";
  const CUMULATIVE_PROMPT_PATH = "Prompts/document-cumulative-evaluation.md";
  const BUDGET_CONSIDERATION_PROMPT_PATH = "Prompts/budget-consideration-policy-check.md";
  const CHAT_PROMPT_PATH = "Prompts/budget-copilot-chat-assistant.md";
  const STRATEGIC_PRIORITY_PROMPT_PATH = "Prompts/strategic-priority-classification.md";
  const DEFAULT_MODEL = "gpt-5.1";
  const DEFAULT_PROVIDER = "core42";
  const PROJECT_TYPE_VALUES = new Set(["New Strategic Initiative", "New CAPEX", "Inorganic Growth", "Other"]);
  const PROJECT_BUDGET_TYPE_VALUES = new Set([
    "Operational Recurring",
    "Operational Non-Recurring",
    "New Project",
    "Project Continuation",
  ]);
  const CATEGORY_VALUES = new Set(["ICT Only", "Part of Any Other Project"]);
  const FORM_FIELD_KEYS = new Set([
    "project_name",
    "project_description",
    "strategic_priority",
    "strategic_priority_classification",
    "category",
    "technology_company",
    "technology_products",
    "budget_item_type",
    "budget_item_classification",
    "planned_start_date",
    "planned_end_date",
    "work_stream",
  ]);

  const state = {
    messages: [],
    form: {
      project_name: "",
      strategic_priority: "",
      strategic_priority_classification: "",
      work_stream: "",
      budget_item_type: "",
      technology_company: "",
      technology_products: "",
      category: "",
      planned_start_date: "",
      planned_end_date: "",
      project_description: "",
      budget_item_classification: "",
    },
    documents: [],
    fileAnalyses: [],
    cumulativeAnalysis: null,
    budgetRows: [],
    pendingSuggestions: null,
    suggestionsVisible: false,
    appliedSuggestions: [],
    budgetConsiderationResult: null,
    modelLogs: [],
    projectContext: {
      entityName: "",
    },
    aiConfig: {
      proxyBaseUrl: DEFAULT_PROXY_BASE_URL,
      provider: DEFAULT_PROVIDER,
      core42: {
        apiKey: "",
        model: DEFAULT_MODEL,
      },
      foundry: {
        apiKey: "",
        model: DEFAULT_MODEL,
        responsesEndpoint: FOUNDRY_DISPLAY_ENDPOINT,
      },
    },
    documentPromptText: null,
    cumulativePromptText: null,
    budgetConsiderationPromptText: null,
    chatPromptText: null,
    strategicPriorityPromptText: null,
    busy: false,
    activity: {
      title: "Working",
      detail: "Please wait before sending another message.",
    },
    strategicPriorityLastInputKey: "",
    strategicPriorityEntityPromptKey: "",
    awaitingEntityName: false,
  };

  const elements = {};
  let strategicPriorityDebounceId = null;

  const STRUCTURED_ANALYSIS_INSTRUCTION = [
    "Run Structured Output Mode for the latest conversation.",
    "Return valid JSON only.",
    "This is an internal extraction call after the visible chat response has already been shown.",
    "Set assistant_message to an empty string. Do not write another conversational reply.",
    "Return any project fields you can evaluate from the conversation, even if more information is still needed.",
    "Use next_action ask_more when more details are needed, but still include low-risk draft suggested_project_fields if they are supported.",
    "Use next_action ask_more, suggest_fields, explain_only, or refuse.",
    "Use controlled values from the chat assistant prompt only.",
  ].join("\n");

  function boot() {
    cacheElements();
    loadConfig();
    bindEvents();
    setBusy(false);
    syncFormInputs();
    addAssistantMessage(
      "Welcome to Budget Copilot.\n\nStart by describing your ICT budget project or uploading a supporting document. I will keep suggestions separate until you choose to apply them to the form."
    );
    renderAll();
  }

  function cacheElements() {
    [
      "settingsToggle",
      "settingsPanel",
      "entityNameInput",
      "proxyBaseUrlInput",
      "providerInput",
      "core42ApiKeyInput",
      "core42ModelInput",
      "foundryApiKeyInput",
      "foundryModelInput",
      "foundryEndpointInput",
      "activityStatus",
      "activityTitle",
      "activityDetail",
      "clearButton",
      "chatLog",
      "uploadQuickAction",
      "suggestProjectFieldsButton",
      "checkBudgetConsiderationsButton",
      "chatForm",
      "chatInput",
      "fileInput",
      "uploadDocumentButton",
      "documentsList",
      "budgetRows",
      "totalBudget",
      "saveDraftButton",
      "submitButton",
      "addBudgetItem",
      "modelLogList",
    ].forEach((id) => {
      elements[id] = document.getElementById(id);
    });

    elements.formFields = Array.from(document.querySelectorAll("[data-field]"));
    elements.providerSettings = Array.from(document.querySelectorAll("[data-provider-settings]"));
  }

  function loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const savedEntityName = saved.projectContext?.entityName || saved.entityName || "";
        state.projectContext.entityName = isLikelyInvalidEntityName(savedEntityName) ? "" : savedEntityName;
        const savedAiConfig = saved.core42 || saved.foundry ? saved : { core42: saved, provider: saved.provider };
        state.aiConfig.proxyBaseUrl = normalizeProxyBaseUrl(savedAiConfig.proxyBaseUrl || saved.proxyBaseUrl || "");
        state.aiConfig.provider = savedAiConfig.provider === "foundry" ? "foundry" : DEFAULT_PROVIDER;
        state.aiConfig.core42.apiKey = savedAiConfig.core42?.apiKey || saved.apiKey || "";
        state.aiConfig.core42.model =
          !savedAiConfig.core42?.model && (!saved.model || saved.model === "gpt-4.1")
            ? DEFAULT_MODEL
            : savedAiConfig.core42?.model || saved.model || DEFAULT_MODEL;
        state.aiConfig.foundry.apiKey = savedAiConfig.foundry?.apiKey || "";
        state.aiConfig.foundry.model = savedAiConfig.foundry?.model || DEFAULT_MODEL;
        state.aiConfig.foundry.responsesEndpoint =
          savedAiConfig.foundry?.responsesEndpoint || FOUNDRY_DISPLAY_ENDPOINT;
      }
    } catch {
      state.projectContext = { entityName: "" };
      state.aiConfig = {
        proxyBaseUrl: DEFAULT_PROXY_BASE_URL,
        provider: DEFAULT_PROVIDER,
        core42: { apiKey: "", model: DEFAULT_MODEL },
        foundry: { apiKey: "", model: DEFAULT_MODEL, responsesEndpoint: FOUNDRY_DISPLAY_ENDPOINT },
      };
    }

    elements.entityNameInput.value = state.projectContext.entityName;
    elements.proxyBaseUrlInput.value = state.aiConfig.proxyBaseUrl;
    elements.providerInput.value = state.aiConfig.provider;
    elements.core42ApiKeyInput.value = state.aiConfig.core42.apiKey;
    elements.core42ModelInput.value = state.aiConfig.core42.model;
    elements.foundryApiKeyInput.value = state.aiConfig.foundry.apiKey;
    elements.foundryModelInput.value = state.aiConfig.foundry.model;
    elements.foundryEndpointInput.value = FOUNDRY_DISPLAY_ENDPOINT;
    renderProviderSettings();
  }

  function saveConfig() {
    state.projectContext.entityName = elements.entityNameInput.value.trim();
    if (state.projectContext.entityName) {
      state.awaitingEntityName = false;
      state.strategicPriorityEntityPromptKey = "";
    }
    state.aiConfig.proxyBaseUrl = normalizeProxyBaseUrl(elements.proxyBaseUrlInput.value);
    state.aiConfig.provider = elements.providerInput.value === "foundry" ? "foundry" : DEFAULT_PROVIDER;
    state.aiConfig.core42.apiKey = elements.core42ApiKeyInput.value.trim();
    state.aiConfig.core42.model = elements.core42ModelInput.value.trim() || DEFAULT_MODEL;
    state.aiConfig.foundry.apiKey = elements.foundryApiKeyInput.value.trim();
    state.aiConfig.foundry.model = elements.foundryModelInput.value.trim() || DEFAULT_MODEL;
    state.aiConfig.foundry.responsesEndpoint = FOUNDRY_DISPLAY_ENDPOINT;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state.aiConfig,
        projectContext: state.projectContext,
      })
    );
    renderProviderSettings();
  }

  function renderProviderSettings() {
    const provider = elements.providerInput?.value || state.aiConfig.provider;
    for (const panel of elements.providerSettings || []) {
      panel.hidden = panel.dataset.providerSettings !== provider;
    }
  }

  function setBusy(isBusy, title = "Working", detail = "Please wait before sending another message.") {
    state.busy = isBusy;
    state.activity = { title, detail };
    elements.activityStatus.hidden = !isBusy;
    elements.activityTitle.textContent = title;
    elements.activityDetail.textContent = detail;

    [
      elements.chatInput,
      elements.chatForm.querySelector("button"),
      elements.uploadQuickAction,
      elements.uploadDocumentButton,
      elements.suggestProjectFieldsButton,
      elements.checkBudgetConsiderationsButton,
      elements.clearButton,
    ].forEach((element) => {
      if (element) element.disabled = isBusy;
    });

    updateSuggestionButtonState();
    updateBudgetConsiderationButtonState();
    if (elements.chatLog) renderChat();
  }

  function updateActivity(title, detail) {
    if (!state.busy) return;
    state.activity = { title, detail };
    elements.activityTitle.textContent = title;
    elements.activityDetail.textContent = detail;
    renderChat();
  }

  function bindEvents() {
    elements.settingsToggle.addEventListener("click", () => {
      elements.settingsPanel.hidden = !elements.settingsPanel.hidden;
    });

    elements.entityNameInput.addEventListener("input", () => {
      saveConfig();
      updateBudgetConsiderationButtonState();
      scheduleStrategicPriorityClassification();
    });
    elements.entityNameInput.addEventListener("change", () => {
      saveConfig();
      updateBudgetConsiderationButtonState();
      scheduleStrategicPriorityClassification();
    });
    elements.providerInput.addEventListener("change", saveConfig);
    elements.proxyBaseUrlInput.addEventListener("change", saveConfig);
    elements.core42ApiKeyInput.addEventListener("change", saveConfig);
    elements.core42ModelInput.addEventListener("change", saveConfig);
    elements.foundryApiKeyInput.addEventListener("change", saveConfig);
    elements.foundryModelInput.addEventListener("change", saveConfig);

    elements.clearButton.addEventListener("click", resetWorkspace);
    elements.uploadQuickAction.addEventListener("click", () => elements.fileInput.click());
    elements.uploadDocumentButton.addEventListener("click", () => elements.fileInput.click());
    elements.suggestProjectFieldsButton.addEventListener("click", showEvaluatedProjectFields);
    elements.checkBudgetConsiderationsButton.addEventListener("click", runBudgetConsiderationPolicyCheck);
    elements.fileInput.addEventListener("change", handleFileSelection);

    elements.chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = elements.chatInput.value.trim();
      if (!text) return;
      elements.chatInput.value = "";
      handleUserMessage(text);
    });

    elements.formFields.forEach((field) => {
      field.addEventListener("input", () => {
        const key = field.dataset.field;
        state.form[key] = field.value;
        field.classList.remove("is-suggested");
        updateBudgetConsiderationButtonState();
        if (key === "project_name" || key === "project_description") {
          scheduleStrategicPriorityClassification();
        }
      });
    });

    elements.saveDraftButton.addEventListener("click", () => {
      showToast("Draft saved locally for this prototype session.");
    });

    elements.submitButton.addEventListener("click", () => {
      showToast("Submission is disabled in this standalone local prototype.");
    });

    elements.addBudgetItem.addEventListener("click", () => {
      state.budgetRows.push({
        account: "Manual budget item",
        classification: "Not classified",
        amount: null,
        note: "Added manually in the prototype.",
      });
      renderBudgetRows();
    });
  }

  function resetWorkspace() {
    state.messages = [];
    state.form = Object.fromEntries(Object.keys(state.form).map((key) => [key, ""]));
    state.documents = [];
    state.fileAnalyses = [];
    state.cumulativeAnalysis = null;
    state.budgetRows = [];
    state.pendingSuggestions = null;
    state.suggestionsVisible = false;
    state.appliedSuggestions = [];
    state.budgetConsiderationResult = null;
    state.modelLogs = [];
    state.projectContext.entityName = "";
    state.strategicPriorityLastInputKey = "";
    state.strategicPriorityEntityPromptKey = "";
    state.awaitingEntityName = false;
    if (elements.entityNameInput) elements.entityNameInput.value = "";
    saveConfig();
    syncFormInputs();
    addAssistantMessage(
      "Workspace cleared. Describe your ICT budget project or upload a supporting document to begin."
    );
    renderAll();
  }

  function addAssistantMessage(content, options = {}) {
    state.messages.push({ role: "assistant", content, tone: options.tone || "normal", html: options.html || "" });
  }

  function addUserMessage(content) {
    state.messages.push({ role: "user", content });
  }

  async function handleUserMessage(text) {
    if (state.busy) {
      showToast("Please wait for the current request to finish.");
      return;
    }

    addUserMessage(text);
    renderChat();

    if (!ensureApiKey()) {
      addAssistantMessage(
        `Add your ${getActiveProviderLabel()} API key in Settings to use the live copilot. For security, this local prototype stores it only in this browser.`,
        { tone: "error" }
      );
      renderChat();
      return;
    }

    setBusy(true, "Budget Copilot is writing", "Please wait while I prepare the next response.");
    const assistantIndex = state.messages.length;
    state.messages.push({ role: "assistant", content: "" });
    renderChat();

    try {
      await streamChatResponse(assistantIndex);
      try {
        await runStructuredChatAnalysis();
      } catch (extractionError) {
        addAssistantMessage(
          formatCore42Error(extractionError, "Project field suggestion failed."),
          { tone: "error" }
        );
      }
    } catch (error) {
      state.messages[assistantIndex].tone = "error";
      state.messages[assistantIndex].content =
        formatCore42Error(error, `${getActiveProviderLabel()} chat request failed.`);
    } finally {
      setBusy(false);
      renderAll();
    }
  }

  function ensureApiKey() {
    saveConfig();
    return Boolean(getActiveProviderConfig().apiKey);
  }

  function getActiveProvider() {
    return state.aiConfig.provider === "foundry" ? "foundry" : "core42";
  }

  function getActiveProviderConfig() {
    return state.aiConfig[getActiveProvider()];
  }

  function getActiveProviderLabel() {
    return getActiveProvider() === "foundry" ? "Microsoft Foundry" : "Core42";
  }

  function getActiveModel() {
    return getActiveProviderConfig().model || DEFAULT_MODEL;
  }

  function normalizeProxyBaseUrl(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return DEFAULT_PROXY_BASE_URL;
    return trimmed.replace(/\/+$/, "");
  }

  function getProxyBaseUrl() {
    return normalizeProxyBaseUrl(state.aiConfig.proxyBaseUrl);
  }

  function buildApiUrl(path) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${getProxyBaseUrl()}${cleanPath}`;
  }

  function buildAssetUrl(path) {
    if (window.location.protocol === "file:") {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      return `${getProxyBaseUrl()}/${cleanPath}`;
    }
    return path;
  }

  function getChatEndpoint() {
    return buildApiUrl(getActiveProvider() === "foundry" ? FOUNDRY_RESPONSES_ENDPOINT : CORE42_CHAT_ENDPOINT);
  }

  function getResponsesEndpoint() {
    return buildApiUrl(getActiveProvider() === "foundry" ? FOUNDRY_RESPONSES_ENDPOINT : CORE42_RESPONSES_ENDPOINT);
  }

  function buildChatRequestPayload(messages, options) {
    if (getActiveProvider() === "foundry") {
      return buildResponsesTextPayload(messages, options);
    }

    return {
      model: getActiveModel(),
      stream: Boolean(options.stream),
      temperature: options.temperature,
      messages,
    };
  }

  function buildResponsesTextPayload(messages, options) {
    const systemMessages = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const input = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      }));

    return {
      model: getActiveModel(),
      instructions: systemMessages,
      input,
      stream: Boolean(options.stream),
      temperature: options.temperature,
    };
  }

  async function streamChatResponse(assistantIndex) {
    const messages = await buildChatMessages();
    const endpoint = getChatEndpoint();
    const payload = buildChatRequestPayload(messages, { stream: true, temperature: 0.2 });
    const logId = createModelLog({ purpose: "Chat streaming response", endpoint, request: payload });
    let logFinished = false;
    const finishLogOnce = (updates) => {
      if (logFinished) return;
      logFinished = true;
      finishModelLog(logId, updates);
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      finishLogOnce({ error: error?.message || String(error) });
      throw error;
    }

    if (!response.ok || !response.body) {
      const error = await buildHttpError(response);
      finishLogOnce({ error: error.message });
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let visibleText = "";
    let sawDone = false;
    let typingPromise = Promise.resolve();

    const queueText = (delta) => {
      fullText += delta;
      typingPromise = typingPromise.then(() =>
        typeAssistantText(assistantIndex, fullText, () => {
          visibleText = state.messages[assistantIndex].content;
        })
      );
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";

      for (const line of lines) {
        const delta = parseStreamLine(line);
        if (delta === "[DONE]") {
          sawDone = true;
          break;
        }
        if (!delta) continue;

        queueText(delta);
      }

      if (sawDone) break;
    }

    const remaining = buffer.trim();
    if (remaining && !sawDone) {
      const delta = parseStreamLine(remaining);
      if (delta && delta !== "[DONE]") {
        queueText(delta);
      }
    }

    await typingPromise;

    if (!fullText.trim()) {
      state.messages[assistantIndex].tone = "error";
      state.messages[assistantIndex].content =
        "Budget Copilot returned a streaming response, but this page could not extract assistant text from it.";
      finishLogOnce({
        status: "Completed",
        response: {
          output_text: "",
          warning: "No assistant text could be extracted from the streaming events.",
        },
      });
      return;
    }

    finishLogOnce({
      status: "Completed",
      response: {
        output_text: fullText,
        stream_completed: sawDone,
      },
    });
  }

  function typeAssistantText(assistantIndex, targetText, onUpdate) {
    return new Promise((resolve) => {
      const step = () => {
        const current = state.messages[assistantIndex].content || "";
        if (current.length >= targetText.length) {
          resolve();
          return;
        }

        const remaining = targetText.length - current.length;
        const chunkSize = remaining > 80 ? 10 : remaining > 30 ? 6 : 3;
        state.messages[assistantIndex].content = targetText.slice(0, current.length + chunkSize);
        if (onUpdate) onUpdate();
        renderChat();
        window.setTimeout(step, 18);
      };

      step();
    });
  }

  function parseStreamLine(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(":")) return "";

    const data = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
    if (!data) return "";
    if (data === "[DONE]") return "[DONE]";

    try {
      return extractStreamingTextDelta(JSON.parse(data));
    } catch {
      return "";
    }
  }

  function extractStreamingTextDelta(chunk) {
    if (chunk.type && /(?:done|completed|created|in_progress|queued)$/i.test(chunk.type)) {
      return "";
    }

    const choice = chunk.choices?.[0];
    const delta = choice?.delta;
    if (typeof delta === "string") return delta;
    if (typeof delta?.content === "string") return delta.content;
    if (Array.isArray(delta?.content)) {
      return delta.content.map(extractContentPartText).join("");
    }

    if (typeof chunk.delta === "string") return chunk.delta;
    if (chunk.type && /\.delta$/i.test(chunk.type) && typeof chunk.text === "string") return chunk.text;
    if (chunk.type && /\.delta$/i.test(chunk.type) && typeof chunk.content === "string") return chunk.content;
    if (chunk.type && /\.delta$/i.test(chunk.type) && typeof chunk.output_text === "string") return chunk.output_text;

    return "";
  }

  function extractTextFromStreamChunk(chunk) {
    const choice = chunk.choices?.[0];
    const delta = choice?.delta;
    const message = choice?.message;

    if (typeof delta === "string") return delta;
    if (typeof chunk.delta === "string") return chunk.delta;
    if (typeof chunk.text === "string") return chunk.text;
    if (typeof chunk.output_text === "string") return chunk.output_text;
    if (typeof chunk.content === "string") return chunk.content;
    if (typeof delta?.content === "string") return delta.content;
    if (typeof message?.content === "string") return message.content;

    if (Array.isArray(delta?.content)) {
      return delta.content.map(extractContentPartText).join("");
    }
    if (Array.isArray(message?.content)) {
      return message.content.map(extractContentPartText).join("");
    }
    if (Array.isArray(chunk.content)) {
      return chunk.content.map(extractContentPartText).join("");
    }

    if (chunk.type && typeof chunk.delta === "object") {
      return extractTextFromStreamChunk(chunk.delta);
    }

    return "";
  }

  function extractContentPartText(part) {
    if (typeof part === "string") return part;
    if (!part || typeof part !== "object") return "";
    if (typeof part.text === "string") return part.text;
    if (typeof part.content === "string") return part.content;
    if (typeof part.delta === "string") return part.delta;
    return "";
  }

  async function buildChatMessages(extraMessages = []) {
    const stateMessage = {
      role: "system",
      content: buildRuntimeContextForChat(),
    };

    const recentMessages = state.messages
      .filter((message) => message.content && message.role !== "system")
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    return [{ role: "system", content: await loadChatPrompt() }, stateMessage, ...recentMessages, ...extraMessages];
  }

  async function loadChatPrompt() {
    if (state.chatPromptText) return state.chatPromptText;

    const response = await fetch(buildAssetUrl(CHAT_PROMPT_PATH));
    if (!response.ok) {
      throw new Error("Could not load the Budget Copilot chat assistant prompt.");
    }

    state.chatPromptText = await response.text();
    return state.chatPromptText;
  }

  function buildRuntimeContextForChat() {
    const context = {
      current_form_state: state.form,
      uploaded_documents: state.documents.map((document) => ({
        id: document.id,
        name: document.name,
        size: document.size,
        status: document.status,
        error: document.error || "",
      })),
      file_analyses: state.fileAnalyses.map((item) => ({
        fileName: item.fileName,
        analysis: summarizeFileAnalysisForChat(item.analysis),
      })),
      cumulative_analysis: state.cumulativeAnalysis ? summarizeFileAnalysisForChat(state.cumulativeAnalysis) : null,
      budget_rows: state.budgetRows,
      pending_suggestions: state.pendingSuggestions
        ? {
            ...state.pendingSuggestions,
            rawModelResponse: state.pendingSuggestions.rawModelResponse ? "[available in UI]" : "",
          }
        : null,
      applied_suggestions: state.appliedSuggestions,
      entity_name: state.projectContext.entityName || "",
      entity_name_status: state.projectContext.entityName
        ? "Provided in Settings."
        : "Missing. Ask the user to add the submitting entity name in Settings before completing strategic priority fields.",
    };

    return `Runtime context for the current ICT budget project:\n${JSON.stringify(context, null, 2)}`;
  }

  function stripRawModelResponse(value) {
    if (Array.isArray(value)) return value.map(stripRawModelResponse);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "__rawModelResponse")
        .map(([key, item]) => [key, stripRawModelResponse(item)])
    );
  }

  function summarizeFileAnalysisForChat(analysis) {
    const clean = stripRawModelResponse(analysis);
    return {
      evaluation_version: clean.evaluation_version || "",
      file: clean.file || null,
      document_profile: clean.document_profile || null,
      short_summary: clean.file_summary?.short_summary || "",
      key_facts: (clean.file_summary?.key_facts || []).slice(0, 10),
      evidence_assessment: clean.evidence_assessment || null,
      suggested_project_fields: clean.suggested_project_fields || [],
      budget_lines: clean.budget_lines || [],
      account_code_suggestions: clean.account_code_suggestions || [],
      review_flags: clean.review_flags || [],
    };
  }

  async function runStructuredChatAnalysis() {
    updateActivity("Budget Copilot is thinking", "Checking whether the conversation is ready for an Apply Suggestions card.");
    const messages = await buildChatMessages([{ role: "user", content: STRUCTURED_ANALYSIS_INSTRUCTION }]);
    const endpoint = getChatEndpoint();
    const payload = buildChatRequestPayload(messages, { stream: false, temperature: 0 });
    const logId = createModelLog({ purpose: "Structured project-field extraction", endpoint, request: payload });
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      finishModelLog(logId, { error: error?.message || String(error) });
      throw error;
    }

    if (!response.ok) {
      const error = await buildHttpError(response);
      finishModelLog(logId, { error: error.message });
      throw error;
    }

    const result = await response.json();
    finishModelLog(logId, { status: "Completed", response: result });
    const content =
      getActiveProvider() === "foundry" ? extractResponsesText(result) : result.choices?.[0]?.message?.content || "";
    const analysis = parseJsonFromText(content);
    if (state.fileAnalyses.length >= 2 && state.cumulativeAnalysis) {
      await enrichPendingSuggestionsWithStrategicPriority();
      return;
    }
    if (!analysis || analysis.next_action === "explain_only" || analysis.next_action === "refuse") {
      await maybeRunStrategicPriorityOnly();
      return;
    }

    const fields = collectSuggestedFields(analysis);
    const changedFields = filterChangedSuggestionFields(fields);

    const budgetRows = buildBudgetRowsFromAnalysis(analysis);
    const pendingFields = state.pendingSuggestions?.fields || {};
    const canCheckStrategicPriority =
      Boolean(changedFields.project_name || pendingFields.project_name || state.form.project_name) &&
      Boolean(changedFields.project_description || pendingFields.project_description || state.form.project_description);
    if (!Object.keys(changedFields).length && !budgetRows.length && !canCheckStrategicPriority) {
      return;
    }

    mergePendingSuggestions({
      source: "chat",
      title: analysis.ready_to_suggest
        ? "Suggestions from this conversation"
        : "Draft suggestions from this conversation",
      fields: changedFields,
      budgetRows,
      evidence: analysis.evidence_notes || analysis.user_facing_reason || "Suggested from the current conversation.",
      proof: null,
      missingInformation: analysis.missing_information || [],
      reviewFlags: (analysis.warnings || []).map((warning) => ({
        flag: String(warning),
        reason: String(warning),
      })),
    });

    await enrichPendingSuggestionsWithStrategicPriority();
    sanitizePendingSuggestions();

    if (!Object.keys(state.pendingSuggestions.fields || {}).length && !state.pendingSuggestions.budgetRows?.length) {
      state.pendingSuggestions = null;
    }

    // The visible assistant reply is produced by the streaming chat call.
    // This structured call is only for extracting field suggestions.
  }

  function isLikelyInvalidEntityName(value) {
    const normalized = String(value || "")
      .toLowerCase()
      .trim();
    if (!normalized) return false;
    return (
      normalized.length < 3 ||
      /^(hi|hello|hey|ok|okay|thanks|thank you|suggest strategic priority|suggest priority)$/i.test(normalized) ||
      normalized.includes("suggest strategic")
    );
  }

  async function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    for (const file of files) {
      await analyzeUploadedFile(file);
    }
  }

  async function analyzeUploadedFile(file) {
    if (file.size > MAX_FILE_BYTES) {
      addAssistantMessage(
        `${file.name} is larger than the local prototype limit of 25 MB. Please use a smaller file or split the document.`,
        { tone: "error" }
      );
      renderAll();
      return;
    }

    if (!ensureApiKey()) {
      addAssistantMessage(
        `Add your ${getActiveProviderLabel()} API key in Settings before uploading a document for live analysis.`,
        { tone: "error" }
      );
      renderAll();
      return;
    }

    const doc = {
      id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      name: file.name,
      size: file.size,
      status: "Analyzing",
      error: "",
    };
    state.documents.push(doc);
    renderDocuments();

    try {
      setBusy(true, "Budget Copilot is analyzing", `Reading ${file.name} and checking it against the supporting-document prompt.`);
      const analysis = await runDocumentAnalysis(file);
      doc.status = "Analyzed";
      doc.rawModelResponse = analysis.__rawModelResponse || "";
      doc.evidenceScore = normalizeEvidenceScore(analysis.evidence_assessment?.evidence_score);
      doc.evidenceQuality = analysis.evidence_assessment?.evidence_quality || "";
      doc.supportsProject = analysis.evidence_assessment?.supports_project || "";
      doc.usableAsEvidence =
        analysis.evidence_assessment?.proof_relevance_assessment?.usable_as_budget_evidence || "";
      state.fileAnalyses.push({ fileName: file.name, analysis });
      addAssistantMessage(buildEvidenceAssessmentMessage(analysis, file.name));
      if (state.fileAnalyses.length >= 2) {
        try {
          await runCumulativeDocumentAnalysis();
        } catch (cumulativeError) {
          if (!state.cumulativeAnalysis) {
            state.pendingSuggestions = null;
            state.suggestionsVisible = false;
          }
          addAssistantMessage(formatCore42Error(cumulativeError, "Cumulative document analysis failed."), {
            tone: "error",
          });
        }
      } else {
        prepareSuggestionsFromAnalysis(analysis, file.name);
        await enrichPendingSuggestionsWithStrategicPriority();
      }
    } catch (error) {
      doc.status = "Error";
      doc.error = formatCore42Error(error, "Document analysis failed.");
      addAssistantMessage(doc.error, { tone: "error" });
    } finally {
      setBusy(false);
      renderAll();
    }
  }

  async function runDocumentAnalysis(file) {
    updateActivity("Budget Copilot is preparing", "Preparing the document analysis.");
    const prompt = await loadSupportingDocumentPrompt();
    const runtimeInput = {
      draft_project_context: state.form,
      file: {
        file_name: file.name,
        file_type: file.type || getMimeType(file.name),
        file_size_bytes: file.size,
      },
      instruction: "Analyze the attached file for ICT budgeting project creation. Return valid JSON only.",
    };
    const finalPrompt = buildPromptWithRuntimeInput(prompt, runtimeInput);

    updateActivity("Budget Copilot is analyzing", "Reviewing the file and extracting project suggestions.");
    return await callResponsesWithFile(file, finalPrompt);
  }

  async function loadSupportingDocumentPrompt() {
    if (state.documentPromptText) return state.documentPromptText;

    const response = await fetch(buildAssetUrl(DOCUMENT_PROMPT_PATH));
    if (!response.ok) {
      throw new Error(
        "Could not load the supporting document prompt. Open this page through a local web server, not directly from the file system."
      );
    }

    state.documentPromptText = await response.text();
    return state.documentPromptText;
  }

  async function loadCumulativeDocumentPrompt() {
    if (state.cumulativePromptText) return state.cumulativePromptText;

    const response = await fetch(buildAssetUrl(CUMULATIVE_PROMPT_PATH));
    if (!response.ok) {
      throw new Error(
        "Could not load the cumulative document prompt. Open this page through a local web server, not directly from the file system."
      );
    }

    state.cumulativePromptText = await response.text();
    return state.cumulativePromptText;
  }

  async function loadBudgetConsiderationPrompt() {
    if (state.budgetConsiderationPromptText) return state.budgetConsiderationPromptText;

    const response = await fetch(buildAssetUrl(BUDGET_CONSIDERATION_PROMPT_PATH));
    if (!response.ok) {
      throw new Error(
        "Could not load the DGE budget considerations prompt. Open this page through a local web server, not directly from the file system."
      );
    }

    state.budgetConsiderationPromptText = await response.text();
    return state.budgetConsiderationPromptText;
  }

  function buildPromptWithRuntimeInput(prompt, runtimeInput) {
    const runtimeJson = JSON.stringify(runtimeInput, null, 2);
    const promptWithInput = prompt.includes("{{RUNTIME_INPUT_JSON}}")
      ? prompt.replace("{{RUNTIME_INPUT_JSON}}", runtimeJson)
      : `${prompt}\n\nInput:\n${runtimeJson}`;

    return `${promptWithInput}\n\nReturn valid JSON only. Do not include markdown fences.`;
  }

  async function callResponsesWithFile(file, promptText) {
    const contentItem = await buildFileContentItem(file);
    const endpoint = getResponsesEndpoint();
    const payload = {
      model: getActiveModel(),
      input: [
        {
          role: "user",
          content: [
            contentItem,
            {
              type: "input_text",
              text: promptText,
            },
          ],
        },
      ],
      temperature: 0,
      max_output_tokens: 12000,
    };
    const logId = createModelLog({ purpose: `Document analysis: ${file.name}`, endpoint, request: payload });
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      finishModelLog(logId, { error: error?.message || String(error) });
      throw error;
    }

    if (!response.ok) {
      const error = await buildHttpError(response);
      finishModelLog(logId, { error: error.message });
      throw error;
    }

    const result = await response.json();
    finishModelLog(logId, { status: "Completed", response: result });
    const rawModelResponse = extractResponsesText(result);
    const analysis = parseAnalysisJson(rawModelResponse);
    analysis.__rawModelResponse = rawModelResponse;
    return analysis;
  }

  async function callResponsesWithText(promptText, purpose = "Responses text call", maxOutputTokens = 4000) {
    const endpoint = getResponsesEndpoint();
    const payload = {
      model: getActiveModel(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: promptText,
            },
          ],
        },
      ],
      temperature: 0,
      max_output_tokens: maxOutputTokens,
    };
    const logId = createModelLog({ purpose, endpoint, request: payload });
    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: aiHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (error) {
      finishModelLog(logId, { error: error?.message || String(error) });
      throw error;
    }

    if (!response.ok) {
      const error = await buildHttpError(response);
      finishModelLog(logId, { error: error.message });
      throw error;
    }

    const result = await response.json();
    finishModelLog(logId, { status: "Completed", response: result });
    return extractResponsesText(result);
  }

  async function runCumulativeDocumentAnalysis() {
    updateActivity("Budget Copilot is reviewing all documents", "Combining completed file analyses into one project view.");
    const prompt = await loadCumulativeDocumentPrompt();
    const runtimeInput = buildCumulativeRuntimeInput();
    const finalPrompt = buildPromptWithRuntimeInput(prompt, runtimeInput);
    const rawModelResponse = await callResponsesWithText(
      finalPrompt,
      "Cumulative document evaluation",
      16000
    );
    const analysis = parseAnalysisJson(rawModelResponse);
    analysis.__rawModelResponse = rawModelResponse;
    state.cumulativeAnalysis = analysis;

    prepareSuggestionsFromCumulativeAnalysis(analysis);
    await enrichPendingSuggestionsWithStrategicPriority();
    addAssistantMessage(buildCumulativeAssessmentMessage(analysis));
  }

  async function runBudgetConsiderationPolicyCheck() {
    if (state.busy) {
      showToast("Please wait for the current request to finish.");
      return;
    }

    const inputs = getBudgetConsiderationInputs();
    if (!inputs.entityName || !inputs.projectName || !inputs.projectDescription) {
      addAssistantMessage(
        "To check DGE Budget Considerations, I need Entity Name in Settings plus a Project Name and Summary / Description.",
        { tone: "system" }
      );
      renderChat();
      return;
    }

    if (!ensureApiKey()) {
      addAssistantMessage(
        `Add your ${getActiveProviderLabel()} API key in Settings before checking DGE Budget Considerations.`,
        { tone: "error" }
      );
      renderChat();
      return;
    }

    setBusy(
      true,
      "Budget Copilot is checking",
      "Reviewing the project against DGE budget consideration policies."
    );

    try {
      const prompt = await loadBudgetConsiderationPrompt();
      const promptText = prompt
        .replace("{{ENTITY_NAME}}", inputs.entityName)
        .replace("{{PROJECT_NAME}}", inputs.projectName)
        .replace("{{PROJECT_DESCRIPTION}}", inputs.projectDescription);
      const rawText = await callResponsesWithText(
        `${promptText}\n\nReturn valid JSON only. Do not include markdown fences.`,
        "DGE budget considerations check",
        6000
      );
      const parsed = parseJsonFromText(rawText);
      if (!parsed || typeof parsed !== "object" || !parsed.overall_assessment) {
        throw new Error("The DGE budget considerations response was not valid JSON.");
      }

      state.budgetConsiderationResult = parsed;
      addAssistantMessage(buildBudgetConsiderationMessage(parsed), {
        tone: "policy",
        html: buildBudgetConsiderationHtml(parsed),
      });
    } catch (error) {
      addAssistantMessage(formatCore42Error(error, "DGE budget considerations check failed."), { tone: "error" });
    } finally {
      setBusy(false);
      renderAll();
    }
  }

  function getBudgetConsiderationInputs() {
    const pendingFields = state.pendingSuggestions?.fields || {};
    return {
      entityName: String(state.projectContext.entityName || "").trim(),
      projectName: String(pendingFields.project_name || state.form.project_name || "").trim(),
      projectDescription: String(pendingFields.project_description || state.form.project_description || "").trim(),
    };
  }

  function buildCumulativeRuntimeInput() {
    const completedAnalyses = state.fileAnalyses.map((item, index) => {
      const clean = stripRawModelResponse(item.analysis);
      return {
        file_id: `file_${index + 1}`,
        file_name: item.fileName,
        evaluation_version: clean.evaluation_version || "",
        file: clean.file || {},
        document_profile: clean.document_profile || {},
        file_summary: clean.file_summary || {},
        evidence_assessment: clean.evidence_assessment || {},
        suggested_project_fields: clean.suggested_project_fields || [],
        budget_lines: clean.budget_lines || [],
        account_code_suggestions: clean.account_code_suggestions || [],
        review_flags: clean.review_flags || [],
      };
    });

    return {
      project_context: {
        project_id: "",
        entity_name: state.projectContext.entityName || "",
        draft_project_name: state.form.project_name || "",
        draft_project_description: state.form.project_description || "",
        draft_category: state.form.category || "",
        draft_technology_company: state.form.technology_company || "",
        draft_technology_products: normalizeTechnologyProductsForContext(state.form.technology_products),
        draft_budget_item_type: state.form.budget_item_type || "",
        draft_budget_item_classification: state.form.budget_item_classification || "",
        draft_account_code_lines: state.budgetRows || [],
      },
      analysis_status: {
        total_uploaded_files: state.documents.length,
        completed_file_analyses: completedAnalyses.length,
        pending_file_analyses: state.documents.filter((document) => document.status === "Analyzing").length,
        failed_file_analyses: state.documents.filter((document) => document.status === "Error").length,
      },
      file_analyses: completedAnalyses,
    };
  }

  function normalizeTechnologyProductsForContext(value) {
    if (Array.isArray(value)) return value;
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function buildFileContentItem(file) {
    const dataUrl = await fileToDataUrl(file);
    if (getFileKind(file) === "image") {
      return {
        type: "input_image",
        image_url: dataUrl,
      };
    }

    return {
      type: "input_file",
      filename: file.name,
      file_data: dataUrl,
    };
  }

  function getFileKind(file) {
    const mime = file.type || getMimeType(file.name);
    return mime.startsWith("image/") ? "image" : "file";
  }

  function getMimeType(fileName) {
    const extension = fileName.toLowerCase().split(".").pop() || "";
    const mimeTypes = {
      pdf: "application/pdf",
      txt: "text/plain",
      md: "text/markdown",
      csv: "text/csv",
      json: "application/json",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    return mimeTypes[extension] || "application/octet-stream";
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read the selected file."));
      reader.readAsDataURL(file);
    });
  }

  function extractResponsesText(result) {
    if (typeof result.output_text === "string" && result.output_text.trim()) {
      return result.output_text;
    }

    const output = result.output || [];
    const parts = [];
    for (const item of output) {
      for (const content of item.content || []) {
        if (content.text) parts.push(content.text);
        if (content.type === "output_text" && content.text) parts.push(content.text);
      }
    }
    return parts.join("\n").trim() || JSON.stringify(result);
  }

  function parseAnalysisJson(text) {
    const parsed = parseJsonFromText(text);
    if (!parsed || typeof parsed !== "object") {
      const preview = String(text || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 700);
      throw new Error(
        `The model response was not valid JSON. The file is retained, but suggestions were not applied. Raw response preview: ${preview || "[empty response]"}`
      );
    }
    return parsed;
  }

  function parseJsonFromText(text) {
    if (!text) return null;
    const cleaned = String(text)
      .replace(/^\uFEFF/, "")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (fencedMatch) {
        try {
          return JSON.parse(fencedMatch[1].trim());
        } catch {
          // Continue to balanced-object extraction.
        }
      }

      const objectText = extractFirstBalancedJsonValue(cleaned);
      if (!objectText) return null;

      try {
        return JSON.parse(objectText);
      } catch {
        return null;
      }
    }
    return null;
  }

  function extractFirstBalancedJsonValue(text) {
    const objectStart = text.indexOf("{");
    const arrayStart = text.indexOf("[");
    const starts = [objectStart, arrayStart].filter((index) => index >= 0);
    if (!starts.length) return null;
    const start = Math.min(...starts);
    const opener = text[start];
    const closer = opener === "{" ? "}" : "]";
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "\"") {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === opener) depth += 1;
      if (char === closer) depth -= 1;

      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }

    return null;
  }

  function prepareSuggestionsFromAnalysis(analysis, fileName) {
    const fields = collectSuggestedFields(analysis);
    const changedFields = filterChangedSuggestionFields(fields);

    const budgetRows = buildBudgetRowsFromAnalysis(analysis);
    mergePendingSuggestions({
      source: "document",
      title: `Suggestions from ${fileName}`,
      fields: changedFields,
      budgetRows,
      evidence: analysis.evidence_assessment?.reason || "",
      proof: analysis.evidence_assessment || null,
      missingInformation: analysis.evidence_assessment?.missing_information || [],
      reviewFlags: analysis.review_flags || [],
      rawModelResponse: analysis.__rawModelResponse || "",
    });
  }

  function prepareSuggestionsFromCumulativeAnalysis(analysis) {
    const fields = collectSuggestedFields(analysis);
    const changedFields = filterChangedSuggestionFields(fields);
    const budgetRows = buildBudgetRowsFromAnalysis(analysis);

    state.pendingSuggestions = {
      source: "cumulative",
      title: "Suggestions from cumulative document analysis",
      fields: changedFields,
      fieldSourceMap: Object.fromEntries(Object.keys(changedFields).map((key) => [key, "cumulative"])),
      budgetRows,
      budgetRowsSource: "cumulative",
      evidence: analysis.evidence_assessment?.reason || analysis.file_summary?.short_summary || "",
      proof: analysis.evidence_assessment || null,
      missingInformation: analysis.evidence_assessment?.missing_information || [],
      reviewFlags: analysis.review_flags || [],
      rawModelResponse: analysis.__rawModelResponse || "",
    };

    state.suggestionsVisible = false;
    state.strategicPriorityLastInputKey = "";
    sanitizePendingSuggestions();
  }

  function mergePendingSuggestions(incoming) {
    if (!incoming) return;
    const incomingSource = incoming.source || "chat";
    const existing = state.pendingSuggestions;
    const previousStrategicInputKey = getStrategicPriorityInputs().inputKey;
    const projectIdentityIncoming = hasIncomingProjectIdentityField(incoming.fields || {});
    const merged = existing
      ? {
          ...existing,
          fields: { ...(existing.fields || {}) },
          fieldSourceMap: { ...(existing.fieldSourceMap || inferFieldSourceMap(existing)) },
          budgetRows: existing.budgetRows || [],
          budgetRowsSource: existing.budgetRowsSource || existing.source || "",
          missingInformation: existing.missingInformation || [],
          reviewFlags: existing.reviewFlags || [],
        }
      : {
          source: incomingSource,
          title: incoming.title || "Suggested project fields",
          fields: {},
          fieldSourceMap: {},
          budgetRows: [],
          budgetRowsSource: "",
          evidence: "",
          proof: null,
          missingInformation: [],
          reviewFlags: [],
        };

    for (const [key, value] of Object.entries(incoming.fields || {})) {
      mergeSuggestionField(merged, key, value, incomingSource);
    }

    if (incoming.budgetRows?.length) {
      mergeBudgetRows(merged, incoming.budgetRows, incomingSource);
    }

    merged.source = mergeSuggestionSource(merged.source, incomingSource);
    merged.title = buildMergedSuggestionTitle(merged, incoming);
    merged.evidence = mergeEvidenceText(merged, incoming);
    merged.proof = incomingSource === "document" && incoming.proof ? incoming.proof : merged.proof || incoming.proof || null;
    merged.missingInformation = uniqueStrings([...(merged.missingInformation || []), ...(incoming.missingInformation || [])]);
    merged.reviewFlags = mergeReviewFlags(merged.reviewFlags, incoming.reviewFlags);
    if (incoming.rawModelResponse) merged.rawModelResponse = incoming.rawModelResponse;
    if (incoming.strategicPrioritySuggestions) {
      merged.strategicPrioritySuggestions = incoming.strategicPrioritySuggestions;
      merged.strategicPrioritySource = incoming.strategicPrioritySource;
      merged.strategicPriorityNote = incoming.strategicPriorityNote || "";
    }

    state.pendingSuggestions = merged;
    if (projectIdentityIncoming) {
      invalidateStrategicPriorityIfProjectInputsChanged(previousStrategicInputKey);
    }
    sanitizePendingSuggestions();
  }

  function hasIncomingProjectIdentityField(fields) {
    return ["project_name", "project_description"].some((key) =>
      Object.prototype.hasOwnProperty.call(fields || {}, key)
    );
  }

  function invalidateStrategicPriorityIfProjectInputsChanged(previousInputKey) {
    if (!state.pendingSuggestions) return;
    const currentInputKey = getStrategicPriorityInputs().inputKey;
    if (!currentInputKey || currentInputKey === previousInputKey) return;

    delete state.pendingSuggestions.strategicPrioritySuggestions;
    delete state.pendingSuggestions.strategicPriorityNote;
    delete state.pendingSuggestions.strategicPrioritySource;
    delete state.pendingSuggestions.strategicPriorityInputKey;
    delete state.pendingSuggestions.fields.strategic_priority;
    delete state.pendingSuggestions.fields.strategic_priority_classification;
    state.strategicPriorityLastInputKey = "";
  }

  function mergeSuggestionField(target, key, value, incomingSource) {
    const existingValue = target.fields[key];
    const existingSource = target.fieldSourceMap[key] || target.source || "chat";
    const normalizedIncoming = normalizeFieldValue(value);
    const normalizedExisting = normalizeFieldValue(existingValue);

    if (!normalizedIncoming) return;
    if (normalizedExisting && normalizedExisting === normalizedIncoming) {
      target.fieldSourceMap[key] = strongerSuggestionSource(existingSource, incomingSource);
      return;
    }

    if (canOverwriteSuggestion(existingSource, incomingSource)) {
      target.fields[key] = value;
      target.fieldSourceMap[key] = incomingSource;
      return;
    }

    addReviewFlagToSuggestion(target, {
      severity: "Medium",
      flag: `Chat update conflicts with document-supported ${labelForField(key)}`,
      reason: `Keeping document-supported value "${normalizedExisting}" instead of chat value "${normalizedIncoming}".`,
    });
  }

  function canOverwriteSuggestion(existingSource, incomingSource) {
    if (!existingSource) return true;
    if (incomingSource === "document") return true;
    if (incomingSource === "strategic_priority") return true;
    if (existingSource === "document" && incomingSource === "chat") return false;
    return true;
  }

  function strongerSuggestionSource(first, second) {
    const rank = { chat: 1, mixed: 2, document: 3, strategic_priority: 4 };
    return (rank[second] || 0) > (rank[first] || 0) ? second : first;
  }

  function inferFieldSourceMap(suggestion) {
    return Object.fromEntries(Object.keys(suggestion?.fields || {}).map((key) => [key, suggestion.source || "chat"]));
  }

  function mergeBudgetRows(target, budgetRows, incomingSource) {
    if (incomingSource === "document" || target.budgetRowsSource !== "document") {
      target.budgetRows = budgetRows;
      target.budgetRowsSource = incomingSource;
      return;
    }

    if (JSON.stringify(target.budgetRows || []) !== JSON.stringify(budgetRows || [])) {
      addReviewFlagToSuggestion(target, {
        severity: "Medium",
        flag: "Chat budget lines differ from document-supported budget lines",
        reason: "Keeping the document-supported budget lines. Review manually if the chat update is more recent.",
      });
    }
  }

  function mergeSuggestionSource(existingSource, incomingSource) {
    if (!existingSource || existingSource === incomingSource) return incomingSource;
    if (existingSource === "mixed" || incomingSource === "mixed") return "mixed";
    return "mixed";
  }

  function buildMergedSuggestionTitle(merged, incoming) {
    if (merged.source === "mixed") return "Updated suggestions from conversation and documents";
    if (incoming.source === "document") return incoming.title || "Suggestions from uploaded document";
    if (incoming.source === "chat") return incoming.title || "Draft suggestions from this conversation";
    return incoming.title || merged.title || "Suggested project fields";
  }

  function mergeEvidenceText(merged, incoming) {
    if (incoming.source === "document" && incoming.evidence) return incoming.evidence;
    if (!merged.evidence) return incoming.evidence || "";
    if (!incoming.evidence || merged.evidence === incoming.evidence) return merged.evidence;
    return `${merged.evidence}\n\nLatest note: ${incoming.evidence}`;
  }

  function mergeReviewFlags(existingFlags = [], incomingFlags = []) {
    const merged = [...existingFlags];
    for (const flag of incomingFlags || []) {
      addReviewFlagToList(merged, flag);
    }
    return merged;
  }

  function addReviewFlagToSuggestion(target, flag) {
    target.reviewFlags = target.reviewFlags || [];
    addReviewFlagToList(target.reviewFlags, flag);
  }

  function addReviewFlagToList(list, flag) {
    if (!flag) return;
    const key = `${flag.flag || ""}|${flag.reason || ""}`;
    if (!list.some((item) => `${item.flag || ""}|${item.reason || ""}` === key)) {
      list.push(flag);
    }
  }

  function collectSuggestedFields(analysis) {
    const fields = {};
    for (const field of analysis?.suggested_project_fields || []) {
      const normalized = normalizeSuggestedField(field);
      if (!normalized) continue;
      fields[normalized.key] = normalized.value;
    }
    return fields;
  }

  function normalizeSuggestedField(field) {
    if (!field || field.suggested_value === null || field.suggested_value === undefined) return null;

    const rawKey = String(field.field_key || field.field || field.key || field.name || "");
    const rawLabel = String(field.field_label || field.label || field.field || "");
    const value = Array.isArray(field.suggested_value) ? field.suggested_value.join(", ") : field.suggested_value;
    const normalizedKey = normalizeFieldKey(rawKey);
    const normalizedLabel = normalizeFieldKey(rawLabel);
    const normalizedValue = normalizeFieldValue(value);

    if (isStrategicPriorityField(normalizedKey, normalizedLabel)) return null;
    if (normalizedKey === "entity_name" || normalizedLabel === "entity_name") return null;

    let key = mapSuggestionFieldKey(normalizedKey, normalizedLabel, normalizedValue);
    if (!key || !FORM_FIELD_KEYS.has(key)) return null;

    if (key === "category" && !CATEGORY_VALUES.has(normalizedValue)) return null;
    if (key === "budget_item_type" && !PROJECT_TYPE_VALUES.has(normalizedValue)) return null;
    if (key === "budget_item_classification" && !PROJECT_BUDGET_TYPE_VALUES.has(normalizedValue)) return null;

    return { key, value };
  }

  function normalizeFieldKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function isStrategicPriorityField(normalizedKey, normalizedLabel) {
    return [normalizedKey, normalizedLabel].some(
      (value) =>
        value === "strategic_priority" ||
        value === "strategic_priorities" ||
        value === "strategic_priority_classification" ||
        value === "strategic_priority_classifications" ||
        (value.includes("strategic") && value.includes("priority"))
    );
  }

  function mapSuggestionFieldKey(normalizedKey, normalizedLabel, normalizedValue) {
    const candidates = [normalizedKey, normalizedLabel];
    if (candidates.includes("project_name") || candidates.includes("initiative_budget_item_name")) {
      return "project_name";
    }
    if (
      candidates.includes("project_description") ||
      candidates.includes("summary_description") ||
      candidates.includes("summary")
    ) {
      return "project_description";
    }
    if (candidates.includes("category")) return "category";
    if (candidates.includes("technology_company") || candidates.includes("technology")) return "technology_company";
    if (candidates.includes("technology_product") || candidates.includes("technology_products")) {
      return "technology_products";
    }
    if (candidates.includes("planned_start_date") || candidates.includes("start_date")) return "planned_start_date";
    if (candidates.includes("planned_end_date") || candidates.includes("end_date")) return "planned_end_date";
    if (candidates.includes("work_stream") || candidates.includes("program_name")) return "work_stream";

    if (
      candidates.includes("project_budget_type") ||
      candidates.includes("budget_type") ||
      PROJECT_BUDGET_TYPE_VALUES.has(normalizedValue)
    ) {
      return "budget_item_classification";
    }
    if (
      candidates.includes("project_type") ||
      candidates.includes("ict_budget_items_type") ||
      candidates.includes("budget_item_type") ||
      PROJECT_TYPE_VALUES.has(normalizedValue)
    ) {
      return "budget_item_type";
    }

    return normalizedKey;
  }

  function filterChangedSuggestionFields(fields) {
    return Object.fromEntries(
      Object.entries(fields).filter(([key, value]) => {
        if (!(key in state.form)) return true;
        const suggested = normalizeFieldValue(value);
        const current = normalizeFieldValue(state.form[key]);
        return !current || current !== suggested;
      })
    );
  }

  function sanitizePendingSuggestions() {
    if (!state.pendingSuggestions) return;
    const strategicIsCurrent = hasCurrentStrategicPrioritySuggestion();
    ensureRankOneStrategicFields();
    const cleanFields = {};
    for (const [key, value] of Object.entries(state.pendingSuggestions.fields || {})) {
      const normalizedKey = normalizeFieldKey(key);
      const isStrategicField = isStrategicPriorityField(normalizedKey, "");
      if (isStrategicField && !strategicIsCurrent) continue;
      if (!FORM_FIELD_KEYS.has(key)) continue;
      cleanFields[key] = value;
    }
    state.pendingSuggestions.fields = cleanFields;
    if (!strategicIsCurrent) {
      delete state.pendingSuggestions.strategicPrioritySuggestions;
      delete state.pendingSuggestions.strategicPriorityNote;
      delete state.pendingSuggestions.strategicPrioritySource;
      delete state.pendingSuggestions.strategicPriorityInputKey;
    }
  }

  function ensureRankOneStrategicFields() {
    if (!hasCurrentStrategicPrioritySuggestion()) return;
    const suggestions = state.pendingSuggestions.strategicPrioritySuggestions || [];
    const primary = getRankOneStrategicSuggestion(suggestions);
    if (!primary) return;
    state.pendingSuggestions.fields = {
      ...(state.pendingSuggestions.fields || {}),
      ...buildStrategicPriorityFields(primary),
    };
  }

  function hasCurrentStrategicPrioritySuggestion() {
    if (state.pendingSuggestions?.strategicPrioritySource !== "classifier") return false;
    const currentInputKey = getStrategicPriorityInputs().inputKey;
    return Boolean(currentInputKey && state.pendingSuggestions.strategicPriorityInputKey === currentInputKey);
  }

  function normalizeFieldValue(value) {
    if (Array.isArray(value)) return value.join(", ").trim();
    return String(value ?? "").trim();
  }

  async function enrichPendingSuggestionsWithStrategicPriority() {
    if (!state.pendingSuggestions) return;

    const fields = state.pendingSuggestions.fields || {};
    const { entityName, projectName, projectDescription, inputKey } = getStrategicPriorityInputs();

    if (!projectName || !projectDescription) return;

    if (!entityName) {
      addSuggestionReviewFlag({
        severity: "Low",
        flag: "Entity name needed for strategic priority",
        reason:
          "Add the submitting entity name in Settings so Budget Copilot can complete the strategic priority fields using the project name and description.",
      });
      askForEntityNameBeforeStrategicPriority(projectName, projectDescription);
      return;
    }

    if (state.strategicPriorityLastInputKey === inputKey) return;

    updateActivity("Budget Copilot is thinking", "Checking strategic priority and classification.");
    let suggestions = [];
    try {
      suggestions = await runStrategicPriorityClassification({
        entityName,
        projectName,
        projectDescription,
      });
    } catch (error) {
      addSuggestionReviewFlag({
        severity: "Low",
        flag: "Strategic priority check failed",
        reason: error?.message || "Budget Copilot could not complete the strategic priority check.",
      });
      return;
    }

    if (!Array.isArray(suggestions) || !suggestions.length) return;

    const primary = getRankOneStrategicSuggestion(suggestions);
    const strategicFields = buildStrategicPriorityFields(primary);
    Object.assign(fields, strategicFields);

    state.pendingSuggestions.fields = fields;
    state.pendingSuggestions.strategicPrioritySuggestions = suggestions.slice(0, 2);
    state.pendingSuggestions.strategicPrioritySource = "classifier";
    state.pendingSuggestions.strategicPriorityInputKey = inputKey;
    state.pendingSuggestions.strategicPriorityNote = primary?.Reason
      ? `${primary["Strategic Priority"]} / ${primary["Strategic Priority Classification"]}: ${primary.Reason}`
      : "";
    state.strategicPriorityLastInputKey = inputKey;
  }

  async function maybeRunStrategicPriorityOnly() {
    if (state.pendingSuggestions) return false;

    const { entityName, projectName, projectDescription, inputKey } = getStrategicPriorityInputs();
    if (!projectName || !projectDescription) return false;
    if (state.strategicPriorityLastInputKey === inputKey) return false;

    state.pendingSuggestions = {
      source: "strategic_priority",
      title: "Strategic priority suggestions",
      fields: {},
      budgetRows: [],
      evidence: "",
      proof: null,
      missingInformation: [],
      reviewFlags: [],
    };
    state.suggestionsVisible = false;

    if (!entityName) {
      askForEntityNameBeforeStrategicPriority(projectName, projectDescription);
      state.pendingSuggestions = null;
      return false;
    }

    await enrichPendingSuggestionsWithStrategicPriority();
    sanitizePendingSuggestions();

    if (!Object.keys(state.pendingSuggestions.fields || {}).length) {
      state.pendingSuggestions = null;
      return false;
    }

    return true;
  }

  function getStrategicPriorityInputs() {
    const pendingFields = state.pendingSuggestions?.fields || {};
    const entityName = state.projectContext.entityName.trim();
    const projectName = String(pendingFields.project_name || state.form.project_name || "").trim();
    const projectDescription = String(pendingFields.project_description || state.form.project_description || "").trim();
    return {
      entityName,
      projectName,
      projectDescription,
      inputKey: [entityName, projectName, projectDescription].join("\n"),
    };
  }

  function buildStrategicPriorityFields(primary) {
    if (!primary) return {};
    const fields = {};
    const priority = primary["Strategic Priority"] || "";
    const classification = primary["Strategic Priority Classification"] || "";

    if (priority && normalizeFieldValue(state.form.strategic_priority) !== normalizeFieldValue(priority)) {
      fields.strategic_priority = priority;
    }
    if (
      classification &&
      normalizeFieldValue(state.form.strategic_priority_classification) !== normalizeFieldValue(classification)
    ) {
      fields.strategic_priority_classification = classification;
    }

    return fields;
  }

  function getRankOneStrategicSuggestion(suggestions) {
    if (!Array.isArray(suggestions) || !suggestions.length) return null;
    const rankOne = suggestions.find((item) => Number(item.Rank) === 1);
    if (rankOne) return rankOne;

    return [...suggestions].sort((a, b) => {
      const rankA = Number(a.Rank);
      const rankB = Number(b.Rank);
      if (Number.isFinite(rankA) && Number.isFinite(rankB) && rankA !== rankB) return rankA - rankB;
      if (Number.isFinite(rankA)) return -1;
      if (Number.isFinite(rankB)) return 1;
      return Number(b["Relevance Score"] || 0) - Number(a["Relevance Score"] || 0);
    })[0];
  }

  function scheduleStrategicPriorityClassification() {
    window.clearTimeout(strategicPriorityDebounceId);
    const { entityName, projectName, projectDescription, inputKey } = getStrategicPriorityInputs();
    if (!entityName || !projectName || !projectDescription || inputKey === state.strategicPriorityLastInputKey) return;

    strategicPriorityDebounceId = window.setTimeout(() => {
      runStandaloneStrategicPriorityClassification();
    }, 700);
  }

  async function runStandaloneStrategicPriorityClassification() {
    if (state.busy || !ensureApiKey()) return;

    const { entityName, projectName, projectDescription, inputKey } = getStrategicPriorityInputs();
    if (!entityName || !projectName || !projectDescription || inputKey === state.strategicPriorityLastInputKey) return;

    setBusy(true, "Budget Copilot is thinking", "Checking strategic priority and classification.");
    try {
      const suggestions = await runStrategicPriorityClassification({
        entityName,
        projectName,
        projectDescription,
      });
      const primary = getRankOneStrategicSuggestion(suggestions);
      const fields = buildStrategicPriorityFields(primary);
      state.strategicPriorityLastInputKey = inputKey;

      if (!Object.keys(fields).length) return;

      if (state.pendingSuggestions) {
        state.pendingSuggestions.fields = {
          ...(state.pendingSuggestions.fields || {}),
          ...fields,
        };
        state.pendingSuggestions.strategicPrioritySuggestions = suggestions.slice(0, 2);
        state.pendingSuggestions.strategicPrioritySource = "classifier";
        state.pendingSuggestions.strategicPriorityInputKey = inputKey;
        state.pendingSuggestions.strategicPriorityNote = primary?.Reason
          ? `${primary["Strategic Priority"]} / ${primary["Strategic Priority Classification"]}: ${primary.Reason}`
          : "";
        state.suggestionsVisible = false;
        return;
      }

      state.pendingSuggestions = {
        source: "strategic_priority",
        title: "Strategic priority suggestions",
        fields,
        budgetRows: [],
        evidence: "Suggested using the entity name, project name, and project description.",
        proof: null,
        missingInformation: [],
        reviewFlags: [],
        strategicPrioritySuggestions: suggestions.slice(0, 2),
        strategicPrioritySource: "classifier",
        strategicPriorityInputKey: inputKey,
        strategicPriorityNote: primary?.Reason
          ? `${primary["Strategic Priority"]} / ${primary["Strategic Priority Classification"]}: ${primary.Reason}`
          : "",
      };
      state.suggestionsVisible = false;
    } catch (error) {
      addAssistantMessage(formatCore42Error(error, "Strategic priority check failed."), { tone: "error" });
    } finally {
      setBusy(false);
      renderAll();
    }
  }

  function addSuggestionReviewFlag(flag) {
    if (!state.pendingSuggestions) return;
    const existing = state.pendingSuggestions.reviewFlags || [];
    if (!existing.some((item) => item.flag === flag.flag)) {
      state.pendingSuggestions.reviewFlags = [...existing, flag];
    }
  }

  function askForEntityNameBeforeStrategicPriority(projectName, projectDescription) {
    const promptKey = [projectName, projectDescription].join("\n");
    if (!promptKey.trim() || state.strategicPriorityEntityPromptKey === promptKey) return;

    state.strategicPriorityEntityPromptKey = promptKey;
    state.awaitingEntityName = true;
    addAssistantMessage(
      "To complete the strategic priority fields, I need the submitting entity name. Please add it in Settings, then I’ll include Strategic Priority and Strategic Priority Classification in the suggested fields."
    );
  }

  async function runStrategicPriorityClassification({ entityName, projectName, projectDescription }) {
    const prompt = await loadStrategicPriorityPrompt();
    const promptText = prompt
      .replace("{{ENTITY_NAME}}", entityName)
      .replace("{{PROJECT_NAME}}", projectName)
      .replace("{{PROJECT_DESCRIPTION}}", projectDescription);

    const rawText = await callResponsesWithText(
      `${promptText}\n\nReturn valid JSON only. Do not include markdown fences.`,
      "Strategic priority classification"
    );
    const parsed = parseJsonFromText(rawText);
    if (!Array.isArray(parsed)) {
      throw new Error("Strategic priority classification response was not valid JSON.");
    }
    return parsed;
  }

  async function loadStrategicPriorityPrompt() {
    if (state.strategicPriorityPromptText) return state.strategicPriorityPromptText;
    const response = await fetch(buildAssetUrl(STRATEGIC_PRIORITY_PROMPT_PATH));
    if (!response.ok) {
      throw new Error("Could not load the strategic priority classification prompt.");
    }
    state.strategicPriorityPromptText = await response.text();
    return state.strategicPriorityPromptText;
  }

  function buildBudgetRowsFromAnalysis(analysis) {
    const suggestions = analysis.account_code_suggestions || [];
    const rows = [];

    for (const suggestion of suggestions) {
      const mappedLine = findBudgetLineForSuggestion(analysis.budget_lines || [], suggestion);
      const amountDetails = getBudgetAmountDetails(suggestion, mappedLine);
      rows.push({
        account: suggestion.account_code || "Account code needs confirmation",
        classification: formatClassificationPath(suggestion.classification_path),
        amount: amountDetails.amount,
        displayAmount: amountDetails.displayAmount,
        note: mappedLine?.description || suggestion.reason || "",
      });
    }

    if (!rows.length && Array.isArray(analysis.budget_lines)) {
      for (const line of analysis.budget_lines.filter((item) => item.amount !== undefined).slice(0, 3)) {
        const amountDetails = getBudgetAmountDetails(null, line);
        rows.push({
          account: line.description || "Budget line",
          classification: "Account code not suggested",
          amount: amountDetails.amount,
          displayAmount: amountDetails.displayAmount,
          note: line.source_location || "",
        });
      }
    }

    return rows;
  }

  function findBudgetLineForSuggestion(lines, suggestion) {
    const mappedIds = suggestion.mapped_budget_line_ids || [];
    if (mappedIds.length) {
      const byId = lines.find((line) => mappedIds.includes(line.line_id));
      if (byId) return byId;
    }

    return findBudgetLine(lines, suggestion.mapped_budget_line_numbers || []);
  }

  function getBudgetAmountDetails(suggestion, line) {
    const amount =
      suggestion?.requested_budget ??
      suggestion?.indicative_requested_budget ??
      line?.amount ??
      line?.indicative_amount ??
      null;

    return {
      amount: typeof amount === "number" ? amount : null,
      displayAmount: formatBudgetAmountSummary({
        amount,
        currency: suggestion?.currency || line?.currency || "AED",
        requestedBudgetRange: suggestion?.requested_budget_range,
        amountRange: line?.amount_range,
        indicativeAmount: suggestion?.indicative_requested_budget ?? line?.indicative_amount,
        amountStatus: line?.amount_status || suggestion?.amount_source_type || "",
      }),
    };
  }

  function formatBudgetAmountSummary({
    amount,
    currency,
    requestedBudgetRange,
    amountRange,
    indicativeAmount,
    amountStatus,
  }) {
    const range = requestedBudgetRange || amountRange;
    if (range && (range.min != null || range.max != null)) {
      const min = range.min != null ? formatCurrencyAmount(range.min, currency) : "";
      const max = range.max != null ? formatCurrencyAmount(range.max, currency) : "";
      const rangeText = [min, max].filter(Boolean).join(" - ");
      if (indicativeAmount != null) {
        return `${rangeText} (indicative ${formatCurrencyAmount(indicativeAmount, currency)})`;
      }
      return rangeText;
    }

    if (amount != null) return formatCurrencyAmount(amount, currency);
    if (indicativeAmount != null) return `Indicative ${formatCurrencyAmount(indicativeAmount, currency)}`;
    if (/not found/i.test(String(amountStatus))) return "Requires confirmation";
    return "";
  }

  function buildEvidenceAssessmentMessage(analysis, fileName) {
    const evidence = analysis.evidence_assessment || {};
    const proof = evidence.proof_relevance_assessment || {};
    const score = evidence.evidence_score ?? null;
    const quality = evidence.evidence_quality || proof.proof_strength || "Unclear";
    const supportsProject = evidence.supports_project || "Unclear";
    const usable = proof.usable_as_budget_evidence || "Unclear";
    const summary = analysis.file_summary?.short_summary || analysis.file_summary?.detailed_summary || "";
    const notRandom = proof.why_not_random || evidence.reason || "";
    const budgetEvidence = buildKeyBudgetEvidence(analysis);
    const gaps = buildRemainingEvidenceGaps(analysis).slice(0, 3);

    const verdict = getEvidenceVerdict({ supportsProject, usable, quality, score });
    const parts = [`I analyzed **${fileName}**.`];

    if (summary) {
      parts.push("", `**Summary:** ${limitText(summary, 700)}`);
    }

    parts.push("", `**Evidence verdict:** ${verdict}`);

    if (notRandom) {
      parts.push("", `**Why it is usable:** ${limitText(notRandom, 550)}`);
    }

    if (budgetEvidence.length) {
      parts.push("", "**Key budget evidence:**", ...budgetEvidence.map((item) => `- ${item}`));
    }

    if (gaps.length) {
      parts.push("", "**Remaining gaps before final commitment:**", ...gaps.map((item) => `- ${item}`));
    }

    parts.push("", "Use **Suggest Project Fields** to review the extracted fields and budget lines.");
    return parts.join("\n");
  }

  function buildCumulativeAssessmentMessage(analysis) {
    const evidence = analysis.evidence_assessment || {};
    const summary = analysis.file_summary?.short_summary || analysis.file_summary?.detailed_summary || "";
    const quality = evidence.evidence_quality || "Unclear";
    const score = evidence.evidence_score;
    const readiness = analysis.ready_for_project_creation?.status || "Unclear";
    const overlaps = (analysis.duplicate_or_overlapping_evidence || [])
      .slice(0, 2)
      .map((item) => formatCumulativeEvidenceItem(item));
    const flags = (analysis.review_flags || [])
      .slice(0, 3)
      .map((flag) => formatReviewFlag(flag));
    const actions = (analysis.recommended_user_actions || []).slice(0, 3).map(formatEvidenceTextItem);

    const parts = ["I reviewed the uploaded documents together."];

    if (summary) {
      parts.push("", `**Summary:** ${limitText(summary, 700)}`);
    }

    parts.push(
      "",
      `**Overall evidence:** ${escapeMarkdownText(quality)}${score !== undefined && score !== null ? ` (${score})` : ""}`,
      `**Readiness:** ${escapeMarkdownText(readiness)}`
    );

    if (overlaps.length) {
      parts.push("", "**Document relationship:**", ...overlaps.map((item) => `- ${item}`));
    }

    if (flags.length) {
      parts.push("", "**Main review flags:**", ...flags.map((item) => `- ${item}`));
    }

    if (actions.length) {
      parts.push("", "**Recommended next steps:**", ...actions.map((item) => `- ${item}`));
    }

    parts.push("", "Use **Suggest Project Fields** to review the consolidated fields and budget lines.");
    return parts.join("\n");
  }

  function buildBudgetConsiderationMessage(result) {
    const overall = result.overall_assessment || {};
    const matches = Array.isArray(result.project_policy_assessment) ? result.project_policy_assessment : [];
    const summary = overall.Summary || "";
    const hasMatch = Boolean(overall["Has Policy Match"]) && matches.length > 0;

    if (!hasMatch) {
      return [
        "**DGE Budget Considerations:** No material policy match found.",
        summary ? `\n**Summary:** ${summary}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    const parts = ["**DGE Budget Considerations:** Policy matches found."];
    if (summary) {
      parts.push("", `**Summary:** ${summary}`);
    }

    parts.push("", "**Policy matches:**");
    for (const match of matches.slice(0, 6)) {
      const policyNumber = match["Policy Number"] ? `Policy ${match["Policy Number"]}: ` : "";
      const policyName = match["Policy Name"] || "Unnamed policy";
      const matchType = match["Match Type"] || "Review Required";
      const score = match["Relevance Score"];
      const requiredAction = match["Required Action"] || "Review with DGE policy owner.";
      const tone = getPolicyMatchTone(matchType);

      parts.push(
        `- **${tone} ${policyNumber}${policyName}** | Relevance Score: ${
          score !== undefined && score !== null ? score : "N/A"
        } | Required Action: ${requiredAction}`
      );
    }

    return parts.join("\n");
  }

  function buildBudgetConsiderationHtml(result) {
    const overall = result.overall_assessment || {};
    const matches = Array.isArray(result.project_policy_assessment) ? result.project_policy_assessment : [];
    const summary = overall.Summary || "";
    const hasMatch = Boolean(overall["Has Policy Match"]) && matches.length > 0;

    if (!hasMatch) {
      return `
        <div class="policy-card">
          <div class="policy-card__header">
            <strong>DGE Budget Considerations</strong>
            <span class="policy-chip policy-chip--info">Informational</span>
          </div>
          <p>No material DGE budget consideration match found.</p>
          ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
        </div>
      `;
    }

    const rows = matches
      .slice(0, 6)
      .map((match) => {
        const matchType = match["Match Type"] || "Review Required";
        const policyClass = getPolicyMatchClass(matchType);
        const policyNumber = match["Policy Number"] ? `Policy ${match["Policy Number"]}: ` : "";
        const score = match["Relevance Score"];
        return `
          <div class="policy-match ${policyClass}">
            <div class="policy-match__top">
              <strong>${escapeHtml(policyNumber + (match["Policy Name"] || "Unnamed policy"))}</strong>
              <span class="policy-chip ${policyClass === "policy-match--conflict" ? "policy-chip--conflict" : "policy-chip--info"}">${escapeHtml(matchType)}</span>
            </div>
            <p>Relevance Score: ${escapeHtml(score !== undefined && score !== null ? score : "N/A")}</p>
            <p><b>Required Action:</b> ${escapeHtml(match["Required Action"] || "Review with DGE policy owner.")}</p>
          </div>
        `;
      })
      .join("");

    return `
      <div class="policy-card">
        <div class="policy-card__header">
          <strong>DGE Budget Considerations</strong>
          <span class="policy-chip policy-chip--info">Advisory only</span>
        </div>
        <p>This check does not block project creation. It flags policies for review and coordination.</p>
        ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
        <div class="policy-match-list">${rows}</div>
      </div>
    `;
  }

  function getPolicyMatchTone(matchType) {
    const normalized = String(matchType || "").toLowerCase();
    if (normalized.includes("potential conflict")) return "Potential Conflict:";
    if (normalized.includes("coordination")) return "Coordination Required:";
    if (normalized.includes("allowed")) return "Allowed With Conditions:";
    return "Review:";
  }

  function getPolicyMatchClass(matchType) {
    return String(matchType || "").toLowerCase().includes("potential conflict")
      ? "policy-match--conflict"
      : "policy-match--info";
  }

  function formatCumulativeEvidenceItem(item) {
    if (!item || typeof item !== "object") return formatEvidenceTextItem(item);
    const topic = item.topic ? `${item.topic}: ` : "";
    return `${topic}${item.effect_on_analysis || item.assessment || ""}`.trim();
  }

  function escapeMarkdownText(value) {
    return String(value || "").replace(/\*/g, "\\*");
  }

  function buildKeyBudgetEvidence(analysis) {
    const evidence = analysis.evidence_assessment || {};
    const proof = evidence.proof_relevance_assessment || {};
    const anchors = Array.isArray(proof.budget_anchors) ? proof.budget_anchors : [];
    const budgetLines = Array.isArray(analysis.budget_lines) ? analysis.budget_lines : [];
    const output = [];

    const totalAnchor =
      anchors.find((anchor) => /total/i.test(String(anchor.anchor_type || ""))) ||
      anchors.find((anchor) => /total/i.test(String(anchor.value || "")));
    const totalLine = budgetLines.find((line) => /total/i.test(String(line.description || "")) && line.amount != null);

    if (totalLine) {
      output.push(`${totalLine.description}: ${formatCurrencyAmount(totalLine.amount, totalLine.currency)}`);
    } else if (totalAnchor) {
      const label = totalAnchor.anchor_type && !/total/i.test(totalAnchor.anchor_type) ? totalAnchor.anchor_type : "Total";
      output.push(`${label}: ${formatBudgetAnchorValue(totalAnchor)}`);
    }

    const components = summarizeBudgetComponents(anchors, budgetLines);
    if (components) {
      output.push(`Includes ${components}`);
    }

    if (!output.length) {
      for (const line of budgetLines.filter((item) => item.amount != null).slice(0, 3)) {
        output.push(`${line.description || "Budget line"}: ${formatCurrencyAmount(line.amount, line.currency)}`);
      }
    }

    return uniqueStrings(output).slice(0, 3);
  }

  function summarizeBudgetComponents(anchors, budgetLines) {
    const componentNames = [];
    for (const anchor of anchors) {
      if (!/line item/i.test(String(anchor.anchor_type || ""))) continue;
      const name = extractBudgetComponentName(anchor.value);
      if (name) componentNames.push(name);
    }

    if (!componentNames.length) {
      for (const line of budgetLines || []) {
        if (line.amount == null || /total/i.test(String(line.description || ""))) continue;
        const name = extractBudgetComponentName(line.description);
        if (name) componentNames.push(name);
      }
    }

    const uniqueComponents = uniqueStrings(componentNames).slice(0, 5);
    return joinListWithAnd(uniqueComponents);
  }

  function extractBudgetComponentName(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^(?:AED\s*)?[\d,]+(?:\.\d+)?(?:\s*AED)?$/i.test(text)) return "";
    return text
      .split(/\s+-\s+/)[0]
      .replace(/\s+\(?AED\s*[\d,.\s]+.*$/i, "")
      .replace(/\s+[\d,]+(?:\.\d+)?\s*$/i, "")
      .trim();
  }

  function buildRemainingEvidenceGaps(analysis) {
    const evidence = analysis.evidence_assessment || {};
    const proof = evidence.proof_relevance_assessment || {};
    const reviewFlags = Array.isArray(analysis.review_flags)
      ? analysis.review_flags.map((flag) => formatReviewFlag(flag))
      : [];
    const conflicts = (evidence.contradictions_or_conflicts || []).map((item) => formatEvidenceTextItem(item));
    const gaps = [
      ...(proof.weaknesses || []).map((item) => formatEvidenceTextItem(item)),
      ...conflicts,
      ...reviewFlags,
      ...(evidence.missing_information || []).map((item) => formatEvidenceTextItem(item)),
    ];

    return uniqueStrings(gaps).filter(Boolean);
  }

  function formatReviewFlag(flag) {
    if (!flag || typeof flag !== "object") return formatEvidenceTextItem(flag);
    if (flag.flag && flag.reason) return `${flag.flag}: ${flag.reason}`;
    return flag.reason || flag.flag || formatEvidenceTextItem(flag);
  }

  function formatEvidenceTextItem(item) {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    if (typeof item === "object") {
      return String(item.reason || item.flag || item.value || item.description || "").trim();
    }
    return String(item).trim();
  }

  function formatBudgetAnchorValue(anchor) {
    const value = anchor?.value;
    const currency = anchor?.currency;
    if (typeof value === "number") return formatCurrencyAmount(value, currency);

    const text = String(value || "").trim();
    if (!text) return "Amount not specified";
    if (!currency || new RegExp(`\\b${escapeRegExp(currency)}\\b`, "i").test(text)) return text;
    return `${currency} ${text}`;
  }

  function formatCurrencyAmount(amount, currency) {
    const numericAmount = Number(amount);
    const formattedAmount = Number.isFinite(numericAmount)
      ? numericAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : String(amount || "").trim();
    return [currency, formattedAmount].filter(Boolean).join(" ") || "Amount not specified";
  }

  function joinListWithAnd(items) {
    const list = (items || []).filter(Boolean);
    if (!list.length) return "";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
  }

  function limitText(text, maxLength) {
    const value = String(text || "").trim();
    if (!value || value.length <= maxLength) return value;
    const truncated = value.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
    return `${truncated}...`;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeEvidenceScore(value) {
    const score = Number(value);
    if (!Number.isFinite(score)) return null;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function getEvidenceVerdict({ supportsProject, usable, quality, score }) {
    const numericScore = Number(score);
    const strongEnough =
      /yes/i.test(String(supportsProject)) &&
      /yes/i.test(String(usable)) &&
      (/strong/i.test(String(quality)) || numericScore >= 80);
    const partial =
      /partial|unclear/i.test(String(supportsProject)) ||
      /partial|unclear/i.test(String(usable)) ||
      (/moderate/i.test(String(quality)) && numericScore >= 50);

    if (strongEnough) return "Strong evidence for project creation and initial budgeting.";
    if (partial) return "Partially useful evidence for drafting; review the gaps before submission.";
    return "Weak evidence for submission. Use it as context only and upload stronger supporting documentation.";
  }

  function uniqueStrings(items) {
    const seen = new Set();
    const output = [];
    for (const item of items || []) {
      const text = String(item || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      output.push(text);
    }
    return output;
  }

  function findBudgetLine(lines, numbers) {
    const firstNumber = numbers[0];
    return lines.find((line) => line.line_number === firstNumber) || null;
  }

  function formatClassificationPath(path) {
    if (!path) return "Not classified";
    return [path.l1, path.l2, path.l3].filter(Boolean).join(" / ") || "Not classified";
  }

  function applyPendingSuggestions() {
    if (!state.pendingSuggestions) return;
    sanitizePendingSuggestions();

    for (const [key, value] of Object.entries(state.pendingSuggestions.fields || {})) {
      if (!(key in state.form)) continue;
      state.form[key] = Array.isArray(value) ? value.join(", ") : String(value ?? "");
    }

    if (state.pendingSuggestions.budgetRows?.length) {
      state.budgetRows = state.pendingSuggestions.budgetRows;
    }

    state.appliedSuggestions.push({
      appliedAt: new Date().toISOString(),
      source: state.pendingSuggestions.source,
      title: state.pendingSuggestions.title,
      fields: state.pendingSuggestions.fields || {},
      budgetRows: state.pendingSuggestions.budgetRows || [],
    });

    state.pendingSuggestions = null;
    state.suggestionsVisible = false;
    syncFormInputs(true);
    renderAll();
    showToast("Suggestions applied to the form.");
    scheduleStrategicPriorityClassification();
  }

  function syncFormInputs(markSuggested = false) {
    elements.formFields.forEach((field) => {
      const key = field.dataset.field;
      if (!(key in state.form)) return;
      ensureSelectOption(field, state.form[key]);
      field.value = state.form[key] || "";
      if (markSuggested && field.value) {
        field.classList.add("is-suggested");
      } else if (!markSuggested) {
        field.classList.remove("is-suggested");
      }
    });
  }

  function ensureSelectOption(field, value) {
    if (!value || field.tagName !== "SELECT") return;
    const exists = Array.from(field.options).some((option) => option.value === value || option.textContent === value);
    if (!exists) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      field.appendChild(option);
    }
  }

  function renderAll() {
    updateSuggestionButtonState();
    updateBudgetConsiderationButtonState();
    renderChat();
    renderDocuments();
    renderBudgetRows();
    renderModelLogs();
  }

  function updateSuggestionButtonState() {
    if (!elements.suggestProjectFieldsButton) return;
    sanitizePendingSuggestions();
    const count = getEvaluatedProjectFieldCount();
    elements.suggestProjectFieldsButton.disabled = state.busy || count === 0;
    elements.suggestProjectFieldsButton.textContent = count > 0 ? `Suggest Project Fields (${count})` : "Suggest Project Fields";
  }

  function updateBudgetConsiderationButtonState() {
    if (!elements.checkBudgetConsiderationsButton) return;
    const inputs = getBudgetConsiderationInputs();
    const ready = Boolean(inputs.entityName && inputs.projectName && inputs.projectDescription);
    elements.checkBudgetConsiderationsButton.disabled = state.busy || !ready;
  }

  function getEvaluatedProjectFieldCount() {
    return Object.keys(state.pendingSuggestions?.fields || {}).length + (state.pendingSuggestions?.budgetRows || []).length;
  }

  function showEvaluatedProjectFields() {
    if (!getEvaluatedProjectFieldCount()) return;
    state.suggestionsVisible = true;
    renderChat();
  }

  function renderChat() {
    const hasPendingAssistantBubble =
      state.busy &&
      state.messages.length > 0 &&
      state.messages[state.messages.length - 1].role === "assistant" &&
      !state.messages[state.messages.length - 1].content &&
      state.messages[state.messages.length - 1].tone !== "error";
    const messagesHtml = state.messages
      .map((message) => {
        const toneClass = ["error", "system", "policy"].includes(message.tone) ? ` ${message.tone}` : "";
        return `<div class="message ${escapeHtml(message.role)}${toneClass}">${renderMessageContent(message)}</div>`;
      })
      .join("");
    elements.chatLog.innerHTML =
      messagesHtml + renderSuggestionCard() + (state.busy && !hasPendingAssistantBubble ? renderChatLoader() : "");
    bindSuggestionActions();
    elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  }

  function renderMessageContent(message) {
    if (message.role === "assistant" && !message.content && state.busy) {
      return renderChatLoaderContent();
    }
    if (message.role === "assistant" && message.html) {
      return message.html;
    }
    if (message.role === "assistant" && !message.tone) {
      return renderBasicMarkdown(message.content);
    }
    if (message.role === "assistant" && ["normal", "policy"].includes(message.tone)) {
      return renderBasicMarkdown(message.content);
    }
    return escapeHtml(message.content);
  }

  function renderChatLoader() {
    return `<div class="message assistant loading-message">${renderChatLoaderContent()}</div>`;
  }

  function renderChatLoaderContent() {
    const title = escapeHtml(state.activity.title || "Working");
    const detail = escapeHtml(state.activity.detail || "Please wait before sending another message.");
    return `
      <div class="chat-loader" role="status" aria-live="polite">
        <span class="chat-loader-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="chat-loader-copy">
          <strong>${title}</strong>
          <small>${detail}</small>
        </span>
      </div>
    `;
  }

  function renderBasicMarkdown(value) {
    const lines = escapeHtml(value).replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let activeList = "";
    let openOrderedItem = false;
    let nestedBulletListOpen = false;

    const closeNestedBulletList = () => {
      if (nestedBulletListOpen) {
        html.push("</ul>");
        nestedBulletListOpen = false;
      }
    };

    const closeOpenOrderedItem = () => {
      if (openOrderedItem) {
        closeNestedBulletList();
        html.push("</li>");
        openOrderedItem = false;
      }
    };

    const closeList = () => {
      if (activeList === "ol") {
        closeOpenOrderedItem();
        html.push("</ol>");
      } else if (activeList === "ul") {
        html.push("</ul>");
      }
      activeList = "";
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      const numbered = line.match(/^\d+\.\s+(.+)$/);
      const quote = line.match(/^&gt;\s*(.+)$/);

      if (bullet) {
        if (activeList === "ol" && openOrderedItem) {
          if (!nestedBulletListOpen) {
            html.push("<ul>");
            nestedBulletListOpen = true;
          }
          html.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
          continue;
        }

        if (activeList !== "ul") {
          closeList();
          html.push("<ul>");
          activeList = "ul";
        }
        html.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`);
        continue;
      }

      if (numbered) {
        if (activeList !== "ol") {
          closeList();
          html.push("<ol>");
          activeList = "ol";
        } else {
          closeOpenOrderedItem();
        }
        html.push(`<li>${renderInlineMarkdown(numbered[1])}`);
        openOrderedItem = true;
        continue;
      }

      closeList();
      if (quote) {
        html.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
      } else {
        html.push(`<p>${renderInlineMarkdown(line)}</p>`);
      }
    }

    closeList();
    return html.join("");
  }

  function renderInlineMarkdown(value) {
    return String(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function renderSuggestionCard() {
    if (state.pendingSuggestions) {
      sanitizePendingSuggestions();
    }

    const suggestion = state.pendingSuggestions;
    if (!suggestion || !state.suggestionsVisible) {
      return "";
    }

    const renderedKeys = new Set();
    const fields = suggestion.fields || {};
    const fieldSections = [
      renderSuggestionFieldSection("Core fields", ["project_name", "project_description"], fields, renderedKeys),
      renderSuggestionFieldSection(
        "Classification",
        ["category", "budget_item_type", "budget_item_classification", "work_stream"],
        fields,
        renderedKeys
      ),
      renderSuggestionFieldSection("Technology", ["technology_company", "technology_products"], fields, renderedKeys),
      renderSuggestionFieldSection(
        "Strategic alignment",
        ["strategic_priority", "strategic_priority_classification"],
        fields,
        renderedKeys
      ),
      renderSuggestionFieldSection("Timeline", ["planned_start_date", "planned_end_date"], fields, renderedKeys),
      renderSuggestionFieldSection(
        "Additional fields",
        Object.keys(fields).filter((key) => !renderedKeys.has(key)),
        fields,
        renderedKeys
      ),
    ]
      .filter(Boolean)
      .join("");

    const budgetSection = renderSuggestionBudgetSection(suggestion.budgetRows || []);
    const emptyState =
      !fieldSections && !budgetSection
        ? '<div class="suggestion-empty">No mappable field suggestions were returned.</div>'
        : "";
    const sourceName = getSuggestionSourceName(suggestion);

    return `
      <div class="message assistant suggestion-message">
        <div class="suggestion-tray">
          <div class="suggestion-header">
            <div>
              <h3>Suggested Project Fields</h3>
              ${sourceName ? `<p>From: ${escapeHtml(sourceName)}</p>` : ""}
            </div>
          </div>
          ${fieldSections}
          ${budgetSection}
          ${emptyState}
          <div class="suggestion-actions">
            <button id="applySuggestionsButton" class="primary-button small" type="button">Apply Suggested Fields</button>
            ${
              suggestion.rawModelResponse
                ? '<button id="viewModelResponseButton" class="outline-button small" type="button">View Model Response</button>'
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  function renderSuggestionFieldSection(title, keys, fields, renderedKeys) {
    const rows = keys
      .filter((key) => hasSuggestionField(fields, key))
      .map((key) => {
        renderedKeys.add(key);
        return `
          <div class="suggestion-row">
            <strong>${escapeHtml(labelForField(key))}</strong>
            <span>${escapeHtml(formatSuggestionValue(fields[key]))}</span>
          </div>
        `;
      })
      .join("");

    if (!rows) return "";
    return `
      <section class="suggestion-section">
        <h4>${escapeHtml(title)}</h4>
        <div class="suggestion-list">${rows}</div>
      </section>
    `;
  }

  function renderSuggestionBudgetSection(rows) {
    if (!Array.isArray(rows) || !rows.length) return "";

    const budgetRows = rows
      .slice(0, 6)
      .map(
        (row) => `
          <div class="suggestion-budget-row">
            <div>
              <strong>${escapeHtml(row.account || "Budget item")}</strong>
              ${row.classification ? `<span>${escapeHtml(row.classification)}</span>` : ""}
              ${row.note ? `<small>${escapeHtml(row.note)}</small>` : ""}
            </div>
            <b>${escapeHtml(row.displayAmount || formatMoney(row.amount))}</b>
          </div>
        `
      )
      .join("");

    return `
      <section class="suggestion-section">
        <h4>Budget items</h4>
        <div class="suggestion-budget-list">${budgetRows}</div>
      </section>
    `;
  }

  function getSuggestionSourceName(suggestion) {
    const title = String(suggestion?.title || "").trim();
    if (/^suggestions from\s+/i.test(title)) return title.replace(/^suggestions from\s+/i, "");
    if (/conversation/i.test(title) || suggestion?.source === "chat") return "Conversation draft";
    if (suggestion?.source === "strategic_priority") return "Strategic priority classifier";
    return title;
  }

  function hasSuggestionField(fields, key) {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) return false;
    const value = fields[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function formatSuggestionValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    if (value && typeof value === "object") return JSON.stringify(value);
    return String(value ?? "");
  }

  function bindSuggestionActions() {
    const applyButton = document.getElementById("applySuggestionsButton");
    if (applyButton) {
      applyButton.addEventListener("click", applyPendingSuggestions);
    }

    const viewButton = document.getElementById("viewModelResponseButton");
    if (viewButton) {
      viewButton.addEventListener("click", () =>
        openTextInNewTab(`${state.pendingSuggestions.title} - model response`, state.pendingSuggestions.rawModelResponse)
      );
    }
  }

  function renderDocuments() {
    if (!state.documents.length) {
      elements.documentsList.innerHTML = `<div class="document-item"><div><strong>No documents uploaded</strong><span>Upload evidence to improve proof quality and field suggestions.</span></div></div>`;
      return;
    }

    elements.documentsList.innerHTML = state.documents
      .map((document) => {
        const statusClass =
          document.status === "Analyzed" ? "done" : document.status === "Error" ? "error" : "";
        const evidenceHtml = renderDocumentEvidenceScore(document);
        return `
          <div class="document-item">
            <div class="document-main">
              <strong>${escapeHtml(document.name)}</strong>
              <span>${formatBytes(document.size)}${document.error ? ` · ${escapeHtml(document.error)}` : ""}</span>
              ${evidenceHtml}
            </div>
            <div class="document-actions">
              ${
                document.rawModelResponse
                  ? `<button class="text-button view-response-button" type="button" data-doc-id="${escapeHtml(document.id)}">View Response</button>`
                  : ""
              }
              <div class="doc-status ${statusClass}">${escapeHtml(document.status)}</div>
            </div>
          </div>
        `;
      })
      .join("");

    elements.documentsList.querySelectorAll(".view-response-button").forEach((button) => {
      button.addEventListener("click", () => {
        const document = state.documents.find((item) => item.id === button.dataset.docId);
        if (!document?.rawModelResponse) return;
        openTextInNewTab(`${document.name} - model response`, document.rawModelResponse);
      });
    });
  }

  function renderDocumentEvidenceScore(document) {
    if (document.status !== "Analyzed" || document.evidenceScore === null || document.evidenceScore === undefined) {
      return "";
    }

    const score = Math.max(0, Math.min(100, Number(document.evidenceScore)));
    const tone = score < 50 ? "low" : score > 80 ? "high" : "medium";
    const quality = document.evidenceQuality || "Evidence";
    const supports = document.supportsProject ? ` | Supports project: ${document.supportsProject}` : "";
    const usable = document.usableAsEvidence ? ` | Budget evidence: ${document.usableAsEvidence}` : "";

    return `
      <div class="document-evidence ${tone}" title="${escapeHtml(`${quality}${supports}${usable}`)}">
        <div class="document-evidence__meta">
          <span>${escapeHtml(quality)}</span>
          <strong>${score}/100</strong>
        </div>
        <div class="document-evidence__bar" aria-label="Evidence score ${score} out of 100">
          <span style="width:${score}%"></span>
        </div>
      </div>
    `;
  }

  function openTextInNewTab(title, text) {
    const blob = new Blob([`${title}\n\n${text}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, "_blank", "noopener,noreferrer");
    if (!tab) {
      showToast("Popup blocked. Allow popups for this local page to view the response.");
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function renderBudgetRows() {
    if (!state.budgetRows.length) {
      elements.budgetRows.innerHTML = `<tr><td colspan="3" class="empty-row">No budget items added</td></tr>`;
      elements.totalBudget.textContent = "AED 0";
      return;
    }

    let total = 0;
    elements.budgetRows.innerHTML = state.budgetRows
      .map((row) => {
        if (typeof row.amount === "number") total += row.amount;
        return `
          <tr>
            <td><strong>${escapeHtml(row.account)}</strong><br><span>${escapeHtml(row.note || "")}</span></td>
            <td>${escapeHtml(row.classification)}</td>
            <td>${escapeHtml(row.displayAmount || formatMoney(row.amount))}</td>
          </tr>
        `;
      })
      .join("");
    elements.totalBudget.textContent = formatMoney(total);
  }

  function labelForField(key) {
    const labels = {
      project_name: "Initiative / Budget Item Name",
      project_description: "Summary / Description",
      strategic_priority: "Strategic Priorities",
      strategic_priority_classification: "Strategic Priority Classifications",
      category: "Category",
      technology_company: "Technology (Company)",
      technology_products: "Technology (Product)",
      budget_item_type: "ICT Budget Items Type",
      budget_item_classification: "Budget Type",
      planned_start_date: "Planned Start Date",
      planned_end_date: "Planned End Date",
      work_stream: "Work Stream / Program Name",
    };
    return labels[key] || key;
  }

  function createModelLog({ purpose, endpoint, request }) {
    const log = {
      id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toLocaleTimeString(),
      provider: getActiveProviderLabel(),
      model: getActiveModel(),
      purpose,
      endpoint,
      status: "Pending",
      request: sanitizeModelLogPayload(request),
      response: null,
      error: "",
    };

    state.modelLogs.unshift(log);
    state.modelLogs = state.modelLogs.slice(0, 40);
    renderModelLogs();
    return log.id;
  }

  function finishModelLog(id, updates = {}) {
    const log = state.modelLogs.find((item) => item.id === id);
    if (!log) return;
    if (updates.status) log.status = updates.status;
    if (updates.response !== undefined) log.response = sanitizeModelLogPayload(updates.response);
    if (updates.error) {
      log.status = "Error";
      log.error = String(updates.error);
    }
    log.completedAt = new Date().toLocaleTimeString();
    renderModelLogs();
  }

  function sanitizeModelLogPayload(value) {
    if (Array.isArray(value)) return value.map(sanitizeModelLogPayload);
    if (!value || typeof value !== "object") {
      return sanitizeModelLogScalar(value);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        const lowerKey = key.toLowerCase();
        if (["api-key", "authorization", "apikey", "api_key"].includes(lowerKey)) {
          return [key, "[redacted]"];
        }
        if (["file_data", "image_url"].includes(lowerKey) && typeof item === "string") {
          return [key, summarizeDataUrl(item)];
        }
        return [key, sanitizeModelLogPayload(item)];
      })
    );
  }

  function sanitizeModelLogScalar(value) {
    if (typeof value !== "string") return value;
    if (/^data:[^;]+;base64,/i.test(value)) return summarizeDataUrl(value);
    const maxLength = 80000;
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength)}\n...[truncated ${value.length - maxLength} characters]`;
  }

  function summarizeDataUrl(value) {
    const match = String(value).match(/^data:([^;]+);base64,(.*)$/i);
    if (!match) return "[binary content redacted]";
    const approximateBytes = Math.floor((match[2].length * 3) / 4);
    return `[${match[1]} data URL redacted, approximately ${formatBytes(approximateBytes)}]`;
  }

  function renderModelLogs() {
    if (!elements.modelLogList) return;
    if (!state.modelLogs.length) {
      elements.modelLogList.innerHTML = `<div class="model-log-empty">No model calls yet.</div>`;
      return;
    }

    elements.modelLogList.innerHTML = state.modelLogs
      .map((log) => {
        const statusClass = log.status === "Error" ? "error" : log.status === "Completed" ? "done" : "";
        return `
          <details class="model-log-item">
            <summary>
              <span class="model-log-title">
                <strong>${escapeHtml(log.purpose)}</strong>
                <small>${escapeHtml(log.provider)} | ${escapeHtml(log.model)} | ${escapeHtml(log.createdAt)}</small>
              </span>
              <span class="model-log-status ${statusClass}">${escapeHtml(log.status)}</span>
            </summary>
            <div class="model-log-body">
              <div class="model-log-endpoint">${escapeHtml(log.endpoint)}</div>
              <strong>Request</strong>
              <pre>${escapeHtml(JSON.stringify(log.request, null, 2))}</pre>
              ${
                log.response
                  ? `<strong>Response</strong><pre>${escapeHtml(JSON.stringify(log.response, null, 2))}</pre>`
                  : ""
              }
              ${log.error ? `<strong>Error</strong><pre>${escapeHtml(log.error)}</pre>` : ""}
            </div>
          </details>
        `;
      })
      .join("");
  }

  function aiHeaders() {
    return {
      "Content-Type": "application/json",
      "api-key": getActiveProviderConfig().apiKey,
    };
  }

  async function buildHttpError(response) {
    let text = "";
    try {
      text = await response.text();
    } catch {
      text = "";
    }
    return new Error(`HTTP ${response.status}: ${text || response.statusText}`);
  }

  function formatCore42Error(error, fallback) {
    const message = error?.message || String(error || fallback);
    if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
      const proxyUrl = getProxyBaseUrl();
      const proxyHint =
        window.location.protocol === "file:"
          ? ` Then open ${proxyUrl}/budget-copilot.html instead of opening the HTML file directly.`
          : "";
      return `${fallback} Local AI proxy is unreachable at ${proxyUrl}. Start it with: node scripts/budget-copilot-proxy.js.${proxyHint}`;
    }
    return `${fallback} ${message}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatMoney(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return "Requires confirmation";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
