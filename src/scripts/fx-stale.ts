import { ageInDays } from '../lib/calc/split';
const el = document.querySelector<HTMLElement>('[data-fx-date]');
if (el && ageInDays(el.dataset.fxDate!, new Date()) > 7) el.hidden = false;
