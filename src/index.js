// DateTimePicker.js - Vanilla JS DateTime Picker with self-contained styling + action buttons
// No dependencies required.

const DEFAULTS = {
  minuteStep: 5, // 1,2,5,10,15,30
  startOfWeek: 0, // 0=Sunday .. 6=Saturday
  defaultHour: 9,
  defaultMinute: 0,
  format: (date) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
  },
  parse: (str) => {
    if (!str) {
      return null;
    }
    const d = new Date(str);
    if (!isNaN(d)) {
      return d;
    }
    const m = str.match(/^\s*(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?\s*$/);
    if (m) {
      const [_, y, mo, dd, hh, mi, ss] = m;
      const dt = new Date(+y, +mo - 1, +dd, +hh, +mi, +(ss || 0), 0);
      if (!isNaN(dt)) {
        return dt;
      }
    }
    return null;
  },
  min: null,
  max: null,
  zIndex: 9999,
  // Optional "initial" baseline (programmatic). Reset button uses open-snapshot, not this.
  initial: new Date(),
  // UI options
  highlightToday: true,
  showTimeHeaders: true,
  hourLabel: 'Hours',
  minuteLabel: 'Minutes',
  // Hour list bounds (integers 0..23). Affects scroll list only; not enforced elsewhere.
  hourMin: 0,
  hourMax: 23,
  // If true, the hours list will temporarily include the currently set hour even if it is outside [hourMin,hourMax].
  extendHourBoundsWithCurrent: true,
};

class DateTimePicker {
  constructor(selectorOrElement, options = {}) {
    this.options = {...DEFAULTS, ...options};
    this.instances = [];

    // Normalize date min/max if strings like "YYYY-MM-DD" are passed
    if (typeof this.options.min === 'string') {
      this.options.min = parseDateOnly(this.options.min);
    }
    if (typeof this.options.max === 'string') {
      this.options.max = parseDateOnly(this.options.max);
    }

    // Normalize hour list bounds to integers within 0..23 and ensure order
    let hMin = clampHour(this.options.hourMin);
    let hMax = clampHour(this.options.hourMax);
    if (hMax < hMin) {
      const t = hMin;
      hMin = hMax;
      hMax = t;
    }
    this._hourMin = hMin;
    this._hourMax = hMax;

    if (typeof selectorOrElement === 'string') {
      document.querySelectorAll(selectorOrElement).forEach((el) => {
        if (el instanceof HTMLInputElement) {
          this.instances.push(this._attach(el));
        }
      });
    } else if (selectorOrElement instanceof HTMLInputElement) {
      this.instances.push(this._attach(selectorOrElement));
    }
  }

  destroy() {
    this.instances.forEach((i) => i.destroy());
    this.instances = [];
  }

