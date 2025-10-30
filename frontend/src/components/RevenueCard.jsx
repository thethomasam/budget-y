import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const IncomeCard = ({ income }) => {
  // Generate simple trend data
  const incomeTrend = [
    { day: 1, value: income * 0.85 },
    { day: 2, value: income * 0.88 },
    { day: 3, value: income * 0.92 },
    { day: 4, value: income * 0.95 },
    { day: 5, value: income * 0.97 },
    { day: 6, value: income * 0.99 },
    { day: 7, value: income }
  ];

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon card__icon--yellow">💰</div>
        <select className="card__filter card__filter--default">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="card__body">
        <p className="card__label" style={{ color: 'var(--text-secondary)' }}>Income</p>
        <h2 className="card__value" style={{ color: 'var(--text-primary)' }}>
          ${income.toLocaleString()}
        </h2>
        <div className="card__chart">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={incomeTrend}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFC107" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FFC107" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="natural"
                dataKey="value"
                stroke="#FFC107"
                strokeWidth={3}
                fill="url(#incomeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IncomeCard;
