import { HiOutlineDotsHorizontal } from 'react-icons/hi';

const CircularProgress = ({ percentage, color }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
      {/* Background circle */}
      <circle
        cx="28"
        cy="28"
        r={radius}
        fill="none"
        stroke="#E1E8ED"
        strokeWidth="6"
      />
      {/* Progress circle */}
      <circle
        cx="28"
        cy="28"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Percentage text */}
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dy="6"
        fontSize="14"
        fontWeight="600"
        fill={color}
        style={{ transform: 'rotate(90deg)', transformOrigin: '28px 28px' }}
      >
        {percentage}%
      </text>
    </svg>
  );
};

const BudgetLimitsCard = ({ budgetGoals }) => {
  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Budget Limits</h3>
        <div className="card__more">
          <HiOutlineDotsHorizontal />
        </div>
      </div>
      <div className="card__body">
        <div className="goals">
          {budgetGoals.map((goal) => (
            <div key={goal.id} className="goal-item">
              <div className="goal-item__info">
                <h4>{goal.name}</h4>
                <p>
                  ${goal.spent} / ${goal.budget} {goal.description}
                </p>
              </div>
              <div className="goal-item__progress">
                <CircularProgress percentage={goal.percentage} color={goal.color} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetLimitsCard;
