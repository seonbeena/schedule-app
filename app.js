const startHour = 6;
const endHour = 26;
const slotMinutes = 30;
const supabaseConfig = {
  restUrl: "https://izlnkgamnpyosdhyeofl.supabase.co/rest/v1",
  publishableKey: "sb_publishable_9eS6u8IqBVU1YA7hVesrhg_jFJ_eMxJ",
  functionUrl: "https://izlnkgamnpyosdhyeofl.supabase.co/functions/v1/dayplan-ics"
};
const syncIdentityKey = "dayplan-sync-identity-v1";
const calendarSyncMetaKey = "dayplan-calendar-sync-meta-v1";

const storageKey = "dayplan-mobile-clean-v5";
const legacyKeys = [
  "dayplan-mobile-refactor-v1",
  "date-schedule-app-v5",
  "date-schedule-app-v4",
  "date-schedule-app-v3"
];

const els = {
  sectionToggles: document.querySelectorAll("[data-toggle]"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  settingsBackdrop: document.getElementById("settingsBackdrop"),
  settingsCloseBtn: document.getElementById("settingsCloseBtn"),
  calendarSyncBtn: document.getElementById("calendarSyncBtn"),
  copyCalendarUrlBtn: document.getElementById("copyCalendarUrlBtn"),
  calendarSyncMeta: document.getElementById("calendarSyncMeta"),
  copyBackupCodeBtn: document.getElementById("copyBackupCodeBtn"),
  importBackupCodeBtn: document.getElementById("importBackupCodeBtn"),
  newCategoryName: document.getElementById("newCategoryName"),
  newCategoryColor: document.getElementById("newCategoryColor"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  categoryList: document.getElementById("categoryList"),
  searchInput: document.getElementById("searchInput"),
  searchResults: document.getElementById("searchResults"),

  dateTitle: document.getElementById("dateTitle"),
  todayBtn: document.getElementById("todayBtn"),
  prevDateBtn: document.getElementById("prevDateBtn"),
  nextDateBtn: document.getElementById("nextDateBtn"),
  datePicker: document.getElementById("datePicker"),
  datePickerLabel: document.getElementById("datePickerLabel"),
  dayViewBtn: document.getElementById("dayViewBtn"),
  weekViewBtn: document.getElementById("weekViewBtn"),
  monthViewBtn: document.getElementById("monthViewBtn"),
  typeFilter: document.getElementById("typeFilter"),
  eventCount: document.getElementById("eventCount"),
  schedule: document.getElementById("schedule"),
  summaryCard: document.getElementById("summaryCard"),
  summaryToggle: document.getElementById("summaryToggle"),
  summaryCount: document.getElementById("summaryCount"),
  summaryPreview: document.getElementById("summaryPreview"),
  summaryDetail: document.getElementById("summaryDetail"),

  floatingAddBtn: document.getElementById("floatingAddBtn"),
  eventModal: document.getElementById("eventModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeEventModalBtn: document.getElementById("closeEventModalBtn"),
  eventModalTitle: document.getElementById("eventModalTitle"),
  eventDate: document.getElementById("eventDate"),
  eventDateLabel: document.getElementById("eventDateLabel"),
  title: document.getElementById("title"),
  categorySelect: document.getElementById("categorySelect"),
  memo: document.getElementById("memo"),
  isUnscheduled: document.getElementById("isUnscheduled"),
  timeFields: document.getElementById("timeFields"),
  start: document.getElementById("start"),
  end: document.getElementById("end"),
  startHour: document.getElementById("startHour"),
  startMinute: document.getElementById("startMinute"),
  endHour: document.getElementById("endHour"),
  endMinute: document.getElementById("endMinute"),
  repeat: document.getElementById("repeat"),
  eventButtonRow: document.getElementById("eventButtonRow"),
  saveEventBtn: document.getElementById("saveEventBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  deleteEditingBtn: document.getElementById("deleteEditingBtn")
};

let appData = loadAppData();
let selectedDate = getTodayString();
let viewMode = "day";
let editingEventId = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTodayString() {
  return formatDate(new Date());
}

function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function addDays(dateString, amount) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + amount);
  return formatDate(date);
}

function minutesToTime(minutes) {
  const normalized = minutes % (24 * 60);
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
}

function getKoreanDateLabel(dateString, short = false) {
  const date = parseDate(dateString);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  if (short) return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

function getWeekDates(dateString) {
  const date = parseDate(dateString);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(monday);
    next.setDate(monday.getDate() + index);
    return formatDate(next);
  });
}

function getMonthDates(dateString) {
  const base = parseDate(dateString);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return formatDate(date);
  });
}

function normalizeData(raw) {
  return {
    categories: Array.isArray(raw?.categories) ? raw.categories : [],
    events: Array.isArray(raw?.events) ? raw.events : []
  };
}

function normalizeData(raw) {
  return {
    categories: Array.isArray(raw?.categories) ? raw.categories : [],
    events: Array.isArray(raw?.events) ? raw.events : []
  };
}

