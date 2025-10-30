import { BarChart, Bar, ResponsiveContainer } from 'recharts';

const BalanceCard = ({ balance, balanceHistory }) => {
  return (
    <div className="card card--primary">
      <div className="card__header">
        <div className="card__icon">💰</div>
        <select className="card__filter">
          <option>7 days</option>
          <option>30 days</option>
          <option>90 days</option>
        </select>
      </div>
      <div className="card__body">
        <p className="card__label">Balance</p>
        <h2 className="card__value">${balance.toLocaleString()}</h2>
        <div className="card__chart">
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={balanceHistory}>
              <Bar dataKey="amount" fill="rgba(255, 255, 255, 0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
