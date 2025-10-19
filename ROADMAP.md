# 🗺️ Budgety Development Roadmap

## 📊 Feature Prioritization Matrix

| Feature | User Value | Effort | Dependencies | Priority |
|---------|-----------|--------|--------------|----------|
| Basic Visualizations | ⭐⭐⭐⭐⭐ | 🔧🔧 | None | **P0 - Critical** |
| Budget Tracking | ⭐⭐⭐⭐⭐ | 🔧🔧 | Visualizations | **P0 - Critical** |
| Auto-tagging | ⭐⭐⭐⭐⭐ | 🔧🔧 | Transaction history | **P0 - Critical** |
| Expense Calendar | ⭐⭐⭐⭐ | 🔧🔧🔧 | Visualizations | **P1 - High** |
| Savings Projections | ⭐⭐⭐⭐ | 🔧🔧🔧 | Budget tracking | **P1 - High** |
| Weekly Alerts | ⭐⭐⭐⭐ | 🔧 | Budget tracking | **P1 - High** |

---

## 🎯 Implementation Sequence

### **Phase 1: Data Foundation & Basic Analytics** (Week 1-2)
**Goal:** Make the data actionable

#### 1.1 Transaction Analytics API (Foundation)
**What to build:**
- `GET /analytics/summary` - Total spent, category breakdown
- `GET /analytics/by-category` - Spending by category with percentages
- `GET /analytics/by-date-range` - Spending over time
- `GET /analytics/by-card` - Which card you use most

**Why first?**
- Foundation for ALL visualization features
- Simple endpoints, low effort
- Immediately useful for users

**Estimated Time:** 2-3 days

---

#### 1.2 Basic Visualizations (Frontend/API Response)
**What to build:**
- Pie chart: Spending by category
- Bar chart: Spending by card
- Line chart: Spending over time (daily/weekly/monthly)
- Summary cards: Total spent, transaction count, average transaction

**Why now?**
- Makes data visual and understandable
- High user impact
- Builds on analytics foundation

**Tech Stack Suggestions:**
- Backend: Return chart-ready JSON data
- Frontend: Chart.js, Recharts, or Apple Shortcuts visual output

**Estimated Time:** 3-4 days

---

### **Phase 2: Smart Categorization** (Week 3)
**Goal:** Reduce manual work

#### 2.1 Auto-tagging Engine
**What to build:**
- Pattern learning: "Starbucks" → "Coffee & Dining"
- Merchant-to-category mapping table
- Confidence scoring
- Endpoint: `POST /transactions/{id}/tag` with auto-suggestion
- Bulk tagging: `POST /transactions/bulk-tag`

**Implementation Approach:**
```python
# Simple rule-based initially
merchant_patterns = {
    "starbucks": "Coffee & Dining",
    "shell": "Transportation",
    "whole foods": "Groceries",
    # Learn from user's past tags
}

# Future: ML-based (sklearn, simple classifier)
```

**Why now?**
- Users are adding transactions and manually categorizing
- Pain point becomes obvious quickly
- Data exists to build patterns

**Estimated Time:** 4-5 days

---

### **Phase 3: Budget Management** (Week 4-5)
**Goal:** Help users control spending

#### 3.1 Budget Settings & Tracking
**What to build:**
- Budget model in database (category, amount, period)
- `POST /budgets` - Set monthly/weekly category budgets
- `GET /budgets/status` - Current vs budget comparison
- Progress bars showing budget utilization
- Color coding: Green (<70%), Yellow (70-90%), Red (>90%)

**Database Schema:**
```python
class Budget(Base):
    category = Column(String)
    amount = Column(Float)
    period = Column(String)  # weekly, monthly
    start_date = Column(Date)
```

**Estimated Time:** 3-4 days

---

#### 3.2 Budget Alerts & Notifications
**What to build:**
- `GET /budgets/alerts` - List of budget warnings
- Weekly spending summary
- Integration with Apple Shortcuts for notifications

**Example Alert:**
```json
{
  "alert": "You've spent $450 of your $500 dining budget (90%)",
  "category": "Dining",
  "spent": 450,
  "budget": 500,
  "remaining": 50,
  "severity": "warning"
}
```

**Estimated Time:** 2-3 days

---

### **Phase 4: Advanced Visualizations** (Week 6)
**Goal:** Pattern recognition and insights

#### 4.1 Expense Calendar Heatmap
**What to build:**
- Calendar view with daily spending amounts
- Color intensity based on spending
- Click to see transaction details
- `GET /analytics/calendar?year=2025&month=10`

**Visual Example:**
```
October 2025
Mon  Tue  Wed  Thu  Fri  Sat  Sun
     $12  $45  $23  $67  $125 $89   <- Darker = more spending
$34  $56  $78  ...
```

**Why now?**
- Builds on visualization foundation
- Helps identify spending patterns (weekends? paydays?)
- Satisfying to look at

**Estimated Time:** 4-5 days

---

### **Phase 5: Financial Planning** (Week 7-8)
**Goal:** Future-focused decision making