function loadAppData() {
  const keys = [storageKey, ...legacyKeys];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = normalizeData(JSON.parse(raw));
      if (data.categories.length || data.events.length || key === storageKey) {
        return data;
      }
    } catch {}
  }

  return { categories: [], events: [] };
}

function normalizeCategorySyncFlags() {
  appData.categories = appData.categories.map(category => ({
    ...category,
    syncToCalendar: category.syncToCalendar !== false,
    showInMonth: category.showInMonth !== false
  }));
}

function normalizeCategoryVisibilityFlags() {
  normalizeCategorySyncFlags();
}

function saveAppData() {
  localStorage.setItem(storageKey, JSON.stringify(appData));
}

function getCategory(categoryId) {
  return appData.categories.find(category => category.id === categoryId) || {
    id: "none",
    name: "종류 없음",
    color: "#cbd5e1"
  };
}

function getRepeatLabel(value) {
  return {
    none: "반복 없음",
    daily: "매일 반복",
    weekly: "매주 반복",
    weekdays: "평일 반복"
  }[value] || "반복 없음";
}

function createTimeOptions() {
  const hourSelects = [els.startHour, els.endHour].filter(Boolean);
  const minuteSelects = [els.startMinute, els.endMinute].filter(Boolean);

  hourSelects.forEach(select => {
    select.innerHTML = "";
    for (let hour = startHour; hour <= endHour; hour += 1) {
      const displayHour = hour % 24;
      select.add(new Option(`${pad(displayHour)}시`, String(hour)));
    }
  });

  minuteSelects.forEach(select => {
    select.innerHTML = "";
    for (let minute = 0; minute < 60; minute += 10) {
      select.add(new Option(`${pad(minute)}분`, String(minute)));
    }
  });

  setTimeFields("start", 9 * 60);
  setTimeFields("end", 10 * 60);
}

function setTimeFields(prefix, minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hourSelect = prefix === "start" ? els.startHour : els.endHour;
  const minuteSelect = prefix === "start" ? els.startMinute : els.endMinute;

  if (hourSelect) hourSelect.value = String(hour);
  if (minuteSelect) minuteSelect.value = String(minute);
}

function getTimeFields(prefix) {
  const hourSelect = prefix === "start" ? els.startHour : els.endHour;
  const minuteSelect = prefix === "start" ? els.startMinute : els.endMinute;

  return Number(hourSelect.value) * 60 + Number(minuteSelect.value);
}

function shouldShowEventOnDate(event, dateString) {
  if (!event.repeat || event.repeat === "none") return event.date === dateString;
  if (dateString < event.date) return false;

  const target = parseDate(dateString);
  const origin = parseDate(event.date);

  if (event.repeat === "daily") return true;
  if (event.repeat === "weekly") return target.getDay() === origin.getDay();
  if (event.repeat === "weekdays") {
    const day = target.getDay();
    return day >= 1 && day <= 5;
  }

  return false;
}

function getEventsForDate(dateString) {
  return appData.events
    .filter(event => shouldShowEventOnDate(event, dateString))
    .sort((a, b) => a.start - b.start);
}


function shouldShowEventInMonth(event) {
  const category = appData.categories.find(item => item.id === event.categoryId);
  return !category || category.showInMonth !== false;
}

function getVisibleEventsForDate(dateString) {
  const events = getEventsForDate(dateString);
  if (els.typeFilter.value === "all") return events;
  return events.filter(event => event.categoryId === els.typeFilter.value);
}

function hasOverlap(dateString, start, end, ignoreId = null) {
  return getEventsForDate(dateString).some(event => {
    if (event.id === ignoreId || event.isUnscheduled) return false;
    return start < event.end && end > event.start;
  });
}

function updateDateLabel() {
  if (viewMode === "week") {
    const week = getWeekDates(selectedDate);
    els.datePickerLabel.textContent = `${getKoreanDateLabel(week[0], true)} - ${getKoreanDateLabel(week[6], true)}`;
    return;
  }

  if (viewMode === "month") {
    const date = parseDate(selectedDate);
    els.datePickerLabel.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    return;
  }

  els.datePickerLabel.textContent = getKoreanDateLabel(selectedDate);
}

function updateTodayButton() {
  els.todayBtn.classList.toggle("is-hidden", selectedDate === getTodayString());
}


function updateEventDateLabel() {
  if (!els.eventDateLabel || !els.eventDate) return;
  const value = els.eventDate.value || selectedDate;
  els.eventDateLabel.textContent = getKoreanDateLabel(value);
}

