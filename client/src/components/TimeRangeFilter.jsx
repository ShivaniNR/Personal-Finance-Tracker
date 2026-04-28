import { Calendar } from 'lucide-react';
import { TIME_RANGES } from '../utils/dateRanges';

export const TimeRangeFilter = ({ value, onChange }) => (
  <div className="time-range-filter">
    <Calendar size={16} className="time-range-icon" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="time-range-select"
    >
      {TIME_RANGES.map((range) => (
        <option key={range.value} value={range.value}>
          {range.label}
        </option>
      ))}
    </select>
  </div>
);
