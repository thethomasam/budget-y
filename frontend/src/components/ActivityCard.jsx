import { HiOutlineDotsHorizontal } from 'react-icons/hi';

const TopSpendingCard = ({ topSpending }) => {
  // Calculate bubble sizes based on values
  const calculateSize = (value) => {
    const minSize = 80;
    const maxSize = 200;
    const maxValue = Math.max(...topSpending.map((a) => a.value));
    return minSize + (value / maxValue) * (maxSize - minSize);
  };

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Top Spending</h3>
        <div className="card__more">
          <HiOutlineDotsHorizontal />
        </div>
      </div>
      <div className="card__body">
        <div
          style={{
            position: 'relative',
            height: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Food & Dining - Pink (largest) */}
          <div
            style={{
              position: 'absolute',
              width: `${calculateSize(topSpending[0].value)}px`,
              height: `${calculateSize(topSpending[0].value)}px`,
              borderRadius: '50%',
              backgroundColor: topSpending[0].color,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              top: '50%',
              left: '30%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>
              ${topSpending[0].value.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{topSpending[0].name}</div>
          </div>

          {/* Shopping - Yellow (medium) */}
          <div
            style={{
              position: 'absolute',
              width: `${calculateSize(topSpending[1].value)}px`,
              height: `${calculateSize(topSpending[1].value)}px`,
              borderRadius: '50%',
              backgroundColor: topSpending[1].color,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              top: '25%',
              right: '20%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>
              ${topSpending[1].value.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>{topSpending[1].name}</div>
          </div>

          {/* Bills - Blue (small) */}
          <div
            style={{
              position: 'absolute',
              width: `${calculateSize(topSpending[2].value)}px`,
              height: `${calculateSize(topSpending[2].value)}px`,
              borderRadius: '50%',
              backgroundColor: topSpending[2].color,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              bottom: '15%',
              right: '30%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>
              ${topSpending[2].value.toLocaleString()}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>{topSpending[2].name}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopSpendingCard;