#### 5.1 Savings Projection Calculator
**What to build:**
- Input: Monthly savings amount
- Calculate future value with compound interest
- Compare scenarios: "Coffee daily vs invested"
- Tax calculations (post-tax returns)

**Example API:**
```python
POST /projections/savings
{
  "monthly_amount": 200,
  "annual_return": 0.07,  # 7% return
  "years": 5,
  "tax_rate": 0.25
}

Response:
{
  "total_invested": 12000,
  "future_value": 14356.89,
  "after_tax_value": 13267.67,
  "total_return": 1267.67
}
```

**Estimated Time:** 3-4 days

---

#### 5.2 Investment Scenario Modeling
**What to build:**
- "What if I invested my coffee spending?"
- Compare cutting specific categories
- Visual charts showing growth over time

**Example:**
```
If you cut Coffee spending ($150/month) and invested it:
Year 1: $1,893
Year 5: $10,856
Year 10: $26,129
```

**Estimated Time:** 3-4 days

---

## 📅 Complete Timeline

### **Sprint 1: Foundation** (Weeks 1-2)
- ✅ Analytics API endpoints
- ✅ Basic visualizations (pie, bar, line charts)
- ✅ Summary dashboard

### **Sprint 2: Intelligence** (Week 3)
- ✅ Auto-tagging engine
- ✅ Merchant pattern learning
- ✅ Bulk categorization

### **Sprint 3: Budget Control** (Weeks 4-5)
- ✅ Budget settings & tracking
- ✅ Weekly/monthly limits
- ✅ Budget alerts & notifications

### **Sprint 4: Insights** (Week 6)
- ✅ Expense calendar heatmap
- ✅ Spending pattern analysis
- ✅ Weekly spending reports

### **Sprint 5: Future Planning** (Weeks 7-8)
- ✅ Savings projection calculator
- ✅ Investment scenario modeling
- ✅ After-tax calculations

---

## 🎨 Quick Wins (Can be done anytime)

These are small features that add value without blocking other work:

1. **Transaction search/filter** (1 day)
   - `GET /transactions?merchant=starbucks&category=dining`

2. **Export to CSV** (1 day)
   - `GET /transactions/export?format=csv`

3. **Recurring transaction detection** (2 days)
   - Flag subscriptions automatically

4. **Top merchants report** (1 day)
   - "Where you spend the most"

---

## 🔧 Technical Considerations

### Database Changes Needed

**Phase 1-2:**
```python
# Add to Transaction model
category = Column(String, nullable=True)  # Already exists
notes = Column(String, nullable=True)  # Optional
```

**Phase 3:**
```python
# New Budget model
class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String)  # weekly, monthly
    start_date = Column(Date)
```

**Phase 2:**
```python
# New CategoryPattern model (for auto-tagging)
class CategoryPattern(Base):
    __tablename__ = "category_patterns"
    id = Column(Integer, primary_key=True)
    merchant_pattern = Column(String, nullable=False)
    category = Column(String, nullable=False)
    confidence = Column(Float, default=1.0)
```

### Migrations
```bash
# After each phase, create migrations
alembic revision --autogenerate -m "Add budget tracking tables"
alembic upgrade head
```

---

## 🎯 Success Metrics

Track these to validate each phase:

**Phase 1:**
- ✅ Users can see spending breakdown by category
- ✅ Spending trends are visualized

**Phase 2:**
- ✅ 80%+ of transactions auto-tagged correctly
- ✅ Users spend <5 seconds per transaction

**Phase 3:**
- ✅ Users set budgets for top 3 categories
- ✅ Budget alerts reduce overspending by 20%

**Phase 4:**
- ✅ Users can identify spending patterns
- ✅ Calendar view shows high-spend days

**Phase 5:**
- ✅ Users understand long-term impact of spending
- ✅ Projection calculator used weekly

---

## 💡 Recommendations

### Start Here (This Week):
1. **Analytics API** - Get the data foundation right
2. **Basic Charts** - Make data visual
3. **Auto-tagging** - Reduce friction

### Then Move To:
4. **Budget Tracking** - Add behavior change layer
5. **Calendar View** - Pattern recognition
6. **Projections** - Future thinking

### Don't Start With:
- ❌ Complex ML algorithms (use simple rules first)
- ❌ Perfect UI (focus on functionality)
- ❌ Every edge case (iterate based on real usage)

---

## 🚀 Getting Started

Want to begin implementation? I recommend:

**Option A: Full Stack (Backend + Frontend)**
- Start with Phase 1 analytics endpoints
- Build simple HTML/JS dashboard to visualize

**Option B: API-First**
- Build all backend endpoints
- Test with Swagger/Postman
- Add frontend later

**Option C: Apple Shortcuts Enhanced**
- Return analytics in API responses
- Show spending summary when logging transactions
- "Transaction logged. You've spent $47 on coffee this month."

---

Let me know which phase you'd like to start with, and I can help implement it! 🎨
