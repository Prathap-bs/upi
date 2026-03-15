import axios from 'axios';
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

function statusLabel(status) {
  if (status === 'Waiting for Payment') return 'label-waiting';
  if (status === 'Customer Claimed Payment') return 'label-claimed';
  if (status === 'Verified') return 'label-verified';
  if (status === 'Rejected') return 'label-rejected';
  return '';
}

function tabButtonClass(currentTab, targetTab) {
  return currentTab === targetTab ? 'tab-btn tab-btn-active' : 'tab-btn';
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function App() {
  const [tab, setTab] = useState('admin');
  const [accounts, setAccounts] = useState([]);
  const [amount, setAmount] = useState('500');
  const [requests, setRequests] = useState([]);
  const [groupedTransactions, setGroupedTransactions] = useState([]);
  const [transactionFilters, setTransactionFilters] = useState({
    upiId: 'all',
    startDate: '',
    endDate: ''
  });
  const [message, setMessage] = useState('');
  const [newAccount, setNewAccount] = useState({ name: '', upiId: '' });

  const loadAccounts = async () => {
    try {
      const res = await axios.get(`${API}/admin/accounts`);
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Unable to fetch accounts');
    }
  };

  const loadRequests = async () => {
    try {
      const res = await axios.get(`${API}/admin/paymentrequests`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Unable to fetch payment requests');
    }
  };

  const loadTransactions = async (filters = transactionFilters) => {
    try {
      const params = {};
      if (filters.upiId && filters.upiId !== 'all') params.upiId = filters.upiId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await axios.get(`${API}/admin/transactions`, { params });
      setGroupedTransactions(res.data.groupedTransactions || []);
    } catch (err) {
      console.error(err);
      setMessage('Unable to fetch transactions');
    }
  };

  useEffect(() => {
    loadAccounts();
    loadRequests();
    loadTransactions();
  }, []);

  const addAccount = async () => {
    if (!newAccount.name || !newAccount.upiId) return setMessage('Fill name and UPI ID');
    try {
      const res = await axios.post(`${API}/admin/accounts`, newAccount);
      setAccounts(res.data);
      setNewAccount({ name: '', upiId: '' });
      setMessage('Account added');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Add account failed');
    }
  };

  const selectAccount = async (id) => {
    try {
      const res = await axios.patch(`${API}/admin/accounts/${id}/select`);
      setAccounts(res.data);
      setMessage('Selected account updated');
    } catch (err) {
      console.error(err);
      setMessage('Could not select account');
    }
  };

  const generateQR = async () => {
    if (!amount || Number(amount) <= 0) return setMessage('Enter a positive amount');
    try {
      const res = await axios.post(`${API}/admin/paymentrequests`, { amount: Number(amount) });
      setRequests(res.data);
      setMessage('Payment request created');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not create payment request');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.patch(`${API}/admin/paymentrequests/${id}/status`, { status });
      setRequests(res.data);
      setMessage(`Payment ${status}`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not update status');
    }
  };

  const customerClaim = async (id) => {
    try {
      const res = await axios.patch(`${API}/customer/paymentrequests/${id}/claim`);
      setRequests(res.data);
      setMessage('You have claimed payment');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Claim failed');
    }
  };

  const cancelPayment = (id) => {
    updateStatus(id, 'Rejected');
  };

  const applyTransactionFilters = () => {
    loadTransactions(transactionFilters);
  };

  const clearTransactionFilters = () => {
    const cleared = { upiId: 'all', startDate: '', endDate: '' };
    setTransactionFilters(cleared);
    loadTransactions(cleared);
  };

  const activePayment = requests[0] || null;

  return (
    <div className="page-shell">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="container">
        <div className="hero">
          <h1>UPI QR Pay Console</h1>
          <p>Fast collection flow for shop owners with live customer status and account-wise tracking.</p>
        </div>

        <div className="tabs">
          <button className={tabButtonClass(tab, 'admin')} onClick={() => setTab('admin')}>Admin</button>
          <button className={tabButtonClass(tab, 'customer')} onClick={() => setTab('customer')}>Customer</button>
          <button className={tabButtonClass(tab, 'transactions')} onClick={() => setTab('transactions')}>Transactions</button>
        </div>

        {message && <p className="msg-banner">{message}</p>}

        {tab === 'admin' ? (
          <div className="stack">
            <div className="card">
              <h2>Admin: Add UPI Account</h2>
              <div className="field-row">
                <input
                  placeholder="Account Name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount((prev) => ({ ...prev, name: e.target.value }))}
                />
                <input
                  placeholder="UPI ID"
                  value={newAccount.upiId}
                  onChange={(e) => setNewAccount((prev) => ({ ...prev, upiId: e.target.value }))}
                />
                <button onClick={addAccount}>Add Account</button>
              </div>
            </div>

            <div className="card">
              <h2>Available UPI Accounts</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Select</th><th>Name</th><th>UPI ID</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc) => (
                      <tr key={acc._id}>
                        <td><input type="radio" checked={acc.isActive} onChange={() => selectAccount(acc._id)} /></td>
                        <td>{acc.name}</td>
                        <td>{acc.upiId}</td>
                        <td>{acc.isActive ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2>Generate Payment QR</h2>
              <div className="field-row">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <button onClick={generateQR}>Generate QR</button>
              </div>
            </div>

            <div className="card">
              <h2>Payment Requests</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>UPI</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req._id}>
                        <td>{req.upiAccount.upiId}</td>
                        <td>Rs {req.amount}</td>
                        <td><span className={`label-status ${statusLabel(req.status)}`}>{req.status}</span></td>
                        <td className="action-cell">
                          <button disabled={req.status === 'Verified'} onClick={() => updateStatus(req._id, 'Verified')}>Verify</button>
                          <button className="btn-secondary" disabled={req.status === 'Rejected'} onClick={() => updateStatus(req._id, 'Rejected')}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : tab === 'customer' ? (
          <div className="card customer-card">
            <h2>Customer Payment</h2>
            {activePayment ? (
              <>
                <p className="pay-line">Pay <strong>Rs {activePayment.amount}</strong></p>
                <div className="qr-wrap">
                  <img src={activePayment.qrCodeData} alt="QR Code" width="240" height="240" />
                </div>
                <p>UPI ID: <strong>{activePayment.upiAccount.upiId}</strong></p>
                <div className="action-cell">
                  <button disabled={activePayment.status !== 'Waiting for Payment'} onClick={() => customerClaim(activePayment._id)}>I Have Paid</button>
                  <button className="btn-secondary" onClick={() => cancelPayment(activePayment._id)}>Cancel</button>
                </div>
                <div className="status-line">
                  <strong>Status:</strong> <span className={`label-status ${statusLabel(activePayment.status)}`}>{activePayment.status}</span>
                </div>
              </>
            ) : (
              <p>No payment request yet. Admin should generate one first.</p>
            )}
          </div>
        ) : (
          <div className="stack">
            <div className="card">
              <h2>Transactions by Account</h2>
              <div className="filters-row">
                <select
                  value={transactionFilters.upiId}
                  onChange={(e) => setTransactionFilters((prev) => ({ ...prev, upiId: e.target.value }))}
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc.upiId}>{acc.name} ({acc.upiId})</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={transactionFilters.startDate}
                  onChange={(e) => setTransactionFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
                <input
                  type="date"
                  value={transactionFilters.endDate}
                  onChange={(e) => setTransactionFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
                <button onClick={applyTransactionFilters}>Apply Filters</button>
                <button className="btn-secondary" onClick={clearTransactionFilters}>Clear</button>
              </div>
            </div>

            {groupedTransactions.length === 0 ? (
              <div className="card">
                <p>No transactions found for selected filters.</p>
              </div>
            ) : (
              groupedTransactions.map((group) => (
                <div className="card" key={group.upiId}>
                  <h2>{group.accountName} ({group.upiId})</h2>
                  <div className="stats-grid">
                    <div className="stat-chip">Total: Rs {group.totalAmount}</div>
                    <div className="stat-chip">Count: {group.transactionCount}</div>
                    <div className="stat-chip">Waiting: {group.statusCounts.waiting}</div>
                    <div className="stat-chip">Claimed: {group.statusCounts.claimed}</div>
                    <div className="stat-chip">Verified: {group.statusCounts.verified}</div>
                    <div className="stat-chip">Rejected: {group.statusCounts.rejected}</div>
                  </div>

                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.transactions.map((tx) => (
                          <tr key={tx._id}>
                            <td>{formatDate(tx.createdAt)}</td>
                            <td>Rs {tx.amount}</td>
                            <td><span className={`label-status ${statusLabel(tx.status)}`}>{tx.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
