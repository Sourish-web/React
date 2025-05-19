import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiLogOut, FiX } from 'react-icons/fi';

const Settings = () => {
  const cookies = new Cookies();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:8090';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const getAuthToken = () => cookies.get('token');

  const handleLogout = () => {
    cookies.remove('token', { path: '/' });
    navigate('/login');
  };

  const handleClose = () => {
    navigate('/dashboard'); // Adjust to your desired route
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Add hover and ripple effects
    const buttons = document.querySelectorAll('.action-button');
    buttons.forEach((button) => {
      button.addEventListener('mouseenter', () => {
        button.style.background = '#009a8a';
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 8px 24px rgba(0, 180, 160, 0.3)';
      });
      button.addEventListener('mouseleave', () => {
        button.style.background = button.dataset.defaultBg || '#00c4b4';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      });
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });

    return () => {
      buttons.forEach((button) => {
        button.removeEventListener('mouseenter', () => {});
        button.removeEventListener('mouseleave', () => {});
        button.removeEventListener('click', () => {});
      });
    };
  }, []);

  const fetchUserProfile = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated. Please log in.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({
        name: response.data.name || '',
        customUsername: response.data.customUsername || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        gender: response.data.gender || '',
        birthDate: response.data.birthDate || '',
        bio: response.data.bio || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        zipCode: response.data.zipCode || '',
        country: response.data.country || '',
        language: response.data.language || 'en',
        theme: response.data.theme || 'light',
        jobTitle: response.data.jobTitle || '',
        company: response.data.company || '',
        skills: response.data.skills || '',
        panCard: response.data.panCard || '',
        profilePicture: response.data.profilePicture || '',
      });
      setTwoFactorEnabled(response.data.twoFactorEnabled || false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/update/profile`,
        user,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser({
        ...user,
        ...response.data,
        customUsername: response.data.customUsername || user.customUsername,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/profile/password`,
        {
          currentPassword: passwordChange.currentPassword,
          newPassword: passwordChange.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password changed successfully!');
      setPasswordChange({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/profile/2fa`,
        { enabled: !twoFactorEnabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTwoFactorEnabled(!twoFactorEnabled);
      toast.success(`Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating 2FA:', error);
      toast.error(error.response?.data?.message || 'Failed to update two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      await axios.post(`${API_URL}/upload/profile/picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profile picture updated successfully!');
      await fetchUserProfile();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/remove/profile/picture`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile picture removed successfully!');
      await fetchUserProfile();
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error(error.response?.data?.message || 'Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    if (window.confirm('Are you sure you want to deactivate your account?')) {
      setLoading(true);
      try {
        await axios.put(`${API_URL}/profile/deactivate`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Account deactivated successfully');
        cookies.remove('token', { path: '/' });
        navigate('/login');
      } catch (error) {
        console.error('Error deactivating account:', error);
        toast.error(error.response?.data?.message || 'Failed to deactivate account');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error('You are not authenticated');
      navigate('/login');
      return;
    }

    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/delete/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Account deleted successfully');
        cookies.remove('token', { path: '/' });
        navigate('/login');
      } catch (error) {
        console.error('Error deleting account:', error);
        toast.error(error.response?.data?.message || 'Failed to delete account');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportData = () => {
    toast.info('Data export functionality is not yet implemented.');
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <span style={styles.spinner}></span>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.errorMessage}>
        Failed to load user profile
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
      <div style={styles.modal}>
        <button
          style={styles.closeButton}
          onClick={handleClose}
          aria-label="Close settings"
          className="action-button"
          data-default-bg="#00c4b4"
        >
          <FiX size={20} />
        </button>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.sectionTitle}>Account Settings</h1>
            <p style={styles.sectionSubtitle}>Personalize your ExpenseMate experience</p>
            <button
              style={styles.logoutButton}
              onClick={handleLogout}
              aria-label="Log out"
              className="action-button"
              data-default-bg="#00c4b4"
            >
              <FiLogOut size={16} /> Logout
            </button>
          </div>

          <div style={styles.contentWrapper}>
            {/* Sticky Sidebar Navigation */}
            <div style={styles.sidebar}>
              <div style={styles.navContainer}>
                {['profile', 'security', 'appearance', 'accounts'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={activeTab === tab ? styles.activeNavButton : styles.navButton}
                    className="action-button"
                    data-default-bg="#00c4b4"
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace('accounts', 'Accounts')}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Main Content */}
            <div style={styles.content}>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div style={styles.tabContent}>
                  <h2 style={styles.cardTitle}>Profile Information</h2>

                  {/* Profile Picture */}
                  <div style={styles.profilePictureContainer}>
                    <div style={styles.profilePicture}>
                      {user.profilePicture ? (
                        <img
                          src={`data:image/jpeg;base64,${user.profilePicture}`}
                          alt="Profile"
                          style={styles.profileImage}
                        />
                      ) : (
                        <div style={styles.noImage}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <label style={styles.uploadIcon}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          style={styles.icon}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          style={styles.fileInput}
                          onChange={handleProfilePictureUpload}
                        />
                      </label>
                    </div>
                    <div style={styles.profilePictureActions}>
                      <button
                        onClick={handleRemoveProfilePicture}
                        style={styles.deleteButton}
                        className="action-button"
                        disabled={!user.profilePicture}
                        data-default-bg="#00c4b4"
                      >
                        Remove Photo
                      </button>
                      <p style={styles.hintText}>JPG, GIF, or PNG. Max size 2MB</p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} style={styles.form}>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                          type="text"
                          value={user.customUsername}
                          onChange={(e) => setUser({ ...user, customUsername: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your username"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          style={{ ...styles.input, background: 'rgba(255, 255, 255, 0.1)', cursor: 'not-allowed', color: '#a1a1aa' }}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Phone Number</label>
                        <input
                          type="tel"
                          value={user.phone}
                          onChange={(e) => setUser({ ...user, phone: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Gender</label>
                        <select
                          value={user.gender}
                          onChange={(e) => setUser({ ...user, gender: e.target.value })}
                          style={styles.input}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Date of Birth</label>
                        <input
                          type="date"
                          value={user.birthDate}
                          onChange={(e) => setUser({ ...user, birthDate: e.target.value })}
                          style={styles.input}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                        <label style={styles.label}>Bio</label>
                        <textarea
                          value={user.bio}
                          onChange={(e) => setUser({ ...user, bio: e.target.value })}
                          style={{ ...styles.input, height: '100px', resize: 'vertical' }}
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Address</label>
                        <input
                          type="text"
                          value={user.address}
                          onChange={(e) => setUser({ ...user, address: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your address"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>City</label>
                        <input
                          type="text"
                          value={user.city}
                          onChange={(e) => setUser({ ...user, city: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your city"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>State/Province</label>
                        <input
                          type="text"
                          value={user.state}
                          onChange={(e) => setUser({ ...user, state: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your state"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>ZIP/Postal Code</label>
                        <input
                          type="text"
                          value={user.zipCode}
                          onChange={(e) => setUser({ ...user, zipCode: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your zip code"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Country</label>
                        <input
                          type="text"
                          value={user.country}
                          onChange={(e) => setUser({ ...user, country: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your country"
                        />
                      </div>
                    </div>
                    <h3 style={styles.subTitle}>Professional Information</h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Job Title</label>
                        <input
                          type="text"
                          value={user.jobTitle}
                          onChange={(e) => setUser({ ...user, jobTitle: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your job title"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Company</label>
                        <input
                          type="text"
                          value={user.company}
                          onChange={(e) => setUser({ ...user, company: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your company"
                        />
                      </div>
                      <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
                        <label style={styles.label}>Skills</label>
                        <input
                          type="text"
                          value={user.skills}
                          onChange={(e) => setUser({ ...user, skills: e.target.value })}
                          style={styles.input}
                          placeholder="Separate skills with commas"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>PAN Card Number</label>
                        <input
                          type="text"
                          value={user.panCard}
                          onChange={(e) => setUser({ ...user, panCard: e.target.value })}
                          style={styles.input}
                          placeholder="Enter your PAN card number"
                        />
                      </div>
                    </div>
                    <div style={styles.buttonGroup}>
                      <button
                        type="submit"
                        style={styles.actionButton}
                        className="action-button"
                        disabled={loading}
                        data-default-bg="#00c4b4"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div style={styles.tabContent}>
                  <h2 style={styles.cardTitle}>Security Settings</h2>

                  {/* Change Password */}
                  <div style={styles.card}>
                    <h3 style={styles.subTitle}>Change Password</h3>
                    <form onSubmit={handlePasswordChange} style={styles.form}>
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Current Password</label>
                          <input
                            type="password"
                            value={passwordChange.currentPassword}
                            onChange={(e) => setPasswordChange({ ...passwordChange, currentPassword: e.target.value })}
                            style={styles.input}
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>New Password</label>
                          <input
                            type="password"
                            value={passwordChange.newPassword}
                            onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                            style={styles.input}
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Confirm New Password</label>
                          <input
                            type="password"
                            value={passwordChange.confirmPassword}
                            onChange={(e) => setPasswordChange({ ...passwordChange, confirmPassword: e.target.value })}
                            style={styles.input}
                            required
                          />
                        </div>
                      </div>
                      <div style={styles.buttonGroup}>
                        <button
                          type="submit"
                          style={styles.actionButton}
                          className="action-button"
                          disabled={loading}
                          data-default-bg="#00c4b4"
                        >
                          Update Password
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div style={styles.card}>
                    <div style={styles.flexBetween}>
                      <div>
                        <h3 style={styles.subTitle}>Two-Factor Authentication</h3>
                        <p style={styles.hintText}>Enhance your account security</p>
                      </div>
                      <button
                        onClick={handleTwoFactorToggle}
                        style={twoFactorEnabled ? styles.toggleOn : styles.toggleOff}
                        className="action-button"
                        data-default-bg={twoFactorEnabled ? '#00c4b4' : '#3f3f46'}
                      >
                        <span style={twoFactorEnabled ? styles.toggleKnobOn : styles.toggleKnobOff} />
                      </button>
                    </div>
                    <p style={twoFactorEnabled ? styles.successText : styles.hintText}>
                      {twoFactorEnabled ? 'Two-factor authentication is enabled.' : 'Two-factor authentication is disabled.'}
                    </p>
                  </div>

                  {/* Active Sessions */}
                  <div style={styles.card}>
                    <h3 style={styles.subTitle}>Active Sessions</h3>
                    <p style={styles.hintText}>Manage your active login sessions (coming soon).</p>
                    <div style={styles.noData}>
                      No session data available.
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div style={styles.tabContent}>
                  <h2 style={styles.cardTitle}>Appearance Settings</h2>

                  {/* Theme Preferences */}
                  <div style={styles.card}>
                    <h3 style={styles.subTitle}>Theme Preferences</h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Theme</label>
                        <select
                          value={user.theme}
                          onChange={(e) => setUser({ ...user, theme: e.target.value })}
                          style={styles.input}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System Default</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Language Preferences */}
                  <div style={styles.card}>
                    <h3 style={styles.subTitle}>Language & Region</h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Language</label>
                        <select
                          value={user.language}
                          onChange={(e) => setUser({ ...user, language: e.target.value })}
                          style={styles.input}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="hi">Hindi</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Time Zone</label>
                        <select style={styles.input}>
                          <option>(UTC-05:00) Eastern Time</option>
                          <option>(UTC-06:00) Central Time</option>
                          <option>(UTC-07:00) Mountain Time</option>
                          <option>(UTC-08:00) Pacific Time</option>
                          <option>(UTC+05:30) India Standard Time</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div style={styles.card}>
                    <h3 style={styles.subTitle}>Notification Preferences</h3>
                    <div style={styles.checkboxGroup}>
                      {['email', 'push', 'sms'].map((type) => (
                        <div key={type} style={styles.checkboxItem}>
                          <input
                            id={`${type}-notifications`}
                            type="checkbox"
                            style={styles.checkbox}
                          />
                          <div style={styles.checkboxText}>
                            <label htmlFor={`${type}-notifications`} style={styles.label}>
                              {type.charAt(0).toUpperCase() + type.slice(1)} Notifications
                            </label>
                            <p style={styles.hintText}>
                              Receive important notifications via {type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Accounts Tab */}
              {activeTab === 'accounts' && (
                <div style={styles.tabContent}>
                  <h2 style={styles.cardTitle}>Account Management</h2>

                  {/* Deactivate Account */}
                  <div style={styles.card}>
                    <div style={styles.flexBetween}>
                      <div>
                        <h3 style={styles.subTitle}>Deactivate Account</h3>
                        <p style={styles.hintText}>
                          Deactivate your account temporarily. Reactivate by logging in.
                        </p>
                      </div>
                      <button
                        onClick={handleDeactivateAccount}
                        style={styles.actionButton}
                        className="action-button"
                        disabled={loading}
                        data-default-bg="#00c4b4"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div style={styles.card}>
                    <div style={styles.flexBetween}>
                      <div>
                        <h3 style={styles.subTitle}>Delete Account</h3>
                        <p style={styles.hintText}>
                          Permanently delete your account and all data. This is irreversible.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        style={styles.deleteButton}
                        className="action-button"
                        disabled={loading}
                        data-default-bg="#00c4b4"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  {/* Export Data */}
                  <div style={styles.card}>
                    <div style={styles.flexBetween}>
                      <div>
                        <h3 style={styles.subTitle}>Export Data</h3>
                        <p style={styles.hintText}>
                          Download a copy of your personal data.
                        </p>
                      </div>
                      <button
                        onClick={handleExportData}
                        style={styles.actionButton}
                        className="action-button"
                        disabled={loading}
                        data-default-bg="#00c4b4"
                      >
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeInOverlay 0.3s ease-out',
  },
  modal: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '70vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
    animation: 'slideUpModal 0.4s ease-out',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: '0.8rem',
    right: '0.8rem',
    background: '#00c4b4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  card: {
    background: 'transparent',
    padding: '1.5rem',
  },
  cardHeader: {
    background: '#00c4b4',
    padding: '1.2rem 1.5rem',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    color: '#ffffff',
    margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  sectionTitle: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '1.8rem',
    fontWeight: 800,
    marginBottom: '0.4rem',
    letterSpacing: '-0.02em',
  },
  sectionSubtitle: {
    fontSize: '1rem',
    fontWeight: 400,
    opacity: 0.9,
  },
  logoutButton: {
    position: 'absolute',
    top: '1.2rem',
    right: '1.5rem',
    background: '#00c4b4',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  sidebar: {
    flex: '0 0 200px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start',
    maxHeight: 'calc(70vh - 3rem)',
  },
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navButton: {
    background: '#00c4b4',
    color: '#ffffff',
    border: 'none',
    padding: '0.8rem 1.2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    textAlign: 'left',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  activeNavButton: {
    background: '#009a8a',
    color: '#ffffff',
    border: 'none',
    padding: '0.8rem 1.2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    textAlign: 'left',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(0, 180, 160, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: '1',
    minWidth: '280px',
  },
  tabContent: {
    animation: 'fadeIn 0.5s ease-out',
  },
  cardTitle: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '1.2rem',
    letterSpacing: '-0.01em',
  },
  subTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '1rem',
  },
  profilePictureContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  profilePicture: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid #ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noImage: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(145deg, #d1d5db, #9ca3af)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  uploadIcon: {
    position: 'absolute',
    bottom: '6px',
    right: '6px',
    background: 'linear-gradient(145deg, #ffffff, #e5e7eb)',
    borderRadius: '50%',
    padding: '0.4rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  },
  icon: {
    width: '20px',
    height: '20px',
    color: '#00c4b4',
  },
  fileInput: {
    display: 'none',
  },
  profilePictureActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  hintText: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: 400,
  },
  successText: {
    fontSize: '0.8rem',
    color: '#00c4b4',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '0.5rem',
    letterSpacing: '0.02em',
  },
  input: {
    padding: '0.7rem',
    border: 'none',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    fontSize: '0.85rem',
    color: '#1f2937',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  toggleOn: {
    background: '#00c4b4',
    width: '44px',
    height: '24px',
    borderRadius: '9999px',
    position: 'relative',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 180, 160, 0.3)',
  },
  toggleOff: {
    background: '#3f3f46',
    width: '44px',
    height: '24px',
    borderRadius: '9999px',
    position: 'relative',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  toggleKnobOn: {
    position: 'absolute',
    top: '2px',
    left: '22px',
    width: '20px',
    height: '20px',
    background: '#ffffff',
    borderRadius: '50%',
    transition: 'left 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  toggleKnobOff: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    background: '#ffffff',
    borderRadius: '50%',
    transition: 'left 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.8rem',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
    cursor: 'pointer',
    accentColor: '#00c4b4',
    transition: 'all 0.3s ease',
  },
  checkboxText: {
    display: 'flex',
    flexDirection: 'column',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  actionButton: {
    background: '#00c4b4',
    color: '#ffffff',
    border: 'none',
    padding: '0.7rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButton: {
    background: '#00c4b4',
    color: '#ffffff',
    border: 'none',
    padding: '0.7rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  noData: {
    fontSize: '0.9rem',
    color: '#6b7280',
    textAlign: 'center',
    padding: '1rem',
    fontWeight: 400,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '1.2rem',
    color: '#1f2937',
    minHeight: '100vh',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #00c4b4',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorMessage: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '1.2rem',
    color: '#dc2626',
    textAlign: 'center',
    padding: '3rem',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
  },
};

export default Settings;