function renderCategories() {
  const selectedCategory = els.categorySelect.value;
  const selectedFilter = els.typeFilter.value;

  const categoryOptions = appData.categories
    .map(category => `<option value="${category.id}">${escapeHTML(category.name)}</option>`)
    .join("");

  els.categorySelect.innerHTML = categoryOptions;
  els.categorySelect.disabled = appData.categories.length === 0;

  els.typeFilter.innerHTML = `<option value="all">전체</option>${categoryOptions}`;
  els.typeFilter.value = selectedFilter === "all" || appData.categories.some(item => item.id === selectedFilter)
    ? selectedFilter || "all"
    : "all";

  if (selectedCategory && appData.categories.some(item => item.id === selectedCategory)) {
    els.categorySelect.value = selectedCategory;
  }

  if (appData.categories.length === 0) {
    els.categoryList.innerHTML = `<p class="empty-text">아직 추가된 일정 종류가 없습니다.</p>`;
    return;
  }

  els.categoryList.innerHTML = appData.categories.map(category => `
    <div class="category-item">
      <div class="category-left">
        <span class="dot" style="background:${category.color}"></span>
        <span>${escapeHTML(category.name)}</span>
      </div>
      <button class="category-month-btn ${category.showInMonth === false ? "off" : ""}" type="button" data-category-month-id="${category.id}">
        월간 ${category.showInMonth === false ? "OFF" : "ON"}
      </button>
      <button class="category-sync-btn ${category.syncToCalendar === false ? "off" : ""}" type="button" data-category-sync-id="${category.id}">
        캘린더 ${category.syncToCalendar === false ? "OFF" : "ON"}
      </button>
      <button class="category-delete-btn" type="button" data-category-id="${category.id}">삭제</button>
    </div>
  `).join("");
}

function renderEventBlock(event) {
  return `
    <div class="event event-start-content" data-event-id="${event.id}">
      <div class="event-title">${escapeHTML(event.title)}</div>
      <div class="event-time">${minutesToTime(event.start)} - ${minutesToTime(event.end)}</div>
      ${event.memo ? `<div class="event-memo">${escapeHTML(event.memo)}</div>` : ""}
    </div>
  `;
}

function renderDayView() {
  const events = getVisibleEventsForDate(selectedDate).filter(event => !event.isUnscheduled);
  els.schedule.className = "schedule-scroll day-grid timeline-grid";
  els.schedule.innerHTML = "";

  const timeColumn = document.createElement("div");
  timeColumn.className = "time-column";

  const timelineColumn = document.createElement("div");
  timelineColumn.className = "timeline-column";

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotMinutes) {
    const timeCell = document.createElement("div");
    timeCell.className = "time-cell";
    timeCell.dataset.time = String(minutes);
    timeCell.textContent = minutesToTime(minutes);
    timeColumn.appendChild(timeCell);

    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.time = String(minutes);
    timelineColumn.appendChild(slot);
  }

  events.forEach(event => {
    const category = getCategory(event.categoryId);
    const slotHeight = 38;
    const minutesPerPixel = slotHeight / slotMinutes;
    const startOffset = (event.start - startHour * 60) * minutesPerPixel;
    const duration = (event.end - event.start) * minutesPerPixel;
    const block = document.createElement("div");

    block.className = "timeline-event-block";
    block.dataset.eventId = event.id;
    block.style.top = `${startOffset + 3}px`;
    block.style.height = `${Math.max(30, duration - 6)}px`;
    block.style.background = category.color;
    block.innerHTML = renderEventBlock(event);

    timelineColumn.appendChild(block);
  });

  els.schedule.append(timeColumn, timelineColumn);

  const nowMarker = document.createElement("div");
  nowMarker.id = "nowMarker";
  nowMarker.className = "now-marker";
  nowMarker.innerHTML = `
    <div id="nowTimeLabel" class="now-time-label"></div>
    <div class="now-line"></div>
  `;
  els.schedule.appendChild(nowMarker);

  updateCurrentTimeMarker();
}

function renderWeekView() {
  const week = getWeekDates(selectedDate);
  els.schedule.className = "schedule-scroll week-list";
  els.schedule.innerHTML = week.map(date => {
    const events = getVisibleEventsForDate(date).filter(shouldShowEventInMonth);
    const list = events.length
      ? events.map(event => {
          const category = getCategory(event.categoryId);
          return `
            <div class="week-event" data-event-id="${event.id}">
              <span class="week-event-dot" style="background:${category.color}"></span>
              <span>${event.isUnscheduled ? "시간미정" : minutesToTime(event.start)} ${escapeHTML(event.title)}</span>
            </div>
          `;
        }).join("")
      : `<p class="empty-text">일정 없음</p>`;

    return `
      <div class="week-day-card" data-date="${date}">
        <div class="week-day-title">${getKoreanDateLabel(date, true)}</div>
        ${list}
      </div>
    `;
  }).join("");
}

function renderMonthView() {
  const base = parseDate(selectedDate);
  const currentMonth = base.getMonth();
  const today = getTodayString();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dates = getMonthDates(selectedDate);

  els.schedule.className = "schedule-scroll month-grid";
  els.schedule.innerHTML = dayNames.map(day => `<div class="month-day-name">${day}</div>`).join("");

  els.schedule.innerHTML += dates.map(date => {
    const parsed = parseDate(date);
    const events = getVisibleEventsForDate(date).filter(shouldShowEventInMonth);
    const dots = events.slice(0, 6).map(event => {
      const category = getCategory(event.categoryId);
      return `<span class="month-dot" style="background:${category.color}"></span>`;
    }).join("");

    return `
      <div class="month-cell ${parsed.getMonth() !== currentMonth ? "muted" : ""} ${date === today ? "today" : ""}" data-date="${date}">
        <div class="month-date">${parsed.getDate()}</div>
        <div class="month-dots">${dots}</div>
      </div>
    `;
  }).join("");
}


