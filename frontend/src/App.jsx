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

export default function App() {
  const [tab, setTab] = useState('admin');
  const [accounts, setAccounts] = useState([]);
  const [amount, setAmount] = useState('500');
  const [requests, setRequests] = useState([]);
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

  useEffect(() => {
    loadAccounts();
    loadRequests();
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

  const activePayment = requests[0] || null;

  return (
    <div className="container">
      <h1>QR Pay MERN Demo</h1>
      <div style={{ marginBottom: 14 }}>
        <button onClick={() => setTab('admin')} style={{ marginRight: 8 }}>Admin</button>
        <button onClick={() => setTab('customer')}>Customer</button>
      </div>
      {message && <p style={{ color: '#1d4ed8' }}>{message}</p>}

      {tab === 'admin' ? (
        <div>
          <div className="card">
            <h2>Admin: Add UPI Account</h2>
            <input placeholder="Name" value={newAccount.name} onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))} />
            <input placeholder="UPI ID" value={newAccount.upiId} onChange={e => setNewAccount(prev => ({ ...prev, upiId: e.target.value }))} />
            <button onClick={addAccount}>Add Account</button>
          </div>

          <div className="card">
            <h2>Available UPI Accounts</h2>
            <table className="table">
              <thead><tr><th>Select</th><th>Name</th><th>UPI ID</th><th>Status</th></tr></thead>
              <tbody>
                {accounts.map(acc => (
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

          <div className="card">
            <h2>Generate Payment QR</h2>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <button onClick={generateQR}>Generate QR</button>
          </div>

          <div className="card">
            <h2>Payment Requests</h2>
            <table className="table">
              <thead><tr><th>UPI</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id}>
                    <td>{req.upiAccount.upiId}</td>
                    <td>₹{req.amount}</td>
                    <td><span className={`label-status ${statusLabel(req.status)}`}>{req.status}</span></td>
                    <td>
                      <button disabled={req.status === 'Verified'} onClick={() => updateStatus(req._id, 'Verified')}>Verify</button>
                      <button disabled={req.status === 'Rejected'} style={{ marginLeft: 8 }} onClick={() => updateStatus(req._id, 'Rejected')}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="card">
          <h2>Customer Payment</h2>
          {activePayment ? (
            <>
              <p>Pay ₹{activePayment.amount}</p>
              <div style={{ marginBottom: 10 }}>
                <img src={activePayment.qrCodeData} alt="QR Code" width="240" height="240" />
              </div>
              <p>UPI ID: <strong>{activePayment.upiAccount.upiId}</strong></p>
              <button disabled={activePayment.status !== 'Waiting for Payment'} onClick={() => customerClaim(activePayment._id)}>I Have Paid</button>
              <button style={{ marginLeft: 8 }} onClick={() => cancelPayment(activePayment._id)}>Cancel</button>
              <div style={{ marginTop: 12 }}>
                <strong>Status: </strong> <span className={`label-status ${statusLabel(activePayment.status)}`}>{activePayment.status}</span>
              </div>
            </>
          ) : (
            <p>No payment request yet. Admin should generate one first.</p>
          )}
        </div>
      )}
    </div>
  );
}
