import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';

const CategoryBreakdownCard = ({ categoryBreakdown }) => {
  const topCategory = categoryBreakdown[0];

  return (
    <div className="bg-bg-card rounded-2xl p-3 shadow-sm hover:shadow-md transition-all h-full flex flex-col ">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-text-primary">Category Breakdown</h3>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all text-text-secondary hover:bg-bg-primary">
          <HiOutlineDotsHorizontal className="text-sm" />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="relative h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {topCategory.value.toFixed(1)}%
            </div>
            <div className="text-xs text-text-secondary">
              {topCategory.name}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {categoryBreakdown.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-text-secondary overflow-hidden text-ellipsis whitespace-nowrap">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdownCard;