function renderSummary() {
  if (!els.summaryCard) return;

  els.summaryCard.classList.toggle("is-hidden", viewMode !== "day");

  if (viewMode !== "day") return;

  const events = getVisibleEventsForDate(selectedDate);
  const unscheduled = events.filter(event => event.isUnscheduled);
  const timed = events.filter(event => !event.isUnscheduled);

  els.summaryCount.textContent = `${unscheduled.length}개`;

  if (unscheduled.length === 0) {
    els.summaryPreview.innerHTML = `<span class="summary-preview-line">시간 미정 일정 없음</span>`;
  } else {
    const visibleUnscheduled = unscheduled.slice(0, 3);
    const hiddenCount = Math.max(0, unscheduled.length - visibleUnscheduled.length);

    els.summaryPreview.innerHTML = visibleUnscheduled.map((event, index) => {
      const suffix = hiddenCount > 0 && index === visibleUnscheduled.length - 1
        ? ` 외 ${hiddenCount}개`
        : "";
      return `<span class="summary-preview-line">• ${escapeHTML(event.title)}${suffix}</span>`;
    }).join("");
  }

  if (timed.length === 0) {
    els.summaryDetail.innerHTML = `<p class="empty-text">시간 일정이 없습니다.</p>`;
    return;
  }

  els.summaryDetail.innerHTML = `
    <div class="summary-section-title">시간 일정</div>
    ${timed.map(event => `<div>• ${minutesToTime(event.start)} ${escapeHTML(event.title)}</div>`).join("")}
  `;
}


function getNowMinutesForDayPlan() {
  const now = new Date();
  let minutes = now.getHours() * 60 + now.getMinutes();

  if (minutes < 2 * 60) {
    minutes += 24 * 60;
  }

  return minutes;
}

function isNowVisibleInTimetable() {
  if (viewMode !== "day") return false;
  if (selectedDate !== getTodayString()) return false;

  const minutes = getNowMinutesForDayPlan();
  return minutes >= startHour * 60 && minutes <= endHour * 60;
}

function updateCurrentTimeMarker() {
  const marker = document.getElementById("nowMarker");
  const label = document.getElementById("nowTimeLabel");

  document.querySelectorAll(".time-cell.now-covered").forEach(cell => {
    cell.classList.remove("now-covered");
  });

  if (!marker || !label) return;

  if (!isNowVisibleInTimetable()) {
    marker.style.display = "none";
    return;
  }

  const now = new Date();
  const minutes = getNowMinutesForDayPlan();
  const offset = (minutes - startHour * 60) * (38 / slotMinutes);
  const coveredSlot = Math.floor(minutes / slotMinutes) * slotMinutes;
  const coveredCell = document.querySelector(`.time-cell[data-time="${coveredSlot}"]`);

  if (coveredCell) {
    coveredCell.classList.add("now-covered");
  }

  marker.style.display = "block";
  marker.style.top = `${offset}px`;
  label.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function scrollToCurrentTimeOnOpen() {
  if (!isNowVisibleInTimetable()) return;

  const minutes = getNowMinutesForDayPlan();
  const offset = (minutes - startHour * 60) * (38 / slotMinutes);
  const target = Math.max(0, offset - 90);

  requestAnimationFrame(() => {
    els.schedule.scrollTop = target;
  });
}


function getSyncIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(syncIdentityKey));
    if (saved?.ownerId && saved?.syncToken) return saved;
  } catch {}

  const ownerId = `owner-${crypto.randomUUID()}`;
  const syncToken = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const identity = { ownerId, syncToken };
  localStorage.setItem(syncIdentityKey, JSON.stringify(identity));
  return identity;
}

function getCalendarUrl() {
  const identity = getSyncIdentity();
  const url = new URL(supabaseConfig.functionUrl);
  url.searchParams.set("owner", identity.ownerId);
  url.searchParams.set("token", identity.syncToken);
  return url.toString();
}

function getSupabaseHeaders() {
  return {
    "apikey": supabaseConfig.publishableKey,
    "Authorization": `Bearer ${supabaseConfig.publishableKey}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
  };
}

async function deleteRows(table, identity) {
  const url = `${supabaseConfig.restUrl}/${table}?owner_id=eq.${encodeURIComponent(identity.ownerId)}&sync_token=eq.${encodeURIComponent(identity.syncToken)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getSupabaseHeaders()
  });

  if (!response.ok) {
    throw new Error(`${table} 삭제 실패: ${await response.text()}`);
  }
}

async function insertRows(table, rows) {
  if (!rows.length) return;

  const response = await fetch(`${supabaseConfig.restUrl}/${table}`, {
    method: "POST",
    headers: getSupabaseHeaders(),
    body: JSON.stringify(rows)
  });

  if (!response.ok) {
    throw new Error(`${table} 저장 실패: ${await response.text()}`);
  }
}


