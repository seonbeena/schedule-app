const startHour = 6;
const endHour = 26;
const slotMinutes = 30;
const storageKey = "dayplan-mobile-refactor-v1";

const els = {
  sectionToggles: document.querySelectorAll("[data-toggle]"),
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

  floatingAddBtn: document.getElementById("floatingAddBtn"),
  eventModal: document.getElementById("eventModal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeEventModalBtn: document.getElementById("closeEventModalBtn"),
  eventModalTitle: document.getElementById("eventModalTitle"),
  eventDate: document.getElementById("eventDate"),
  title: document.getElementById("title"),
  categorySelect: document.getElementById("categorySelect"),
  memo: document.getElementById("memo"),
  start: document.getElementById("start"),
  end: document.getElementById("end"),
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

function loadAppData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return {
      categories: Array.isArray(saved?.categories) ? saved.categories : [],
      events: Array.isArray(saved?.events) ? saved.events : []
    };
  } catch {
    return { categories: [], events: [] };
  }
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
  els.start.innerHTML = "";
  els.end.innerHTML = "";

  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += slotMinutes) {
    const label = minutesToTime(minutes);
    els.start.add(new Option(label, String(minutes)));
    els.end.add(new Option(label, String(minutes)));
  }

  els.start.value = String(9 * 60);
  els.end.value = String(10 * 60);
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

function getVisibleEventsForDate(dateString) {
  const events = getEventsForDate(dateString);
  if (els.typeFilter.value === "all") return events;
  return events.filter(event => event.categoryId === els.typeFilter.value);
}

function hasOverlap(dateString, start, end, ignoreId = null) {
  return getEventsForDate(dateString).some(event => {
    if (event.id === ignoreId) return false;
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
      <button class="category-delete-btn" type="button" data-category-id="${category.id}">삭제</button>
    </div>
  `).join("");
}

function renderEventBlock(event) {
  const category = getCategory(event.categoryId);
  const slots = Math.max(1, (event.end - event.start) / slotMinutes);
  const height = slots * 38 - 6;

  return `
    <div class="event" data-event-id="${event.id}" style="height:${height}px; background:${category.color};">
      <div class="event-title">${escapeHTML(event.title)}</div>
      <div class="event-time">${minutesToTime(event.start)} - ${minutesToTime(event.end)}</div>
      ${event.memo ? `<div class="event-memo">${escapeHTML(event.memo)}</div>` : ""}
    </div>
  `;
}

function renderDayView() {
  const events = getVisibleEventsForDate(selectedDate);
  els.schedule.className = "schedule-body day-grid";
  els.schedule.innerHTML = "";

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += slotMinutes) {
    const timeCell = document.createElement("div");
    timeCell.className = "time-cell";
    timeCell.textContent = minutesToTime(minutes);

    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.time = String(minutes);

    const event = events.find(item => item.start === minutes);
    if (event) slot.innerHTML = renderEventBlock(event);

    els.schedule.append(timeCell, slot);
  }
}

function renderWeekView() {
  const week = getWeekDates(selectedDate);
  els.schedule.className = "schedule-body week-list";
  els.schedule.innerHTML = week.map(date => {
    const events = getVisibleEventsForDate(date);
    const list = events.length
      ? events.map(event => {
          const category = getCategory(event.categoryId);
          return `
            <div class="week-event" data-event-id="${event.id}">
              <span class="week-event-dot" style="background:${category.color}"></span>
              <span>${minutesToTime(event.start)} ${escapeHTML(event.title)}</span>
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

  els.schedule.className = "schedule-body month-grid";
  els.schedule.innerHTML = dayNames.map(day => `<div class="month-day-name">${day}</div>`).join("");

  els.schedule.innerHTML += dates.map(date => {
    const parsed = parseDate(date);
    const events = getVisibleEventsForDate(date);
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

  const total = getEventsForDate(selectedDate).length;
  const visible = getVisibleEventsForDate(selectedDate).length;
  els.eventCount.textContent = els.typeFilter.value === "all" ? `${total}개 일정` : `${visible}/${total}개 일정`;

  els.dayViewBtn.classList.toggle("active", viewMode === "day");
  els.weekViewBtn.classList.toggle("active", viewMode === "week");
  els.monthViewBtn.classList.toggle("active", viewMode === "month");
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
        <span>${getKoreanDateLabel(event.date)} · ${minutesToTime(event.start)} - ${minutesToTime(event.end)}</span>
        <span>${escapeHTML(category.name)}${event.repeat !== "none" ? ` · ${getRepeatLabel(event.repeat)}` : ""}</span>
      </div>
    `;
  }).join("");
}

function renderAll() {
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
    color
  });

  els.newCategoryName.value = "";
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
  els.title.value = "";
  els.memo.value = "";
  els.categorySelect.value = appData.categories[0]?.id || "";
  els.start.value = String(9 * 60);
  els.end.value = String(10 * 60);
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
  els.title.value = event.title;
  els.categorySelect.value = event.categoryId;
  els.memo.value = event.memo || "";
  els.start.value = String(event.start);
  els.end.value = String(event.end);
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

  if (hasOverlap(eventDateValue, start, end, editingEventId)) {
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

els.sectionToggles.forEach(button => {
  button.addEventListener("click", () => {
    const section = document.querySelector(`[data-section="${button.dataset.toggle}"]`);
    const willOpen = !section.classList.contains("open");

    document.querySelectorAll(".tool-section").forEach(item => {
      item.classList.remove("open");
      item.querySelector(".toggle-icon").textContent = "+";
    });

    if (willOpen) {
      section.classList.add("open");
      section.querySelector(".toggle-icon").textContent = "−";
    }
  });
});

els.addCategoryBtn.addEventListener("click", addCategory);

els.categoryList.addEventListener("click", event => {
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
renderAll();
registerServiceWorker();
