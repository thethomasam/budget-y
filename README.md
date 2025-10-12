# 💰 Budgety - Smart Personal Finance Tracker

**Your pocket-sized digital bookkeeper.** Track every tap, swipe, and purchase instantly—no bank APIs, no app switching, no hassle.

## 🎯 The Problem

Managing finances across multiple banks and credit cards is a nightmare:
- ❌ **Multiple Apps**: Chase has one app, Wells Fargo another, Amex yet another—constant app switching
- ❌ **Inconsistent Experience**: Each bank's interface is different, making tracking confusing
- ❌ **No Unified View**: Your Visa spending is here, Mastercard there, Amex somewhere else
- ❌ **Bank API Limitations**: Most banks don't offer APIs, or restrict third-party access
- ❌ **Manual Entry Hell**: Opening each app to log transactions is time-consuming and error-prone

**You need 5 different apps just to see where your money went this month.** 😤

## ✨ The Solution: One Shortcut to Rule Them All

Budgety **unifies ALL your cards through Apple Shortcuts**—no matter which bank they're from:

### 🎪 The Magic: Universal Transaction Capture

Instead of multiple banking apps, you have **ONE Shortcut** that works with:
- 💳 Your Chase Visa
- 💳 Your Wells Fargo Mastercard
- 💳 Your Amex
- 💳 Your local credit union card
- 💳 ANY card from ANY bank

**How it works:**
1. 📱 Right after you tap to pay.
2. 🗣️ Shortcut runs in the background. And adds the transaction to the database.
4. ✅ **Done!** Transaction logged—no app switching, no bank logins, no hassle

### 🎯 Key Benefits

- ✅ **One Interface for All Banks**: Same workflow whether it's Chase, Amex, or any other bank
- ✅ **Bank-Agnostic**: Don't need bank APIs, OAuth, or permission—works with ANY card
- ✅ **Unified Dashboard**: See ALL spending across ALL cards in one place
- ✅ **Instant Logging**: Capture transactions at the point of sale in 5 seconds
- ✅ **Your Data, Your Rules**: Self-hosted, private, secure—no third-party data sharing
- ✅ **Smart Categorization**: Tag and organize spending YOUR way, not the bank's way
- ✅ **Bulk Import**: Import existing transactions from any bank's CSV export

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ installed
- iPhone/iPad with iOS Shortcuts app (for mobile logging)
- Computer and phone on the same WiFi network

### Installation

#### Step 1: Clone and Install
```bash
# Clone the repository
git clone https://github.com/yourusername/budgety-v2.git
cd budgety-v2

# Install dependencies
pip install -r requirements.txt

# Initialize database
alembic upgrade head
```

#### Step 2: Start the Server

For iPhone integration, you need **network access**:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Find your computer's IP address:
```bash
hostname -I
# Example output: 192.168.0.85
```

Your Budgety API is now running at:
- 💻 **On your computer**: `http://localhost:8000`
- 📱 **On your phone**: `http://YOUR_IP_ADDRESS:8000` (e.g., `http://192.168.0.85:8000`)
- 📚 **API Docs**: `http://localhost:8000/docs`

#### Step 3: Set Up iPhone Shortcuts (The Magic ✨)

This is where Budgety shines! Set up a Shortcut to log transactions instantly:

1. Open **Shortcuts** app on your iPhone
2. Tap **+** to create a new shortcut
3. Follow the visual guide below to build your workflow:

**Key Actions:**
- **Receive input**: Accepts transaction text (e.g., from Siri or sharing)
- **Extract data**: Parse amount, merchant, and card from text
- **HTTP POST**: Send to `http://YOUR_IP_ADDRESS:8000/transactions`
- **JSON Body**:
  ```json
  {
    "date": "Current Date",
    "merchant": "Extracted Merchant",
    "amount": "Extracted Amount",
    "card": "Extracted Card",
    "category": "Optional Category"
  }
  ```

**Visual Setup Guide:**

<table>
<tr>
<td width="50%">
<img src="docs/images/shortcut-overview.png" width="100%" alt="Shortcut Workflow">
<p align="center"><em>Step-by-step workflow</em></p>
</td>
<td width="50%">
<img src="docs/images/shortcut-request.png" width="100%" alt="HTTP Request Config">
<p align="center"><em>HTTP request configuration</em></p>
</td>
</tr>
</table>

---

## 💳 How to Use: The Unified Experience

### Real-Time Transaction Logging (Works with ALL Your Cards!)

The beauty of Budgety is **one shortcut handles every card you own**:

1. **At the Point of Sale**: Right after tapping ANY card to pay
2. **Invoke Your Shortcut**:
   - Say "Hey Siri, log transaction"
   - Or tap the Budgety widget from your home screen
3. **Speak naturally**: "Coffee at Starbucks, $5.50, Visa"
4. **Done!** Logged to your unified dashboard

