import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const userId = 1; // Replace this with actual logged-in user ID from context or cookie
  const [settings, setSettings] = useState({
    userId: userId,
    name: '',
    email: '',
    phone: '',
    profilePictureUrl: '',
    currency: 'INR',
    decimalFormat: '1.00',
    theme: 'light',
    notifyGoals: false,
    notifyTransactions: false,
    notifyBudget: false
  });

  useEffect(() => {
    axios.get(`http://localhost:8090/settings/${userId}`)
      .then(res => {
        if (res.data) {
          setSettings(res.data);
        }
      })
      .catch(err => console.error(err));
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8090/settings/update', settings)
      .then(res => alert("Settings updated successfully!"))
      .catch(err => {
        console.error(err);
        alert("Error updating settings.");
      });
  };

  return (
    <div className="settings-container" style={styles.container}>
      <h2>User Settings</h2>
      <form onSubmit={handleSave} style={styles.form}>
        {/* Profile Section */}
        <div style={styles.section}>
          <h3>Profile Info</h3>
          <input type="text" name="name" placeholder="Name" value={settings.name} onChange={handleChange} style={styles.input} />
          <input type="email" name="email" placeholder="Email" value={settings.email} onChange={handleChange} style={styles.input} />
          <input type="tel" name="phone" placeholder="Phone" value={settings.phone} onChange={handleChange} style={styles.input} />
          <input type="text" name="profilePictureUrl" placeholder="Profile Picture URL" value={settings.profilePictureUrl} onChange={handleChange} style={styles.input} />
        </div>

        {/* Currency Preferences */}
        <div style={styles.section}>
          <h3>Currency Preferences</h3>
          <label>
            Currency:
            <select name="currency" value={settings.currency} onChange={handleChange} style={styles.input}>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </label>
          <label>
            Decimal Format:
            <select name="decimalFormat" value={settings.decimalFormat} onChange={handleChange} style={styles.input}>
              <option value="1.00">1.00</option>
              <option value="1.000">1.000</option>
            </select>
          </label>
        </div>

        {/* Theme */}
        <div style={styles.section}>
          <h3>Appearance</h3>
          <label>
            Theme:
            <select name="theme" value={settings.theme} onChange={handleChange} style={styles.input}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        {/* Notifications */}
        <div style={styles.section}>
          <h3>Notifications</h3>
          <label>
            <input type="checkbox" name="notifyGoals" checked={settings.notifyGoals} onChange={handleChange} />
            &nbsp; Goals Alerts
          </label><br />
          <label>
            <input type="checkbox" name="notifyTransactions" checked={settings.notifyTransactions} onChange={handleChange} />
            &nbsp; Transaction Alerts
          </label><br />
          <label>
            <input type="checkbox" name="notifyBudget" checked={settings.notifyBudget} onChange={handleChange} />
            &nbsp; Budget Alerts
          </label>
        </div>

        <button type="submit" style={styles.button}>Save Settings</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '600px',
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  section: {
    marginBottom: '1.5rem'
  },
  input: {
    padding: '0.5rem',
    margin: '0.5rem 0',
    borderRadius: '6px',
    border: '1px solid #ccc',
    width: '100%'
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default Settings;
