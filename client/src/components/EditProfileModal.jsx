import React, { useState, useRef } from 'react';
import { api } from '../api';
import { X, User, Lock, Upload, Check, AlertCircle } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Profile State
    const [nickname, setNickname] = useState(profile?.user?.nickname || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profile?.user?.avatar_url || '');
    const fileInputRef = useRef(null);

    // Security State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Only image files are allowed');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Update Nickname
            if (nickname !== profile.user.nickname) {
                await api.updateNickname(nickname);
            }

            // Update Avatar
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                await api.uploadAvatar(formData);
            }

            setSuccess('Profile updated successfully');
            onUpdate(); // Refresh parent
            setTimeout(() => {
                setSuccess(null);
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await api.changePassword(oldPassword, newPassword);
            setSuccess('Password changed successfully');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccess(null), 2000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '0', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Edit Profile</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'profile' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: 'none',
                            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <User size={18} /> Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'security' ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: 'none',
                            color: activeTab === 'security' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'security' ? '2px solid var(--primary)' : '2px solid transparent',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Lock size={18} /> Security
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {error && (
                        <div style={{ background: 'rgba(255, 0, 0, 0.1)', color: '#ff4d4d', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ background: 'rgba(0, 255, 0, 0.1)', color: '#00ff00', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Check size={18} /> {success}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Avatar Upload */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        background: previewUrl ? `url(${previewUrl}) center/cover` : 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid var(--primary)',
                                        position: 'relative'
                                    }}
                                >
                                    {!previewUrl && <User size={48} color="#000" />}
                                </div>

                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        border: '2px dashed var(--text-muted)',
                                        borderRadius: '8px',
                                        padding: '20px',
                                        width: '100%',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Upload size={24} style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '14px' }}>Click or Drag & Drop to upload</div>
                                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Max 5MB (JPG, PNG)</div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Nickname */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Nickname</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="input"
                                    placeholder="Enter nickname"
                                />
                            </div>

                            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Old Password</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="input"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <button className="btn btn-primary" onClick={handleChangePassword} disabled={loading}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