**No matter if it's Chase, Amex, Wells Fargo, or any other bank—same workflow every time.**

### Real-World Scenarios: One Shortcut, Multiple Banks

**Monday Morning - Chase Visa**
```
"Coffee at Starbucks, $5.50, Visa"
→ Logged to unified dashboard
```

**Tuesday Afternoon - Amex**
```
"Lunch at Chipotle, $12.75, Amex"
→ Same shortcut, same dashboard
```

**Wednesday Evening - Wells Fargo Mastercard**
```
"Groceries at Whole Foods, $127.45, Mastercard"
→ Still the same shortcut, same unified view
```

**Result:** All transactions from all banks now live in ONE place, captured the same way every time.

### Why This Changes Everything

**Traditional Approach:**
- ❌ Open Chase app → log Visa transaction
- ❌ Close Chase, open Amex app → log Amex transaction
- ❌ Close Amex, open Wells Fargo app → log Mastercard transaction
- ❌ Open budgeting app → manually enter everything again
- ❌ **Result:** 5-10 minutes per transaction, multiple logins, data scattered everywhere

**Budgety Approach:**
- ✅ One Shortcut → works for ALL cards from ALL banks
- ✅ 5 seconds per transaction
- ✅ No app switching, no logins
- ✅ **Result:** Unified view of ALL spending, captured instantly at point of sale

### Bulk Import from Bank Statements

Have existing transactions? Import them via CSV:

1. Download CSV from your bank
2. Format columns: `date`, `merchant`, `category`, `amount`, `card`
3. Upload via API docs at `http://localhost:8000/docs`
4. Or use curl:
   ```bash
   curl -X POST "http://localhost:8000/upload-csv" -F "file=@statement.csv"
   ```

---

## 🎨 Features

### ✨ Current Features

**🎪 The Unification Layer:**
- 📱 **One Shortcut for All Banks**: Single workflow for Chase, Amex, Wells Fargo, ANY bank
- 💳 **Bank-Agnostic Design**: No APIs needed—works with every card you own
- ⚡ **5-Second Logging**: Capture transactions instantly at point of sale
- 📊 **Unified Dashboard**: ALL cards, ALL banks, ONE view

**🔧 Core Capabilities:**
- 📁 **CSV Import/Export**: Bulk import from any bank's statement format
- 🏷️ **Custom Categories**: Tag transactions YOUR way, not the bank's way
- 🔒 **Self-Hosted & Private**: Your financial data stays on YOUR server
- 🌐 **RESTful API**: Easy integration with spreadsheets, analytics tools, etc.

### 🚧 Coming Soon
- 📈 Spending analytics and visualizations
- 💰 Budget tracking and alerts
- 🔔 Spending notifications
- 📅 Recurring transaction tracking
- 🏦 Multi-currency support

---

## 📡 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API health check |
| `POST` | `/transactions` | Add single transaction |
| `GET` | `/transactions` | List all transactions |
| `DELETE` | `/transactions` | Delete all transactions |
| `POST` | `/upload-csv` | Bulk import from CSV |

### Interactive API Docs
Visit `http://localhost:8000/docs` for full interactive API documentation powered by Swagger UI.

---

## 📋 Data Formats

### Transaction JSON (POST `/transactions`)
```json
{
  "date": "2025-10-12",
  "merchant": "Starbucks",
  "category": "Food & Dining",
  "amount": 5.50,
  "card": "Visa"
}
```

### CSV Format (POST `/upload-csv`)
```csv
date,merchant,category,amount,card
2025-10-12,Starbucks,Food & Dining,5.50,Visa
2025-10-11,Shell,Transportation,45.00,Mastercard
2025-10-10,Amazon,Shopping,89.99,Amex
```

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Migrations**: Alembic
- **API Docs**: Swagger UI / ReDoc
- **Mobile Integration**: iOS Shortcuts

---

## 🤝 Contributing

Budgety is open source! Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 💡 FAQ

**Q: Do I need to keep my computer running all the time?**
A: Only when you want to log transactions from your phone. You can also run it on a Raspberry Pi or cloud server for 24/7 availability.

**Q: Is my financial data secure?**
A: Yes! Budgety is self-hosted, meaning your data never leaves your server. No third-party services involved.

**Q: Can I use this with multiple phones?**
A: Absolutely! Set up the Shortcut on each device pointing to the same server IP.

**Q: Does this work with Android?**
A: Not yet, but you can use any HTTP client app (like Tasker) to POST to the API.

**Q: What if I don't have an iPhone?**
A: You can still use Budgety! Access the web interface at `http://localhost:8000/docs` to manually add transactions or bulk import CSVs.

---

## 🙏 Acknowledgments

Built with ❤️ for people who want simple, private, bank-agnostic expense tracking.

**Made by Sam** | [GitHub](https://github.com/yourusername) | [Report Issues](https://github.com/yourusername/budgety-v2/issues)