function shouldSyncEventToCalendar(event) {
  const category = appData.categories.find(item => item.id === event.categoryId);
  return !category || category.syncToCalendar !== false;
}

function toDbEvent(event, identity) {
  return {
    id: event.id,
    owner_id: identity.ownerId,
    sync_token: identity.syncToken,
    date: event.date,
    title: event.title,
    category_id: event.categoryId || null,
    memo: event.memo || null,
    start_minutes: event.isUnscheduled ? null : event.start,
    end_minutes: event.isUnscheduled ? null : event.end,
    is_unscheduled: Boolean(event.isUnscheduled),
    repeat_type: event.repeat || "none",
    updated_at: new Date().toISOString()
  };
}

function toDbCategory(category, identity) {
  return {
    id: category.id,
    owner_id: identity.ownerId,
    sync_token: identity.syncToken,
    name: category.name,
    color: category.color,
    updated_at: new Date().toISOString()
  };
}

function formatSyncTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function updateCalendarSyncMeta(text) {
  if (els.calendarSyncMeta) els.calendarSyncMeta.textContent = text;
}

function restoreCalendarSyncMeta() {
  const saved = localStorage.getItem(calendarSyncMetaKey);
  updateCalendarSyncMeta(saved || "마지막 업데이트: 아직 없음");
}


function encodeBackupPayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodeBackupPayload(code) {
  const json = decodeURIComponent(escape(atob(code.trim())));
  return JSON.parse(json);
}

function createBackupPayload() {
  normalizeCategoryVisibilityFlags();

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    identity: getSyncIdentity(),
    appData: {
      categories: appData.categories,
      events: appData.events
    }
  };
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

async function copyBackupCode() {
  const code = encodeBackupPayload(createBackupPayload());
  let copied = false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    copied = fallbackCopyText(code);
  }

  prompt(
    copied
      ? "연동 코드를 복사했습니다. 안전한 곳에 보관하세요. 복사가 안 됐다면 아래 코드를 직접 복사하세요."
      : "자동 복사가 안 됐습니다. 아래 연동 코드를 직접 복사하세요.",
    code
  );

  updateCalendarSyncMeta(copied ? "연동 코드 복사 완료" : "연동 코드 직접 복사 필요");
  setTimeout(restoreCalendarSyncMeta, 1800);
}

function validateImportedBackup(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("연동 코드 형식이 올바르지 않습니다.");
  }

  if (!payload.identity?.ownerId || !payload.identity?.syncToken) {
    throw new Error("연동 정보가 없습니다.");
  }

  if (!payload.appData || !Array.isArray(payload.appData.categories) || !Array.isArray(payload.appData.events)) {
    throw new Error("복원할 일정 데이터가 없습니다.");
  }
}

function normalizeImportedAppData(data) {
  return {
    categories: data.categories.map(category => ({
      ...category,
      syncToCalendar: category.syncToCalendar !== false,
      showInMonth: category.showInMonth !== false
    })),
    events: data.events.map(event => ({
      ...event,
      isUnscheduled: Boolean(event.isUnscheduled)
    }))
  };
}

function importBackupCode() {
  const code = prompt("저장해둔 연동 코드를 붙여넣으세요.");
  if (!code) return;

  let payload;

  try {
    payload = decodeBackupPayload(code);
    validateImportedBackup(payload);
  } catch (error) {
    alert(error.message || "연동 코드를 읽을 수 없습니다.");
    return;
  }

  const shouldImport = confirm("현재 기기의 데이플랜 일정이 연동 코드의 데이터로 교체됩니다. 계속할까요?");
  if (!shouldImport) return;

  localStorage.setItem(syncIdentityKey, JSON.stringify(payload.identity));
  appData = normalizeImportedAppData(payload.appData);
  saveAppData();
  renderAll();

  updateCalendarSyncMeta("연동 코드 불러오기 완료");
  alert("연동 코드에서 일정을 복원했습니다. 화면을 확인한 뒤 필요하면 캘린더 업데이트를 눌러주세요.");
}

async function syncCalendarToSupabase() {
  const identity = getSyncIdentity();

  updateCalendarSyncMeta("업데이트 중...");

  await deleteRows("dayplan_events", identity);
  await deleteRows("dayplan_categories", identity);

  const calendarEvents = appData.events.filter(shouldSyncEventToCalendar);

  await insertRows("dayplan_categories", appData.categories.map(category => toDbCategory(category, identity)));
  await insertRows("dayplan_events", calendarEvents.map(event => toDbEvent(event, identity)));

  const message = `마지막 업데이트: ${formatSyncTime(new Date())} · ${calendarEvents.length}개 전송`;
  localStorage.setItem(calendarSyncMetaKey, message);
  updateCalendarSyncMeta(message);
}

async function copyCalendarUrl() {
  const url = getCalendarUrl();

  try {
    await navigator.clipboard.writeText(url);
    updateCalendarSyncMeta("구독 URL 복사 완료");
    setTimeout(restoreCalendarSyncMeta, 1800);
  } catch {
    prompt("아래 구독 URL을 복사하세요.", url);
  }
}

