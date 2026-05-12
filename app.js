const startHour = 6;
const endHour = 26;
const slotMinutes = 30;
const slotHeight = 42;
const storageKey = "date-schedule-app-v5";

const defaultCategories = [];

const els = {
  title: document.getElementById("title"),
  categorySelect: document.getElementById("categorySelect"),
  memo: document.getElementById("memo"),
  start: document.getElementById("start"),
  end: document.getElementById("end"),
  repeat: document.getElementById("repeat"),
  saveEventBtn: document.getElementById("saveEventBtn"),
  eventButtonRow: document.getElementById("eventButtonRow"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  clearDayBtn: document.getElementById("clearDayBtn"),
  deleteEditingBtn: document.getElementById("deleteEditingBtn"),
  newCategoryName: document.getElementById("newCategoryName"),
  newCategoryColor: document.getElementById("newCategoryColor"),
  addCategoryBtn: document.getElementById("addCategoryBtn"),
  categoryList: document.getElementById("categoryList"),
  searchInput: document.getElementById("searchInput"),
  searchResults: document.getElementById("searchResults"),
  sectionToggles: document.querySelectorAll("[data-toggle]"),
  floatingAddBtn: document.getElementById("floatingAddBtn"),
  dateTitle: document.getElementById("dateTitle"),
  datePicker: document.getElementById("datePicker"),
  prevDateBtn: document.getElementById("prevDateBtn"),
  nextDateBtn: document.getElementById("nextDateBtn"),
  todayBtn: document.getElementById("todayBtn"),
  selectedDateText: document.getElementById("selectedDateText"),
  dayViewBtn: document.getElementById("dayViewBtn"),
  weekViewBtn: document.getElementById("weekViewBtn"),
  monthViewBtn: document.getElementById("monthViewBtn"),
  typeFilter: document.getElementById("typeFilter"),
  eventCount: document.getElementById("eventCount"),
  schedule: document.getElementById("schedule"),
  eventModal: document.getElementById("eventModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeEventModalBtn: document.getElementById("closeEventModalBtn"),
  eventModalTitle: document.getElementById("eventModalTitle")
};

let appData = loadAppData();
let selectedDate = getTodayString();
let viewMode = "day";
let editingEventId = null;

function pad(num) {
  return String(num).padStart(2, "0");
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const normalizedMinutes = minutes % (24 * 60);
  const h = Math.floor(normalizedMinutes / 60);
  const m = normalizedMinutes % 60;
  return `${pad(h)}:${pad(m)}`;
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
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    return formatDate(d);
  });
}

function getMonthDates(dateString) {
  const base = parseDate(dateString);
  const firstDate = new Date(base.getFullYear(), base.getMonth(), 1);
  const firstDay = firstDate.getDay();
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return formatDate(date);
  });
}

function mergeCategories(savedCategories = []) {
  const map = new Map();

  [...savedCategories, ...defaultCategories].forEach(category => {
    if (!category || !category.id) return;

    map.set(category.id, {
      id: category.id,
      name: category.name || "이름 없음",
      color: category.color || "#94a3b8",
      protected: defaultCategories.some(item => item.id === category.id) || Boolean(category.protected)
    });
  });

  return Array.from(map.values());
}

function loadAppData() {
  const fallback = { categories: defaultCategories, events: [] };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return fallback;

    return {
      categories: mergeCategories(saved.categories),
      events: Array.isArray(saved.events) ? saved.events : []
    };
  } catch {
    return fallback;
  }
}

function saveAppData() {
  localStorage.setItem(storageKey, JSON.stringify(appData));
  renderSearchResults();
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCategory(categoryId) {
  return appData.categories.find(category => category.id === categoryId) || {
    id: "uncategorized",
    name: "종류 없음",
    color: "#cbd5e1",
    protected: true
  };
}

function createTimeOptions() {
  els.start.innerHTML = "";
  els.end.innerHTML = "";

  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += slotMinutes) {
    const startOption = document.createElement("option");
    startOption.value = minutes;
    startOption.textContent = minutesToTime(minutes);
    els.start.appendChild(startOption);

    const endOption = document.createElement("option");
    endOption.value = minutes;
    endOption.textContent = minutesToTime(minutes);
    els.end.appendChild(endOption);
  }

  els.start.value = 9 * 60;
  els.end.value = 10 * 60;
}

