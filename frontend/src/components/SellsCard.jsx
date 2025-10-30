import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const ExpenseByCategoryCard = ({ categories }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: '#2C3E50',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <div>{payload[0].payload.name}</div>
          <div>${payload[0].value}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__icon card__icon--pink">📊</div>
        <select className="card__filter card__filter--default">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Year</option>
        </select>
      </div>
      <div className="card__body">
        <p className="card__label" style={{ color: 'var(--text-secondary)' }}>
          Expenses by Category
        </p>
        <h2 className="card__value" style={{ color: 'var(--text-primary)' }}>
          ${categories.reduce((sum, cat) => sum + cat.amount, 0).toLocaleString()}
        </h2>
        <div className="card__chart" style={{ marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={categories} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(91, 111, 237, 0.1)' }} />
              <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                {categories.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="amount" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ExpenseByCategoryCard;