function getCountScopeDates() {
  if (viewMode === "week") return getWeekDates(selectedDate);

  if (viewMode === "month") {
    const base = parseDate(selectedDate);
    const year = base.getFullYear();
    const month = base.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: lastDay }, (_, index) => {
      return formatDate(new Date(year, month, index + 1));
    });
  }

  return [selectedDate];
}

function renderSchedule() {
  updateDateLabel();
  updateTodayButton();

  if (viewMode === "day") {
    els.dateTitle.textContent = "일간 일정";
    renderDayView();
  } else if (viewMode === "week") {
    els.dateTitle.textContent = "주간 일정";
    renderWeekView();
  } else {
    els.dateTitle.textContent = "월간 일정";
    renderMonthView();
  }

  renderSummary();

  const countScopeDates = getCountScopeDates();
  const countEventsForDate = (date) => {
    const events = getEventsForDate(date);
    return viewMode === "month" ? events.filter(shouldShowEventInMonth) : events;
  };
  const countVisibleEventsForDate = (date) => {
    const events = getVisibleEventsForDate(date);
    return viewMode === "month" ? events.filter(shouldShowEventInMonth) : events;
  };
  const total = countScopeDates.reduce((sum, date) => sum + countEventsForDate(date).length, 0);
  const visible = countScopeDates.reduce((sum, date) => sum + countVisibleEventsForDate(date).length, 0);
  els.eventCount.textContent = els.typeFilter.value === "all" ? `${total}개 일정` : `${visible}/${total}개 일정`;

  els.dayViewBtn.classList.toggle("active", viewMode === "day");
  els.weekViewBtn.classList.toggle("active", viewMode === "week");
  els.monthViewBtn.classList.toggle("active", viewMode === "month");
  updateCurrentTimeMarker();
}

