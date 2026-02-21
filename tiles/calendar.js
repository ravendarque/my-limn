import ICAL from "https://esm.sh/ical.js@2";
import { makeTile } from "./utils.js";

const CALENDAR_WINDOWS = ["today", "week", "month", "year"];

function filterAndSort(events, win) {
  const now = new Date();
  return events
    .filter(({ _start }) => {
      if (win === "today") return _start.toDateString() === now.toDateString();
      const days = win === "week" ? 7 : win === "month" ? 30 : 365;
      const cutoffMs = now.getTime() + days * 86_400_000;
      return _start >= now && _start.getTime() <= cutoffMs;
    })
    .sort((a, b) => a._start - b._start);
}

function populateCalendarTile(tile, events) {
  tile.innerHTML = "";
  if (events.length === 0) {
    const empty = document.createElement("p");
    empty.className = "calendar-empty";
    empty.textContent = "No upcoming events.";
    tile.appendChild(empty);
    return;
  }
  events.forEach(({ title, description, location, _start, _end, _allDay }) => {
    const item = document.createElement("div");
    item.className = "calendar-item";

    const dateCol = document.createElement("div");
    dateCol.className = "calendar-item-date";

    const dayEl = document.createElement("div");
    dayEl.className = "calendar-date-day";
    dayEl.textContent = _start.getDate();
    dateCol.appendChild(dayEl);

    const monthEl = document.createElement("div");
    monthEl.className = "calendar-date-month";
    monthEl.textContent = _start.toLocaleDateString(undefined, { month: "short" });
    dateCol.appendChild(monthEl);

    if (!_allDay) {
      const t1 = _start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const t2 = _end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const timeEl = document.createElement("div");
      timeEl.className = "calendar-date-time";
      timeEl.textContent = `${t1}–${t2}`;
      dateCol.appendChild(timeEl);
    }

    item.appendChild(dateCol);

    const details = document.createElement("div");
    details.className = "calendar-item-details";

    const titleEl = document.createElement("div");
    titleEl.className = "calendar-item-title";
    titleEl.textContent = title;
    details.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement("div");
      descEl.className = "calendar-item-desc";
      descEl.textContent = description;
      details.appendChild(descEl);
    }

    if (location) {
      const locEl = document.createElement("div");
      locEl.className = "calendar-item-location";
      locEl.textContent = location;
      details.appendChild(locEl);
    }

    item.appendChild(details);
    tile.appendChild(item);
  });
}

function parseIcs(icsText) {
  const comp = new ICAL.Component(ICAL.parse(icsText));
  return comp.getAllSubcomponents("vevent").map((vevent) => {
    const ev = new ICAL.Event(vevent);
    return {
      title: ev.summary || "(No title)",
      description: ev.description || null,
      location: ev.location || null,
      _allDay: ev.startDate.isDate,
      _start: ev.startDate.toJSDate(),
      _end: ev.endDate.toJSDate(),
    };
  });
}

export function render(tile) {
  const { window: win, items, src } = tile;
  const el = makeTile("calendar");

  if (src) {
    const loading = document.createElement("p");
    loading.className = "calendar-empty";
    loading.textContent = "Loading…";
    el.appendChild(loading);

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${src} (HTTP ${r.status})`);
        return r.text();
      })
      .then((icsText) => populateCalendarTile(el, filterAndSort(parseIcs(icsText), win)))
      .catch((err) => {
        el.innerHTML = "";
        const errEl = document.createElement("p");
        errEl.className = "calendar-empty";
        errEl.textContent = `Calendar error: ${err.message}`;
        el.appendChild(errEl);
      });
  } else {
    const events = (items ?? []).map((item) => ({
      ...item,
      _allDay: !String(item.start).includes("T"),
      _start: new Date(item.start),
      _end: new Date(item.end),
    }));
    populateCalendarTile(el, filterAndSort(events, win));
  }

  return el;
}

export function validate(tile, at) {
  if (!tile.window) throw new Error(`${at} (calendar) missing required field: window`);
  if (!CALENDAR_WINDOWS.includes(tile.window))
    throw new Error(`${at} (calendar) window must be one of: ${CALENDAR_WINDOWS.join(", ")}`);
  if (!tile.src && !Array.isArray(tile.items))
    throw new Error(`${at} (calendar) requires either "src" (.ics file path) or "items" (list)`);
}