function renderCategoryControls() {
  const selectedCategory = els.categorySelect.value;
  const selectedFilter = els.typeFilter.value;

  const categoryOptions = appData.categories
    .map(category => `<option value="${category.id}">${escapeHTML(category.name)}</option>`)
    .join("");

  els.categorySelect.innerHTML = categoryOptions;
  els.categorySelect.disabled = appData.categories.length === 0;

  els.typeFilter.innerHTML = `<option value="all">전체</option>${categoryOptions}`;

  if (selectedCategory && appData.categories.some(category => category.id === selectedCategory)) {
    els.categorySelect.value = selectedCategory;
  }

  if (selectedFilter === "all" || appData.categories.some(category => category.id === selectedFilter)) {
    els.typeFilter.value = selectedFilter || "all";
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
      <button class="danger-btn" type="button" data-category-id="${category.id}">삭제</button>
    </div>
  `).join("");
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
    protected: false
  });

  els.newCategoryName.value = "";
  saveAppData();
  renderAll();
}

function deleteCategory(categoryId) {
  const category = getCategory(categoryId);
  if (!category || category.protected) return;

  const isUsed = appData.events.some(event => event.categoryId === categoryId);
  if (isUsed) {
    alert("이미 사용 중인 종류는 삭제할 수 없습니다. 해당 일정을 먼저 다른 종류로 수정하세요.");
    return;
  }

  appData.categories = appData.categories.filter(item => item.id !== categoryId);
  saveAppData();
  renderAll();
}

function shouldShowRecurringEvent(event, dateString) {
  if (!event.repeat || event.repeat === "none") return event.date === dateString;
  if (dateString < event.date) return false;

  const target = parseDate(dateString);
  const original = parseDate(event.date);

  if (event.repeat === "daily") return true;

  if (event.repeat === "weekdays") {
    const day = target.getDay();
    return day >= 1 && day <= 5;
  }

  if (event.repeat === "weekly") {
    return target.getDay() === original.getDay();
  }

  return false;
}

function getEventsForDate(dateString) {
  return appData.events
    .filter(event => shouldShowRecurringEvent(event, dateString))
    .sort((a, b) => a.start - b.start);
}

function getVisibleEventsForDate(dateString) {
  const events = getEventsForDate(dateString);
  if (els.typeFilter.value === "all") return events;
  return events.filter(event => event.categoryId === els.typeFilter.value);
}

function hasOverlap(dateString, newStart, newEnd, ignoreId = null) {
  return getEventsForDate(dateString).some(event => {
    if (event.id === ignoreId) return false;
    return newStart < event.end && newEnd > event.start;
  });
}

function getRepeatLabel(repeat) {
  const labels = {
    none: "반복 없음",
    daily: "매일 반복",
    weekly: "매주 반복",
    weekdays: "평일 반복"
  };

  return labels[repeat] || "반복 없음";
}

function renderEvent(event, compact = false) {
  const category = getCategory(event.categoryId);
  const durationSlots = (event.end - event.start) / slotMinutes;
  const height = Math.max(slotHeight - 8, durationSlots * slotHeight - 8);

  return `
    <div class="event" data-event-id="${event.id}" style="height:${height}px; background:${category.color};" title="${escapeHTML(event.title)}">
      <div style="min-width:0;">
        <div class="event-title">${escapeHTML(event.title)}</div>
        <div class="event-time">${minutesToTime(event.start)} - ${minutesToTime(event.end)}${event.repeat && event.repeat !== "none" ? ` · ${getRepeatLabel(event.repeat)}` : ""}</div>
        ${!compact && event.memo ? `<div class="event-memo">${escapeHTML(event.memo)}</div>` : ""}
      </div>
    </div>
  `;
}

function renderDayView() {
  els.schedule.className = "day-grid";
  els.schedule.innerHTML = "";
  const events = getVisibleEventsForDate(selectedDate);

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotMinutes) {
    const timeCell = document.createElement("div");
    timeCell.className = "time-cell";
    timeCell.textContent = minutesToTime(minutes);

    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.time = minutes;
    slot.dataset.date = selectedDate;

    const event = events.find(item => item.start === minutes);
    if (event) slot.innerHTML = renderEvent(event);

    els.schedule.appendChild(timeCell);
    els.schedule.appendChild(slot);
  }
}

function renderWeekView() {
  const weekDates = getWeekDates(selectedDate);
  els.schedule.className = "week-grid";
  els.schedule.innerHTML = `<div class="corner-cell">시간</div>`;

  weekDates.forEach(date => {
    els.schedule.innerHTML += `<div class="week-head">${getKoreanDateLabel(date, true)}</div>`;
  });

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotMinutes) {
    els.schedule.innerHTML += `<div class="time-cell">${minutesToTime(minutes)}</div>`;

    weekDates.forEach(date => {
      const event = getVisibleEventsForDate(date).find(item => item.start === minutes);
      els.schedule.innerHTML += `
        <div class="slot" data-date="${date}" data-time="${minutes}">
          ${event ? renderEvent(event, true) : ""}
        </div>
      `;
    });
  }
}

function renderMonthView() {
  const base = parseDate(selectedDate);
  const currentMonth = base.getMonth();
  const today = getTodayString();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const monthDates = getMonthDates(selectedDate);

  els.schedule.className = "month-grid";
  els.schedule.innerHTML = dayNames.map(day => `<div class="month-day-name">${day}</div>`).join("");

  monthDates.forEach(date => {
    const parsed = parseDate(date);
    const events = getVisibleEventsForDate(date);
    const isMuted = parsed.getMonth() !== currentMonth;
    const isToday = date === today;
    const visibleEvents = events.slice(0, 3);
    const extraCount = Math.max(0, events.length - visibleEvents.length);

    const eventList = visibleEvents.map(event => {
      const category = getCategory(event.categoryId);
      return `
        <div class="month-event">
          <span class="month-event-dot" style="background:${category.color}"></span>
          <span class="month-event-title">${escapeHTML(event.title)}</span>
        </div>
      `;
    }).join("");

    const dots = events.slice(0, 6).map(event => {
      const category = getCategory(event.categoryId);
      return `<span class="month-dot" style="background:${category.color}"></span>`;
    }).join("");

    els.schedule.innerHTML += `
      <div class="month-cell ${isMuted ? "muted" : ""} ${isToday ? "today" : ""}" data-date="${date}">
        <div class="month-date">
          <span>${parsed.getDate()}</span>
          ${events.length ? `<span class="month-count">${events.length}개</span>` : ""}
        </div>
        <div class="month-events">
          ${eventList}
          ${extraCount ? `<div class="month-more">+${extraCount}개</div>` : ""}
        </div>
        <div class="month-dots">${dots}${events.length > 6 ? `<span class="month-more">+${events.length - 6}</span>` : ""}</div>
      </div>
    `;
  });
}

function renderSchedule() {
  if (viewMode === "day") renderDayView();
  else if (viewMode === "week") renderWeekView();
  else renderMonthView();

  const allTodayEvents = getEventsForDate(selectedDate);
  const visibleTodayEvents = getVisibleEventsForDate(selectedDate);

  els.eventCount.textContent = els.typeFilter.value === "all"
    ? `${allTodayEvents.length}개 일정`
    : `${visibleTodayEvents.length}/${allTodayEvents.length}개 일정`;

  const today = getTodayString();

  if (viewMode === "day") {
    els.dateTitle.textContent = selectedDate === today ? "오늘의 일정" : "선택한 날짜의 일정";
    els.selectedDateText.textContent = getKoreanDateLabel(selectedDate);
  } else if (viewMode === "week") {
    els.dateTitle.textContent = "주간 일정";
    els.selectedDateText.textContent = `${getKoreanDateLabel(getWeekDates(selectedDate)[0], true)} - ${getKoreanDateLabel(getWeekDates(selectedDate)[6], true)}`;
  } else {
    const date = parseDate(selectedDate);
    els.dateTitle.textContent = "월간 일정";
    els.selectedDateText.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  }

  els.dayViewBtn.classList.toggle("active", viewMode === "day");
  els.weekViewBtn.classList.toggle("active", viewMode === "week");
  els.monthViewBtn.classList.toggle("active", viewMode === "month");
}

function openEventModal(mode = "add") {
  els.eventModal.classList.add("open");
  els.eventModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  els.eventModalTitle.textContent = mode === "edit" ? "일정 수정" : "일정 추가";
  setTimeout(() => els.title.focus(), 50);
}

function closeEventModal() {
  els.eventModal.classList.remove("open");
  els.eventModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function saveEvent() {
  const title = els.title.value.trim();
  const categoryId = els.categorySelect.value;
  const memo = els.memo.value.trim();
  const start = Number(els.start.value);
  const end = Number(els.end.value);
  const repeat = els.repeat.value;

  if (!title) {
    alert("일정 이름을 입력하세요.");
    return;
  }

  if (appData.categories.length === 0 || !categoryId) {
    alert("먼저 일정 종류를 추가하세요.");
    return;
  }

  if (start >= end) {
    alert("종료 시간은 시작 시간보다 늦어야 합니다.");
    return;
  }

  if (hasOverlap(selectedDate, start, end, editingEventId)) {
    alert("이미 해당 시간대에 일정이 있습니다.");
    return;
  }

  if (editingEventId) {
    const target = appData.events.find(event => event.id === editingEventId);
    if (!target) return;

    Object.assign(target, {
      title,
      categoryId,
      memo,
      start,
      end,
      repeat,
      date: selectedDate
    });
  } else {
    appData.events.push({
      id: createId("event"),
      date: selectedDate,
      title,
      categoryId,
      memo,
      start,
      end,
      repeat
    });
  }

  saveAppData();
  resetForm();
  closeEventModal();
  renderAll();
}

function openSection(sectionName) {
  document.querySelectorAll(".collapsible-section").forEach(section => {
    const isTarget = section.dataset.section === sectionName;
    section.classList.toggle("open", isTarget);

    const icon = section.querySelector(".toggle-icon");
    if (icon) icon.textContent = isTarget ? "−" : "+";
  });
}

function toggleSection(sectionName) {
  const section = document.querySelector(`.collapsible-section[data-section="${sectionName}"]`);
  if (!section) return;

  const willOpen = !section.classList.contains("open");

  document.querySelectorAll(".collapsible-section").forEach(item => {
    item.classList.remove("open");

    const icon = item.querySelector(".toggle-icon");
    if (icon) icon.textContent = "+";
  });

  if (willOpen) {
    section.classList.add("open");

    const icon = section.querySelector(".toggle-icon");
    if (icon) icon.textContent = "−";
  }
}

function startEditEvent(id) {
  const event = appData.events.find(item => item.id === id);
  if (!event) return;

  editingEventId = id;
  selectedDate = event.date;
  els.datePicker.value = selectedDate;
  els.title.value = event.title;
  els.categorySelect.value = event.categoryId;
  els.memo.value = event.memo || "";
  els.start.value = event.start;
  els.end.value = event.end;
  els.repeat.value = event.repeat || "none";
  els.saveEventBtn.textContent = "수정 저장하기";
  els.cancelEditBtn.style.display = "block";
  els.deleteEditingBtn.style.display = "block";
  els.eventButtonRow.classList.add("editing");
  openEventModal("edit");
  renderSchedule();
}

function resetForm() {
  editingEventId = null;
  els.title.value = "";
  els.memo.value = "";
  if (appData.categories.length > 0) {
    els.categorySelect.value = appData.categories[0].id;
  }
  els.start.value = 9 * 60;
  els.end.value = 10 * 60;
  els.repeat.value = "none";
  els.saveEventBtn.textContent = "추가하기";
  els.cancelEditBtn.style.display = "none";
  els.deleteEditingBtn.style.display = "none";
  els.eventButtonRow.classList.remove("editing");
  els.eventModalTitle.textContent = "일정 추가";
}

function deleteEvent(id) {
  const event = appData.events.find(item => item.id === id);
  if (!event) return;

  const repeatMessage = event.repeat && event.repeat !== "none"
    ? "반복 일정 전체를 삭제할까요?"
    : "이 일정을 삭제할까요?";

  if (!confirm(repeatMessage)) return;

  appData.events = appData.events.filter(item => item.id !== id);
  if (editingEventId === id) resetForm();
  saveAppData();
  closeEventModal();
  renderAll();
}

function clearSelectedDate() {
  const events = getEventsForDate(selectedDate);

  if (events.length === 0) {
    alert("삭제할 일정이 없습니다.");
    return;
  }

  if (!confirm("이 날짜에 직접 등록된 일정을 모두 삭제할까요? 반복 일정은 시작 날짜가 이 날짜인 경우에만 삭제됩니다.")) return;

  appData.events = appData.events.filter(event => event.date !== selectedDate);
  resetForm();
  closeEventModal();
  saveAppData();
  renderAll();
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
      const targetText = `${event.title} ${event.memo || ""} ${category?.name || ""}`.toLowerCase();
      return targetText.includes(keyword);
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start - b.start;
    });

  if (results.length === 0) {
    els.searchResults.innerHTML = `<p class="empty-text">검색 결과가 없습니다.</p>`;
    return;
  }

  els.searchResults.innerHTML = results.map(event => {
    const category = getCategory(event.categoryId);

    return `
      <div class="search-card" data-date="${event.date}" data-id="${event.id}">
        <strong>${escapeHTML(event.title)}</strong>
        <span>${getKoreanDateLabel(event.date)} · ${minutesToTime(event.start)} - ${minutesToTime(event.end)}</span>
        <span>${escapeHTML(category.name)}${event.repeat && event.repeat !== "none" ? ` · ${getRepeatLabel(event.repeat)}` : ""}</span>
        ${event.memo ? `<span>${escapeHTML(event.memo)}</span>` : ""}
      </div>
    `;
  }).join("");
}

function changeDate(amount) {
  resetForm();

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

function closeAllSectionsOnMobile() {
  if (!window.matchMedia("(max-width: 900px)").matches) return;

  document.querySelectorAll(".collapsible-section").forEach(section => {
    section.classList.remove("open");

    const icon = section.querySelector(".toggle-icon");
    if (icon) icon.textContent = "+";
  });
}

function renderAll() {
  renderCategoryControls();
  renderSchedule();
  renderSearchResults();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(error => {
      console.log("Service Worker registration failed:", error);
    });
  });
}

els.sectionToggles.forEach(button => {
  button.addEventListener("click", () => toggleSection(button.dataset.toggle));
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

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && els.eventModal.classList.contains("open")) {
    resetForm();
    closeEventModal();
  }
});

els.saveEventBtn.addEventListener("click", saveEvent);

els.cancelEditBtn.addEventListener("click", () => {
  resetForm();
  closeEventModal();
});

els.clearDayBtn.addEventListener("click", clearSelectedDate);

els.deleteEditingBtn.addEventListener("click", () => {
  if (!editingEventId) return;
  deleteEvent(editingEventId);
});

els.addCategoryBtn.addEventListener("click", addCategory);

els.categoryList.addEventListener("click", event => {
  const button = event.target.closest("button[data-category-id]");
  if (!button) return;
  deleteCategory(button.dataset.categoryId);
});

els.searchInput.addEventListener("input", renderSearchResults);

els.searchResults.addEventListener("click", event => {
  const card = event.target.closest(".search-card");
  if (!card) return;

  selectedDate = card.dataset.date;
  els.datePicker.value = selectedDate;
  viewMode = "day";
  resetForm();
  closeEventModal();
  renderSchedule();
});

els.schedule.addEventListener("click", event => {
  const monthCell = event.target.closest(".month-cell[data-date]");
  if (monthCell) {
    selectedDate = monthCell.dataset.date;
    els.datePicker.value = selectedDate;
    viewMode = "day";
    resetForm();
    closeEventModal();
    renderSchedule();
    return;
  }

  const eventCard = event.target.closest(".event[data-event-id]");
  if (!eventCard) return;
  startEditEvent(eventCard.dataset.eventId);
});

els.datePicker.addEventListener("change", event => {
  selectedDate = event.target.value;
  resetForm();
  closeEventModal();
  renderSchedule();
});

els.prevDateBtn.addEventListener("click", () => changeDate(-1));
els.nextDateBtn.addEventListener("click", () => changeDate(1));

els.todayBtn.addEventListener("click", () => {
  selectedDate = getTodayString();
  els.datePicker.value = selectedDate;
  resetForm();
  closeEventModal();
  renderSchedule();
});

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

createTimeOptions();
els.datePicker.value = selectedDate;
renderAll();
closeAllSectionsOnMobile();
registerServiceWorker();
