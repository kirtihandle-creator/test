const transactions = [
  { id: 'TXN10234', desc: 'Semester 5 Tuition Fee', date: '15 Jul 2026', amount: 45000, status: 'Paid' },
  { id: 'TXN10198', desc: 'Hostel Fee (Semester 5)', date: '15 Jul 2026', amount: 22000, status: 'Paid' },
  { id: 'TXN09876', desc: 'Semester 4 Tuition Fee', date: '10 Jan 2026', amount: 45000, status: 'Paid' },
  { id: 'TXN09850', desc: 'Exam Fee (Semester 4)', date: '05 Jan 2026', amount: 2500, status: 'Paid' },
]

function Fees() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Fees</h1>
      <p style={{ marginBottom: 28 }}>Manage your fee payments and view transaction history.</p>

      <div className="dash-grid-3">
        <div className="dash-card">
          <div className="dash-stat-label">Total Paid</div>
          <div className="dash-stat-value">₹1,14,500</div>
        </div>
        <div className="dash-card">
          <div className="dash-stat-label">Amount Due</div>
          <div className="dash-stat-value" style={{ color: '#2e7d32' }}>₹0</div>
        </div>
        <div className="dash-card">
          <div className="dash-stat-label">Next Due Date</div>
          <div className="dash-stat-value" style={{ fontSize: 20 }}>15 Jan 2027</div>
        </div>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <h3>Transaction History</h3>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Description</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.id}</td>
                <td>{t.desc}</td>
                <td>{t.date}</td>
                <td>₹{t.amount.toLocaleString('en-IN')}</td>
                <td>
                  <span style={{ color: '#2e7d32', fontWeight: 700 }}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Fees
