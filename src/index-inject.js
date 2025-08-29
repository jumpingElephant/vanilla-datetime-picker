import DateTimePicker from './index.js';
import css from './style.css'; // configure bundler to load css as text

function ensureInjectedOnce() {
  if (typeof document === 'undefined') {
    return;
  } // SSR guard
  const markerId = 'vdtp-style';
  if (document.getElementById(markerId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = markerId;
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

ensureInjectedOnce();

export default DateTimePicker;
export {DateTimePicker};