  _attach(input) {
    const state = {
      input,
      popover: null,
      open: false,
      // initial baseline (programmatic API)
      initial: this.options.initial instanceof Date && !isNaN(this.options.initial)
        ? new Date(this.options.initial)
        : null,
      // snapshot of value before opening (used by Reset button)
      openSnapshot: null,

      selected: this.options.parse(input.value) || null,
      viewDate: this._getInitialViewDate(input),
      focusDate: null,

      // time tracking
      hour: null,
      minute: null,
      timeSet: false, // whether user-specified (or parsed) time exists

      id: this._uid(),
      onDocClick: null,
      onScroll: null,
      onResize: null,
      onKeydown: null,
      measured: false,

      // prevent instant re-open when input regains focus (e.g., after Esc)
      suppressOpenUntil: 0,
    };

    const step = Math.max(1, Number(this.options.minuteStep) || 5);

    // Initialize time
    if (state.selected) {
      state.hour = state.selected.getHours();
      state.minute = state.selected.getMinutes();
      state.timeSet = true;
    } else {
      // Not set yet: use defaults for display, but mark not "timeSet"
      state.hour = clampInt(this.options.defaultHour, 0, 23);
      state.minute = clampInt(Math.round(this.options.defaultMinute / step) * step, 0, 59);
      state.timeSet = false;
    }

    // If input is empty but an initial date is provided, apply it immediately
    if (!input.value && state.initial) {
      state.selected = new Date(state.initial);
      state.viewDate = new Date(state.initial.getFullYear(), state.initial.getMonth(), 1);
      state.hour = state.initial.getHours();
      state.minute = state.initial.getMinutes();
      state.timeSet = true;
      input.value = this.options.format(state.selected);
    }

    const openHandler = (e) => {
      // Guard: if we just closed (e.g., via Esc), don't reopen immediately on focus
      if (Date.now() < state.suppressOpenUntil) {
        return;
      }
      if (e.type === 'focus' && state.inputFieldFocused && e.target === input) {
        return;
      }
      e.stopPropagation();
      this.open(state);
    };
    input.addEventListener('focus', openHandler);
    input.addEventListener('focusout', (e) => {
      if (e.target === input) {
        // If input is currently empty, also apply it now
        if (!state.input.value) {
          state.selected = new Date(state.initial);
        }
        input.value = this.options.format(state.selected);
        if (state.inputFieldFocused) {
          state.inputFieldFocused = false;
          this.close(state);
        }
      }
    });
    input.addEventListener('click', openHandler);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && !state.open) {
        e.preventDefault();
        this.open(state);
      }
    });

    // Keep picker in sync when user types
    const onInputSync = () => this._syncFromInput(state);
    input.addEventListener('input', onInputSync);

    return {
      destroy: () => {
        input.removeEventListener('focus', openHandler);
        input.removeEventListener('click', openHandler);
        input.removeEventListener('input', onInputSync);
        this._detachPopover(state);
      },
      open: () => this.open(state),
      close: () => this.close(state),
      setDate: (date) => {
        if (date instanceof Date && !isNaN(date)) {
          state.selected = new Date(date);
          state.viewDate = new Date(date);
          state.hour = date.getHours();
          state.minute = date.getMinutes();
          state.timeSet = true;
          if (state.open) {
            this._render(state);
          }
          input.value = this.options.format(state.selected);
        }
      },
      getDate: () => (state.selected ? new Date(state.selected) : null),

      // Programmatic initial baseline
      setInitial: (dateOrNull) => {
        if (dateOrNull == null) {
          state.initial = null;
        } else if (dateOrNull instanceof Date && !isNaN(dateOrNull)) {
          state.initial = new Date(dateOrNull);
          // If input is currently empty, also apply it now
          if (!state.input.value) {
            state.selected = new Date(state.initial);
            state.viewDate = new Date(state.initial.getFullYear(), state.initial.getMonth(), 1);
            state.hour = state.initial.getHours();
            state.minute = state.initial.getMinutes();
            state.timeSet = true;
            state.input.value = this.options.format(state.selected);
          }
        }
      },
      getInitial: () => (state.initial ? new Date(state.initial) : null),

      // Programmatic clear (same as Clear button)
      clear: () => this._actionClear(state),
    };
  }

  open(state) {
    if (state.open) {
      return;
    }
    // Take snapshot of the exact value before opening (for Reset button)
    state.openSnapshot = this.options.parse(state.input.value);

    // Ensure the picker reflects the latest typed value at open time
    this._syncFromInput(state, {render: false});

    state.open = true;

    this._buildPopover(state);
    this._render(state);
    this._positionPopover(state, true); // measure once on open

    state.onDocClick = (e) => {
      if (!state.popover) {
        return;
      }
      const t = e.target;
      if (t === state.input) {
        state.inputFieldFocused = true;
        return;
      }
      if (!state.popover.contains(t)) {
        this.close(state);
      }
    };
    document.addEventListener('mousedown', state.onDocClick, true);

    state.onScroll = (e) => {
      if (state.popover && e && e.target && state.popover.contains(e.target)) {
        return;
      }
      this._positionPopover(state, false);
    };
    state.onResize = () => this._positionPopover(state, true);

    window.addEventListener('scroll', state.onScroll, {passive: true});
    window.addEventListener('resize', state.onResize);

    state.onKeydown = (e) => this._handleKeydown(state, e);
    state.popover.addEventListener('keydown', state.onKeydown);
  }

  close(state) {
    if (!state.open) {
      return;
    }
    state.open = false;
    // Remove key handler from popover
    if (state.popover && state.onKeydown) {
      state.popover.removeEventListener('keydown', state.onKeydown);
    }
    this._detachPopover(state);

    document.removeEventListener('mousedown', state.onDocClick, true);
    window.removeEventListener('scroll', state.onScroll);
    window.removeEventListener('resize', state.onResize);
    state.onDocClick = state.onScroll = state.onResize = state.onKeydown = null;
    state.measured = false;

    // Note: we intentionally DO NOT move focus back to the input here to avoid reopening
  }

  _buildPopover(state) {
    const pop = document.createElement('div');
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('tabindex', '-1');
    pop.className = 'vdtp-pop';
    pop.style.zIndex = String(this.options.zIndex);

    pop.innerHTML = `
        <div class="vdtp-wrap">
          <div class="vdtp-calendar">
            <div class="vdtp-head">
              <div data-ref="caption"></div>
              <div class="vdtp-nav">
                <button type="button" class="vdtp-navbtn vdtp-navbtn--prev" aria-label="Previous month" data-ref="prev">
                  <svg width="14" height="14" viewBox="0 0 15 15" aria-hidden="true"><path d="M8.84 3.14c.2.19.21.51.02.7L5.44 7.5l3.42 3.66c.19.2.18.52-.02.7-.2.2-.52.19-.7-.02l-3.75-4c-.18-.19-.18-.49 0-.68l3.75-4c.2-.2.52-.21.7-.02Z" fill="currentColor"/></svg>
                </button>
                <button type="button" class="vdtp-navbtn vdtp-navbtn--next" aria-label="Next month" data-ref="next">
                  <svg width="14" height="14" viewBox="0 0 15 15" aria-hidden="true"><path d="M6.16 3.14c.2-.19.52-.18.7.02l3.75 4c.18.19.18.49 0 .68l-3.75 4c-.18.21-.5.22-.7.02-.2-.18-.21-.5-.02-.7L9.56 7.5 6.14 3.84c-.19-.19-.18-.51.02-.7Z" fill="currentColor"/></svg>
                </button>
              </div>
            </div>
            <div class="vdtp-grid" role="grid" data-ref="grid">
              <div class="vdtp-weekdays" data-ref="weekdays"></div>
              <div class="vdtp-weeks" data-ref="tbody"></div>
            </div>

            <div class="vdtp-actions">
              <div class="vdtp-actions-left">
                <button type="button" class="vdtp-btn" data-ref="btn-today">Today</button>
                <button type="button" class="vdtp-btn" data-ref="btn-now">Now</button>
              </div>
              <div class="vdtp-actions-right">
                <button type="button" class="vdtp-btn" data-ref="btn-reset">Reset</button>
                <button type="button" class="vdtp-btn" data-ref="btn-clear">Clear</button>
              </div>
            </div>
          </div>

          <div class="vdtp-cols">
            <div class="vdtp-colwrap">
              <div style="flex:1;">
                <div class="vdtp-colheader" data-ref="hours-header"></div>
                <div class="vdtp-col" data-ref="hours"></div>
              </div>
              <div style="flex:1;">
                <div class="vdtp-colheader" data-ref="minutes-header"></div>
                <div class="vdtp-col" data-ref="minutes"></div>
              </div>
            </div>
          </div>
        </div>
      `;

    document.body.appendChild(pop);
    state.popover = pop;

    // Month nav
    pop.querySelector('[data-ref="prev"]').addEventListener('click', () => {
      state.viewDate = this._addMonths(state.viewDate, -1);
      this._render(state);
    });
    pop.querySelector('[data-ref="next"]').addEventListener('click', () => {
      state.viewDate = this._addMonths(state.viewDate, 1);
      this._render(state);
    });

    // Actions
    pop.querySelector('[data-ref="btn-today"]').addEventListener('click', () => this._actionToday(state));
    pop.querySelector('[data-ref="btn-now"]').addEventListener('click', () => this._actionNow(state));
    pop.querySelector('[data-ref="btn-reset"]').addEventListener('click', () => this._actionReset(state));
    pop.querySelector('[data-ref="btn-clear"]').addEventListener('click', () => this._actionClear(state));

    // Time headers toggle and labels
    const hh = pop.querySelector('[data-ref="hours-header"]');
    const mh = pop.querySelector('[data-ref="minutes-header"]');
    if (this.options.showTimeHeaders) {
      hh.textContent = this.options.hourLabel;
      mh.textContent = this.options.minuteLabel;
      hh.style.display = '';
      mh.style.display = '';
    } else {
      hh.style.display = 'none';
      mh.style.display = 'none';
    }
  }

  _detachPopover(state) {
    if (state.popover && state.popover.parentNode) {
      state.popover.parentNode.removeChild(state.popover);
    }
    state.popover = null;
  }

  _render(state) {
    if (!state.popover) {
      return;
    }
    this._renderCaption(state);
    this._renderWeekdays(state);
    this._renderDays(state);
    this._renderHours(state);
    this._renderMinutes(state);
    this._focusSelectedDay(state);
  }

  _renderCaption(state) {
    const cap = state.popover.querySelector('[data-ref="caption"]');
    const dt = state.viewDate;
    const fmt = new Intl.DateTimeFormat(undefined, {month: 'long', year: 'numeric'});
    cap.textContent = fmt.format(dt);
    cap.id = `vdtp-caption-${state.id}`;
    const grid = state.popover.querySelector('[data-ref="grid"]');
    grid.setAttribute('aria-labelledby', cap.id);
  }

  _renderWeekdays(state) {
    const wrap = state.popover.querySelector('[data-ref="weekdays"]');
    wrap.innerHTML = '';
    const fmtShort = new Intl.DateTimeFormat(undefined, {weekday: 'short'});
    const fmtLong = new Intl.DateTimeFormat(undefined, {weekday: 'long'});
    for (let i = 0; i < 7; i++) {
      const dayIndex = (i + this.options.startOfWeek) % 7;
      const ref = new Date(2021, 7, 1 + dayIndex);
      const el = document.createElement('div');
      el.className = 'vdtp-weekday';
      el.setAttribute('aria-label', fmtLong.format(ref));
      el.textContent = fmtShort.format(ref).slice(0, 2);
      wrap.appendChild(el);
    }
  }

  _renderDays(state) {
    const tbody = state.popover.querySelector('[data-ref="tbody"]');
    tbody.innerHTML = '';

    const firstOfMonth = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), 1);
    const daysInMonth = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 0).getDate();
    const startWeekday = (firstOfMonth.getDay() - this.options.startOfWeek + 7) % 7;

    const prevMonth = this._addMonths(state.viewDate, -1);
    const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) {
      const dayNum = daysInPrevMonth - startWeekday + 1 + i;
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dayNum);
      cells.push({date, outside: true});
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth(), d);
      cells.push({date, outside: false});
    }
    const trailing = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= trailing; i++) {
      const date = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, i);
      cells.push({date, outside: true});
    }

    const selDate = state.selected ? new Date(state.selected) : null;
    const today = new Date();
    const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

    for (let i = 0; i < cells.length; i += 7) {
      const row = document.createElement('div');
      row.className = 'vdtp-week';

      for (let j = 0; j < 7; j++) {
        const cell = cells[i + j];
        const holder = document.createElement('div');
        holder.className = 'vdtp-cell';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'vdtp-day';
        btn.textContent = String(cell.date.getDate());
        btn.role = 'gridcell';
        btn.setAttribute('data-date', cell.date.toISOString());

        if (cell.outside) {
          btn.classList.add('vdtp-day--outside');
        }

        // mark today if enabled
        if (this.options.highlightToday &&
          cell.date.getFullYear() === todayY &&
          cell.date.getMonth() === todayM &&
          cell.date.getDate() === todayD) {
          btn.classList.add('vdtp-day--today');
          btn.setAttribute('aria-current', 'date');
        }

        const isSelected =
          selDate &&
          cell.date.getFullYear() === selDate.getFullYear() &&
          cell.date.getMonth() === selDate.getMonth() &&
          cell.date.getDate() === selDate.getDate() &&
          !cell.outside;

        if (isSelected) {
          btn.setAttribute('aria-selected', 'true');
          btn.tabIndex = 0;
        } else {
          btn.removeAttribute('aria-selected');
          btn.tabIndex = -1;
        }

        const disabled = this._isOutOfRange(cell.date);
        if (disabled) {
          btn.disabled = true;
        }

        btn.addEventListener('click', () => {
          if (disabled) {
            return;
          }
          const h = state.timeSet ? (state.hour ?? this.options.defaultHour) : this.options.defaultHour;
          const m = state.timeSet ? (state.minute ?? this.options.defaultMinute) : this.options.defaultMinute;
          state.selected = new Date(
            cell.date.getFullYear(),
            cell.date.getMonth(),
            cell.date.getDate(),
            h,
            m,
            0,
            0
          );
          state.hour = h;
          state.minute = m;
          state.viewDate = new Date(cell.date.getFullYear(), cell.date.getMonth(), 1);
          this._applyToInput(state);
          this._render(state);
        });

        holder.appendChild(btn);
        row.appendChild(holder);
      }

      tbody.appendChild(row);
    }
  }

  _renderHours(state) {
    const wrap = state.popover.querySelector('[data-ref="hours"]');
    wrap.innerHTML = '';

    // Base hour bounds from options
    let minHour = this._hourMin;
    let maxHour = this._hourMax;

    // Optionally extend bounds to include the currently set hour (so it remains visible/selectable)
    if (this.options.extendHourBoundsWithCurrent && typeof state.hour === 'number') {
      if (state.hour < minHour) {
        minHour = state.hour;
      }
      if (state.hour > maxHour) {
        maxHour = state.hour;
      }
    }

    const activeHour = state.hour ?? this.options.defaultHour;

    for (let h = minHour; h <= maxHour; h++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vdtp-pill';
      btn.role = 'option'
      btn.textContent = String(h).padStart(2, '0');
      if (h === activeHour) {
        btn.setAttribute('aria-current', 'true');
      }
      btn.addEventListener('click', () => {
        state.hour = h;
        state.timeSet = true;
        if (state.selected) {
          state.selected.setHours(h);
        } else {
          state.selected = new Date(
            state.viewDate.getFullYear(),
            state.viewDate.getMonth(),
            new Date().getDate(),
            h,
            state.minute ?? this.options.defaultMinute,
            0,
            0
          );
        }
        this._applyToInput(state);
        this._renderHours(state);
        this._renderDays(state);
      });
      wrap.appendChild(btn);
    }

    // Ensure the selected hour pill is visible even without focus
    this._scrollHourIntoView(state);
  }

  _renderMinutes(state) {
    const wrap = state.popover.querySelector('[data-ref="minutes"]');
    wrap.innerHTML = '';

    const step = Math.max(1, Number(this.options.minuteStep) || 5);
    const activeMinute = state.minute ?? this.options.defaultMinute;

    // Minutes list always shows full 0..59 by step and selected minute
    const minuteValueCount = Math.max(0, Math.floor(60 / step));
    let minuteValues = Array.from({length: minuteValueCount}, (_, i) => i * step);
    minuteValues.push(state.minute);
    minuteValues = [...new Set(minuteValues)].sort((a, b) => a - b);
    for (const m of minuteValues) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vdtp-pill';
      btn.role = 'option'
      btn.textContent = String(m).padStart(2, '0');
      if (m === activeMinute) {
        btn.setAttribute('aria-current', 'true');
      }
      btn.addEventListener('click', () => {
        state.minute = m;
        state.timeSet = true;
        if (state.selected) {
          state.selected.setMinutes(m);
        } else {
          state.selected = new Date(
            state.viewDate.getFullYear(),
            state.viewDate.getMonth(),
            new Date().getDate(),
            state.hour ?? this.options.defaultHour,
            m,
            0,
            0
          );
        }
        this._applyToInput(state);
        this._renderMinutes(state);
        this._renderDays(state);
      });
      wrap.appendChild(btn);
    }

    // Ensure the selected minute pill is visible even without focus
    this._scrollMinuteIntoView(state);
  }

  _actionToday(state) {
    const now = new Date();
    const h = state.timeSet ? (state.hour ?? this.options.defaultHour) : this.options.defaultHour;
    const m = state.timeSet ? (state.minute ?? this.options.defaultMinute) : this.options.defaultMinute;
    state.selected = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    state.hour = h;
    state.minute = m;
    state.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this._applyToInput(state);
    this._render(state);
  }

  _actionNow(state) {
    const now = new Date();
    state.selected = new Date(now);
    state.hour = now.getHours();
    state.minute = now.getMinutes();
    state.timeSet = true;
    state.viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this._applyToInput(state);
    this._render(state);
  }

  _actionReset(state) {
    const snap = state.openSnapshot;
    if (snap && !isNaN(snap)) {
      state.selected = new Date(snap);
      state.hour = snap.getHours();
      state.minute = snap.getMinutes();
      state.timeSet = true;
      state.viewDate = new Date(snap.getFullYear(), snap.getMonth(), 1);
      this._applyToInput(state);
    } else {
      // If snapshot was empty or invalid, clear
      state.selected = null;
      state.timeSet = false;
      state.hour = clampInt(this.options.defaultHour, 0, 23);
      const step = Math.max(1, Number(this.options.minuteStep) || 5);
      state.minute = clampInt(Math.round(this.options.defaultMinute / step) * step, 0, 59);
      state.input.value = '';
      state.input.dispatchEvent(new window.Event('input', {bubbles: true}));
      state.input.dispatchEvent(new window.Event('change', {bubbles: true}));
      state.viewDate = new Date();
    }
    this._render(state);
  }

  _actionClear(state) {
    state.selected = null;
    state.timeSet = false;
    state.hour = clampInt(this.options.defaultHour, 0, 23);
    const step = Math.max(1, Number(this.options.minuteStep) || 5);
    state.minute = clampInt(Math.round(this.options.defaultMinute / step) * step, 0, 59);
    state.input.value = '';
    state.input.dispatchEvent(new window.Event('input', {bubbles: true}));
    state.input.dispatchEvent(new window.Event('change', {bubbles: true}));
    this._render(state);
  }

  _focusSelectedDay(state) {
    const selectedBtn = state.popover.querySelector('.vdtp-day[aria-selected="true"]');
    if (selectedBtn && !state.inputFieldFocused) {
      selectedBtn.focus({preventScroll: true});
      state.focusDate = this._getDateFromDayButton(state, selectedBtn);
      return;
    }
    const first = state.popover.querySelector('.vdtp-day:not(.vdtp-day--outside):not([disabled])');
    if (first) {
      first.tabIndex = 0;
    }
  }

  // Focus helper: selected hour (aria-current) or first hour button
  _focusSelectedHour(state) {
    if (!state.popover) {
      return;
    }
    const hoursWrap = state.popover.querySelector('[data-ref="hours"]');
    if (!hoursWrap) {
      return;
    }
    const current = hoursWrap.querySelector('.vdtp-pill[aria-current="true"]');
    const target = current || hoursWrap.querySelector('.vdtp-pill');
    if (target) {
      target.focus({preventScroll: false});
      // Ensure visible
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({block: 'nearest', inline: 'nearest'});
      }
    }
  }

  // Focus helper: selected minute (aria-current) or first minute button
  _focusSelectedMinute(state) {
    if (!state.popover) {
      return;
    }
    const minutesWrap = state.popover.querySelector('[data-ref="minutes"]');
    if (!minutesWrap) {
      return;
    }
    const current = minutesWrap.querySelector('.vdtp-pill[aria-current="true"]');
    const target = current || minutesWrap.querySelector('.vdtp-pill');
    if (target) {
      target.focus({preventScroll: false});
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({block: 'nearest', inline: 'nearest'});
      }
    }
  }

  // Ensure visibility (without moving focus): scroll selected hour into view
  _scrollHourIntoView(state) {
    if (!state.popover) {
      return;
    }
    const hoursWrap = state.popover.querySelector('[data-ref="hours"]');
    if (!hoursWrap) {
      return;
    }
    const current = hoursWrap.querySelector('.vdtp-pill[aria-current="true"]');
    if (current && typeof current.scrollIntoView === 'function') {
      current.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  }

  // Ensure visibility (without moving focus): scroll selected minute into view
  _scrollMinuteIntoView(state) {
    if (!state.popover) {
      return;
    }
    const minutesWrap = state.popover.querySelector('[data-ref="minutes"]');
    if (!minutesWrap) {
      return;
    }
    const current = minutesWrap.querySelector('.vdtp-pill[aria-current="true"]');
    if (current && typeof current.scrollIntoView === 'function') {
      current.scrollIntoView({block: 'nearest', inline: 'nearest'});
    }
  }

  _handleKeydown(state, e) {
    if (!state.open) {
      return;
    }

    // Esc always closes
    if (e.key === 'Escape') {
      this.closeAndGiveFocusToInput(e, state);
      return;
    }

    const active = document.activeElement;
    const inCalendar = state.popover.querySelector('.vdtp-calendar')?.contains(active);
    const hoursWrap = state.popover.querySelector('[data-ref="hours"]');
    const minutesWrap = state.popover.querySelector('[data-ref="minutes"]');
    const inHours = hoursWrap?.contains(active);
    const inMinutes = minutesWrap?.contains(active);

    // Tab navigation: skip action buttons and move Calendar -> Hours -> Minutes
    if (e.key === 'Tab') {
      if (!e.shiftKey) {
        if (inCalendar) {
          e.preventDefault();
          this._focusSelectedHour(state);
          return;
        }
        if (inHours) {
          e.preventDefault();
          this._focusSelectedMinute(state);
          return;
        }
        if (inMinutes) {
          this.closeAndGiveFocusToInput(e, state);
          return;
        }
      } else {
        // Reverse with Shift+Tab: Minutes -> Hours -> Calendar selected day
        if (inCalendar) {
          this.closeAndGiveFocusToInput(e, state);
          return;
        }
        if (inMinutes) {
          e.preventDefault();
          this._focusSelectedHour(state);
          return;
        }
        if (inHours) {
          e.preventDefault();
          this._focusSelectedDay(state);
          return;
        }
      }
      // If Tab pressed outside these areas, let default behavior happen
    }

    if (e.key === 'Enter') {
      if (inCalendar || inHours || inMinutes) {
        this.closeAndGiveFocusToInput(e, state);
        return;
      }
    }

    // Arrow key handling in hour list
    if (inHours) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === '+' || e.key === '-') {
        e.preventDefault();
        const delta = (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === '-') ? -1 : 1;
        this._changeHourBy(state, delta);
        // keep focus on the current hour button after change
        this._focusSelectedHour(state);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        const hMin = clampHour(this.options.hourMin);
        this._setHour(state, state.hour > hMin ? hMin : 0);
        this._focusSelectedHour(state);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        const hMax = clampHour(this.options.hourMax);
        this._setHour(state, state.hour < hMax ? hMax : 23);
        this._focusSelectedHour(state);
        return;
      }
    }

    // Arrow key handling in minute list
    if (inMinutes) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === '+' || e.key === '-') {
        e.preventDefault();
        const step = Math.max(1, Number(this.options.minuteStep) || 5);
        let delta;
        switch (e.key) {
          case 'ArrowUp':
          case 'ArrowLeft':
            delta = -step;
            break;
          case 'ArrowDown':
          case 'ArrowRight':
            delta = step;
            break;
          case '+':
            delta = 1;
            break;
          case '-':
            delta = -1;
            break;
        }
        this._changeMinuteBy(state, delta);
        // keep focus on the current minute button after change
        this._focusSelectedMinute(state);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        this._setMinute(state, 0);
        this._focusSelectedMinute(state);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        const step = Math.max(1, Number(this.options.minuteStep) || 5);
        this._setMinute(state, 60 - step);
        this._focusSelectedMinute(state);
        return;
      }
    }


    // Only hijack Arrow/Page/Home/End keys when user is in calendar area
    if (inCalendar) {
      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault();
          this._selectByDelta(state, -1);
          return;
        }
        case 'ArrowRight': {
          e.preventDefault();
          this._selectByDelta(state, 1);
          return;
        }
        case 'ArrowUp': {
          e.preventDefault();
          this._selectByDelta(state, -7);
          return;
        }
        case 'ArrowDown': {
          e.preventDefault();
          this._selectByDelta(state, 7);
          return;
        }
        case 'PageUp': {
          e.preventDefault();
          this._selectByDelta(state, e.shiftKey ? -365 : -30); // rough month/year jump preserving selection basis
          return;
        }
        case 'PageDown': {
          e.preventDefault();
          this._selectByDelta(state, e.shiftKey ? 365 : 30);
          return;
        }
        case 'Home': {
          e.preventDefault();
          // go to first day of current month from selected
          const base = state.selected || new Date();
          const next = new Date(base.getFullYear(), base.getMonth(), 1);
          this._selectAbsolute(state, next);
          return;
        }
        case 'End': {
          e.preventDefault();
          const base = state.selected || new Date();
          const next = new Date(base.getFullYear(), base.getMonth() + 1, 0);
          this._selectAbsolute(state, next);
          return;
        }
        case 'Enter':
        case ' ': {
          // Already selecting on arrow, but keep activation behavior
          if (active && (active.getAttribute('name') === 'day' || active.classList?.contains('vdtp-day'))) {
            e.preventDefault();
            if (!active.disabled) {
              active.click();
            }
          }
          return;
        }
      }
    }

    switch (e.key) {
      case 'n': {
        e.preventDefault();
        this._actionNow(state);
        if (inHours) {
          this._focusSelectedHour(state);
        }
        if (inMinutes) {
          this._focusSelectedMinute(state);
        }
        return;
      }
      case 't': {
        e.preventDefault();
        this._actionToday(state);
        if (inHours) {
          this._focusSelectedHour(state);
        }
        if (inMinutes) {
          this._focusSelectedMinute(state);
        }
        return;
      }
      case 'c': {
        // Clear button
        // FIXME
        e.preventDefault();
        this._actionClear(state);
        this.closeAndGiveFocusToInput(e, state);
        return;
      }
      case 'r': {
        // Reset button
        e.preventDefault();
        this._actionReset(state);
        return;
      }
    }

    // Otherwise, allow default behavior (e.g., scrolling the lists)
  }

  closeAndGiveFocusToInput(e, state) {
    e.preventDefault();
    state.suppressOpenUntil = Date.now() + 250;
    this.close(state);
    state.input.focus();
  }

  // select relative to current selection, preserving time, skipping disabled dates.
  _selectByDelta(state, deltaDays) {
    // If no selection yet, start from today (clamped to min/max)
    let base = state.selected ? new Date(state.selected) : new Date();
    // Clamp base within min/max bounds if provided
    if (this.options.min && base < this._dateOnly(this.options.min)) {
      const d = this._dateOnly(this.options.min);
      base = new Date(d.getFullYear(), d.getMonth(), d.getDate(), base.getHours(), base.getMinutes(), 0, 0);
    }
    if (this.options.max && base > this._dateOnly(this.options.max)) {
      const d = this._dateOnly(this.options.max);
      base = new Date(d.getFullYear(), d.getMonth(), d.getDate(), base.getHours(), base.getMinutes(), 0, 0);
    }

    // Walk in requested direction until a non-disabled date is found (safety cap)
    const step = deltaDays > 0 ? 1 : -1;
    let target = new Date(base.getFullYear(), base.getMonth(), base.getDate() + deltaDays, base.getHours(), base.getMinutes(), 0, 0);
    let guard = 0;
    while (this._isOutOfRange(target) && guard < 800) {
      target = new Date(target.getFullYear(), target.getMonth(), target.getDate() + step, base.getHours(), base.getMinutes(), 0, 0);
      guard++;
    }
    this._selectAbsolute(state, target);
  }

  // set selection to specific date (preserving time and updating input/render)
  _selectAbsolute(state, dateObj) {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) {
      return;
    }
    const h = state.timeSet ? (state.hour ?? this.options.defaultHour) : this.options.defaultHour;
    const m = state.timeSet ? (state.minute ?? this.options.defaultMinute) : this.options.defaultMinute;

    state.selected = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), h, m, 0, 0);
    state.hour = h;
    state.minute = m;
    state.timeSet = true;

    state.viewDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    this._applyToInput(state);
    this._render(state);

    // Move focus to the new selected day button
    const btn = this._findDayButton(state, state.selected);
    if (btn) {
      btn.focus();
    }
  }

  // Increment/decrement hour while focused in hour list
  _changeHourBy(state, delta) {
    const clampHour = (h) => Math.max(0, Math.min(23, Math.floor(Number(h))));
    const prev = typeof state.hour === 'number' ? state.hour : this.options.defaultHour;
    const next = clampHour(prev + delta);
    this._setHour(state, next);
  }

  _setHour(state, next) {
    // Apply hour list bounds if they would hide the current hour:
    // extendHourBoundsWithCurrent ensures the selected stays visible in the list.
    state.hour = clampInt(next, 0, 23);
    state.timeSet = true;

    if (state.selected) {
      state.selected.setHours(next);
    } else {
      state.selected = new Date(
        state.viewDate.getFullYear(),
        state.viewDate.getMonth(),
        new Date().getDate(),
        next,
        state.minute ?? this.options.defaultMinute,
        0,
        0
      );
    }
    this._applyToInput(state);
    this._renderHours(state);
    this._renderDays(state);
    // Keep the selected hour visible after re-render
    this._scrollHourIntoView(state);
  }

  // Increment/decrement minute while focused in minute list
  _changeMinuteBy(state, delta) {
    const step = Math.abs(delta);
    const prev = typeof state.minute === 'number' ? state.minute : this.options.defaultMinute;
    let next = delta > 0 ? Math.floor(prev / step) * step + delta : Math.ceil(prev / step) * step + delta;

    // Clamp to 0..55; do not wrap
    if (next < 0) {
      next = 0;
    }
    if (next > 59) {
      next = Math.max(60 - step, prev);
    }
    this._setMinute(state, next);
  }

  _setMinute(state, minute) {
    const next = clampInt(minute, 0, 59);
    state.minute = next;
    state.timeSet = true;

    if (state.selected) {
      state.selected.setMinutes(next);
    } else {
      state.selected = new Date(
        state.viewDate.getFullYear(),
        state.viewDate.getMonth(),
        new Date().getDate(),
        state.hour ?? this.options.defaultHour,
        next,
        0,
        0
      );
    }
    this._applyToInput(state);
    this._renderMinutes(state);
    this._renderDays(state);
    // Keep the selected minute visible after re-render
    this._scrollMinuteIntoView(state);
  }

  _findDayButton(state, date) {
    const buttons = state.popover.querySelectorAll('.vdtp-day');
    for (const btn of buttons) {
      const d = this._getDateFromDayButton(state, btn);
      if (d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate()) {
        return btn;
      }
    }
    return null;
  }

  _getDateFromDayButton(state, btn) {
    const dateIsoString = btn.getAttribute('data-date');
    return new Date(dateIsoString);
  }

  _positionPopover(state, measure) {
    if (!state.popover) {
      return;
    }
    const rect = state.input.getBoundingClientRect();
    const pop = state.popover;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;

    let popWidth;
    if (measure || !state.measured) {
      const prevVis = pop.style.visibility;
      pop.style.visibility = 'hidden';
      pop.style.left = '0px';
      pop.style.top = '0px';
      pop.style.maxWidth = 'calc(100vw - 16px)';
      if (!document.body.contains(pop)) {
        document.body.appendChild(pop);
      }
      popWidth = pop.offsetWidth;
      pop.style.visibility = prevVis || 'visible';
      state.measured = true;
    } else {
      popWidth = pop.offsetWidth;
    }

    const top = rect.bottom + scrollY + 6;
    let left = rect.left + scrollX + rect.width / 2 - popWidth / 2;
    left = Math.max(8 + scrollX, Math.min(left, scrollX + window.innerWidth - popWidth - 8));

    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  _applyToInput(state) {
    if (!state.selected) {
      return;
    }
    state.selected.setHours(state.hour ?? this.options.defaultHour);
    state.selected.setMinutes(state.minute ?? this.options.defaultMinute);
    state.selected.setSeconds(0, 0);
    state.input.value = this.options.format(state.selected);
    state.input.dispatchEvent(new window.Event('input', {bubbles: true}));
    state.input.dispatchEvent(new window.Event('change', {bubbles: true}));
  }

  // Sync internal state from the input text the user typed
  _syncFromInput(state, opts = {}) {
    const {render = true} = opts;
    const raw = state.input.value;
    if (!raw) {
      // Empty input -> clear selection, keep defaults for UI
      state.selected = null;
      state.timeSet = false;
      const step = Math.max(1, Number(this.options.minuteStep) || 5);
      state.hour = clampInt(this.options.defaultHour, 0, 23);
      state.minute = clampInt(Math.round(this.options.defaultMinute / step) * step, 0, 59);
      // Keep viewDate around current month for a friendly UI
      state.viewDate = new Date();
      if (state.open && render) {
        this._render(state);
      }
      return;
    }

    const parsed = this.options.parse(raw);
    if (parsed && !isNaN(parsed)) {
      state.selected = new Date(parsed);
      state.hour = parsed.getHours();
      state.minute = parsed.getMinutes();
      state.timeSet = true;
      state.viewDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      if (state.open && render) {
        this._render(state);
      }
    }

    // For partially typed/invalid text, do not change picker state.
    // This avoids fighting the user's typing. We simply leave as-is.
  }

  _isOutOfRange(date) {
    const {min, max} = this.options;
    if (min && date < this._dateOnly(min)) {
      return true;
    }
    // noinspection RedundantIfStatementJS
    if (max && date > this._dateOnly(max)) {
      return true;
    }
    return false;
  }

  _addMonths(date, months) {
    const d = new Date(date.getTime());
    const m = d.getMonth() + months;
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(m);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));
    return d;
  }

  _dateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  _getInitialViewDate(input) {
    return this.options.parse(input.value) || new Date();
  }

  _uid() {
    return Math.random().toString(36).slice(2, 9);
  }
}

// Helpers for date option parsing
function parseDateOnly(str) {
  // Accept "YYYY-MM-DD"
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(str);
  if (!m) {
    return null;
  }
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  const dt = new Date(y, mo, d);
  return isNaN(dt) ? null : dt;
}

function clampInt(n, min, max) {
  n = Math.floor(Number(n));
  if (isNaN(n)) {
    return min;
  }
  return Math.max(min, Math.min(max, n));
}

function clampHour(h) {
  return Math.max(0, Math.min(23, Math.floor(Number(h))));
}

export default DateTimePicker;
