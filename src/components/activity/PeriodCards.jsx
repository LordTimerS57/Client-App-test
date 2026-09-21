import { StatCard } from './StatCard';
import { ACTIVITY_PERIODS } from '../../utils/activity';

export function PeriodCards({ total, totalSub, byPeriod }) {
  return (
    <div className="stat-grid">
      <StatCard label="Total global" value={total} sub={totalSub} accent />
      {ACTIVITY_PERIODS.map(period => (
        <StatCard key={period.key} label={period.label} value={byPeriod[period.key]} />
      ))}
    </div>
  );
}