function renderSearchResults() {
  const keyword = els.searchInput.value.trim().toLowerCase();

  if (!keyword) {
    els.searchResults.innerHTML = `<p class="empty-text">검색어를 입력하면 저장된 전체 일정에서 찾아줍니다.</p>`;
    return;
  }

  const results = appData.events
    .filter(event => {
      const category = getCategory(event.categoryId);
      return `${event.title} ${event.memo || ""} ${category.name}`.toLowerCase().includes(keyword);
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);

  if (results.length === 0) {
    els.searchResults.innerHTML = `<p class="empty-text">검색 결과가 없습니다.</p>`;
    return;
  }

  els.searchResults.innerHTML = results.map(event => {
    const category = getCategory(event.categoryId);
    return `
      <div class="search-card" data-date="${event.date}" data-event-id="${event.id}">
        <strong>${escapeHTML(event.title)}</strong>
        <span>${getKoreanDateLabel(event.date)} · ${event.isUnscheduled ? "시간미정" : `${minutesToTime(event.start)} - ${minutesToTime(event.end)}`}</span>
        <span>${escapeHTML(category.name)}${event.repeat !== "none" ? ` · ${getRepeatLabel(event.repeat)}` : ""}</span>
      </div>
    `;
  }).join("");
}

function renderAll() {
  normalizeCategorySyncFlags();
  renderCategories();
  renderSchedule();
  renderSearchResults();
}

function addCategory() {
  const name = els.newCategoryName.value.trim();
  const color = els.newCategoryColor.value;

  if (!name) {
    alert("종류 이름을 입력하세요.");
    return;
  }

  if (appData.categories.some(category => category.name === name)) {
    alert("이미 같은 이름의 종류가 있습니다.");
    return;
  }

  appData.categories.push({
    id: createId("category"),
    name,
    color,
    syncToCalendar: true,
    showInMonth: true
  });

  els.newCategoryName.value = "";
  saveAppData();
  renderAll();
}



function toggleCategoryMonthVisibility(id) {
  const category = appData.categories.find(item => item.id === id);
  if (!category) return;

  category.showInMonth = category.showInMonth === false ? true : false;
  saveAppData();
  renderAll();
}

function toggleCategoryCalendarSync(id) {
  const category = appData.categories.find(item => item.id === id);
  if (!category) return;

  category.syncToCalendar = category.syncToCalendar === false ? true : false;
  saveAppData();
  renderAll();
}

function deleteCategory(id) {
  if (appData.events.some(event => event.categoryId === id)) {
    alert("이미 사용 중인 종류는 삭제할 수 없습니다.");
    return;
  }

  appData.categories = appData.categories.filter(category => category.id !== id);
  saveAppData();
  renderAll();
}


function closeSettingsModal() {
  if (!els.settingsModal) return;
  els.settingsModal.classList.remove("open");
  els.settingsModal.setAttribute("aria-hidden", "true");
  els.settingsModal.querySelectorAll(".settings-section.open").forEach(section => {
    section.classList.remove("open");
    const icon = section.querySelector(".toggle-icon");
    if (icon) icon.textContent = "+";
  });
}

function openEventModal(mode = "add") {
  els.eventModal.classList.add("open");
  els.eventModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  els.eventModalTitle.textContent = mode === "edit" ? "일정 수정" : "일정 추가";
}

function closeEventModal() {
  els.eventModal.classList.remove("open");
  els.eventModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function resetForm() {
  editingEventId = null;
  els.eventDate.value = selectedDate;
  updateEventDateLabel();
  els.title.value = "";
  els.memo.value = "";
  els.categorySelect.value = appData.categories[0]?.id || "";
  setTimeFields("start", 9 * 60);
  setTimeFields("end", 10 * 60);
  if (els.isUnscheduled) els.isUnscheduled.checked = false;
  if (els.timeFields) els.timeFields.classList.remove("is-hidden");
  els.repeat.value = "none";
  els.saveEventBtn.textContent = "추가하기";
  els.cancelEditBtn.style.display = "none";
  els.deleteEditingBtn.classList.remove("show");
  els.eventButtonRow.classList.remove("editing");
}

function startEditEvent(id) {
  const event = appData.events.find(item => item.id === id);
  if (!event) return;

  editingEventId = id;
  selectedDate = event.date;
  els.datePicker.value = selectedDate;
  els.eventDate.value = event.date;
  updateEventDateLabel();
  els.title.value = event.title;
  els.categorySelect.value = event.categoryId;
  els.memo.value = event.memo || "";
  if (els.isUnscheduled) els.isUnscheduled.checked = Boolean(event.isUnscheduled);
  if (els.timeFields) els.timeFields.classList.toggle("is-hidden", Boolean(event.isUnscheduled));
  if (!event.isUnscheduled) {
    setTimeFields("start", event.start);
    setTimeFields("end", event.end);
  }
  els.repeat.value = event.repeat || "none";
  els.saveEventBtn.textContent = "수정 저장하기";
  els.cancelEditBtn.style.display = "block";
  els.deleteEditingBtn.classList.add("show");
  els.eventButtonRow.classList.add("editing");
  renderSchedule();
  openEventModal("edit");
}

function saveEvent() {
  const title = els.title.value.trim();
  const eventDateValue = els.eventDate.value || selectedDate;
  const categoryId = els.categorySelect.value;
  const memo = els.memo.value.trim();
  const isUnscheduled = Boolean(els.isUnscheduled?.checked);
  const start = isUnscheduled ? null : getTimeFields("start");
  const end = isUnscheduled ? null : getTimeFields("end");
  const repeat = els.repeat.value;

  if (!title) {
    alert("일정 이름을 입력하세요.");
    return;
  }

  if (appData.categories.length === 0 || !categoryId) {
    alert("먼저 일정 종류를 추가하세요.");
    return;
  }

  if (!isUnscheduled && start >= end) {
    alert("종료 시간은 시작 시간보다 늦어야 합니다.");
    return;
  }

  if (!isUnscheduled && hasOverlap(eventDateValue, start, end, editingEventId)) {
    alert("이미 해당 시간대에 일정이 있습니다.");
    return;
  }

  if (editingEventId) {
    const target = appData.events.find(event => event.id === editingEventId);
    if (!target) return;

    Object.assign(target, {
      date: eventDateValue,
      title,
      categoryId,
      memo,
      isUnscheduled,
      start,
      end,
      repeat
    });
  } else {
    appData.events.push({
      id: createId("event"),
      date: eventDateValue,
      title,
      categoryId,
      memo,
      isUnscheduled,
      start,
      end,
      repeat
    });
  }

  selectedDate = eventDateValue;
  els.datePicker.value = selectedDate;
  saveAppData();
  resetForm();
  closeEventModal();
  renderAll();
}

function deleteEvent() {
  if (!editingEventId) return;

  const event = appData.events.find(item => item.id === editingEventId);
  if (!event) return;

  const message = event.repeat && event.repeat !== "none"
    ? "반복 일정 전체를 삭제할까요?"
    : "이 일정을 삭제할까요?";

  if (!confirm(message)) return;

  appData.events = appData.events.filter(item => item.id !== editingEventId);
  saveAppData();
  resetForm();
  closeEventModal();
  renderAll();
}

function changeDate(amount) {
  if (viewMode === "month") {
    const date = parseDate(selectedDate);
    date.setMonth(date.getMonth() + amount);
    selectedDate = formatDate(date);
  } else {
    selectedDate = addDays(selectedDate, viewMode === "week" ? amount * 7 : amount);
  }

  els.datePicker.value = selectedDate;
  renderSchedule();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}


if (els.settingsBtn) {
  els.settingsBtn.addEventListener("click", () => {
    els.settingsModal.classList.add("open");
    els.settingsModal.setAttribute("aria-hidden", "false");
  });
}

if (els.settingsCloseBtn) {
  els.settingsCloseBtn.addEventListener("click", closeSettingsModal);
}

if (els.settingsBackdrop) {
  els.settingsBackdrop.addEventListener("click", closeSettingsModal);
}

if (els.summaryToggle) {
  els.summaryToggle.addEventListener("click", () => {
    els.summaryCard.classList.toggle("open");
  });
}

if (els.isUnscheduled) {
  els.isUnscheduled.addEventListener("change", () => {
    els.timeFields.classList.toggle("is-hidden", els.isUnscheduled.checked);
  });
}



if (els.calendarSyncBtn) {
  els.calendarSyncBtn.addEventListener("click", async () => {
    els.calendarSyncBtn.disabled = true;
    try {
      await syncCalendarToSupabase();
    } catch (error) {
      console.error(error);
      updateCalendarSyncMeta("업데이트 실패");
      alert(error.message || "캘린더 업데이트에 실패했습니다.");
    } finally {
      els.calendarSyncBtn.disabled = false;
    }
  });
}

if (els.copyCalendarUrlBtn) {
  els.copyCalendarUrlBtn.addEventListener("click", copyCalendarUrl);
}



if (els.copyBackupCodeBtn) {
  els.copyBackupCodeBtn.addEventListener("click", copyBackupCode);
}

if (els.importBackupCodeBtn) {
  els.importBackupCodeBtn.addEventListener("click", importBackupCode);
}


els.sectionToggles.forEach(button => {
  button.addEventListener("click", () => {
    const section = button.closest(".tool-section, .settings-section");
    if (!section) return;

    const icon = button.querySelector(".toggle-icon");
    const isCurrentlyOpen = section.classList.contains("open");

    const scope = section.closest("#settingsModal") || document;
    scope.querySelectorAll(".tool-section.open, .settings-section.open").forEach(item => {
      item.classList.remove("open");
      const itemIcon = item.querySelector(".toggle-icon");
      if (itemIcon) itemIcon.textContent = "+";
    });

    if (!isCurrentlyOpen) {
      section.classList.add("open");
      if (icon) icon.textContent = "−";
    }
  });
});

els.addCategoryBtn.addEventListener("click", addCategory);

els.categoryList.addEventListener("click", event => {
  const monthButton = event.target.closest("[data-category-month-id]");
  if (monthButton) {
    toggleCategoryMonthVisibility(monthButton.dataset.categoryMonthId);
    return;
  }

  const syncButton = event.target.closest("[data-category-sync-id]");
  if (syncButton) {
    toggleCategoryCalendarSync(syncButton.dataset.categorySyncId);
    return;
  }

  const button = event.target.closest("[data-category-id]");
  if (!button) return;
  deleteCategory(button.dataset.categoryId);
});

els.searchInput.addEventListener("input", renderSearchResults);

els.searchResults.addEventListener("click", event => {
  const card = event.target.closest("[data-event-id]");
  if (!card) return;
  selectedDate = card.dataset.date;
  els.datePicker.value = selectedDate;
  viewMode = "day";
  renderSchedule();
});

els.floatingAddBtn.addEventListener("click", () => {
  resetForm();
  openEventModal("add");
});

els.closeEventModalBtn.addEventListener("click", () => {
  resetForm();
  closeEventModal();
});

els.modalBackdrop.addEventListener("click", () => {
  resetForm();
  closeEventModal();
});

els.saveEventBtn.addEventListener("click", saveEvent);
els.cancelEditBtn.addEventListener("click", () => {
  resetForm();
  closeEventModal();
});
els.deleteEditingBtn.addEventListener("click", deleteEvent);

els.prevDateBtn.addEventListener("click", () => changeDate(-1));
els.nextDateBtn.addEventListener("click", () => changeDate(1));
els.todayBtn.addEventListener("click", () => {
  selectedDate = getTodayString();
  els.datePicker.value = selectedDate;
  renderSchedule();
});

els.datePicker.addEventListener("change", event => {
  selectedDate = event.target.value;
  renderSchedule();
});

els.eventDate.addEventListener("change", updateEventDateLabel);

els.dayViewBtn.addEventListener("click", () => {
  viewMode = "day";
  renderSchedule();
});

els.weekViewBtn.addEventListener("click", () => {
  viewMode = "week";
  renderSchedule();
});

els.monthViewBtn.addEventListener("click", () => {
  viewMode = "month";
  renderSchedule();
});

els.typeFilter.addEventListener("change", renderSchedule);

els.schedule.addEventListener("click", event => {
  const eventCard = event.target.closest("[data-event-id]");
  if (eventCard) {
    startEditEvent(eventCard.dataset.eventId);
    return;
  }

  const monthCell = event.target.closest(".month-cell[data-date]");
  if (monthCell) {
    selectedDate = monthCell.dataset.date;
    els.datePicker.value = selectedDate;
    viewMode = "day";
    renderSchedule();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && els.eventModal.classList.contains("open")) {
    resetForm();
    closeEventModal();
  }
});

createTimeOptions();
els.datePicker.value = selectedDate;
els.eventDate.value = selectedDate;
updateEventDateLabel();
renderAll();
restoreCalendarSyncMeta();
scrollToCurrentTimeOnOpen();
setInterval(updateCurrentTimeMarker, 60000);
registerServiceWorker();
