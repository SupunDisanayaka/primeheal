import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const AdminFeedbackModeration = () => {
  const appContext = useContext(AppContext);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAllFeedback = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      const baseUrl = rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;
      const endpoint = `${baseUrl}/feedback/all`;

      const token = appContext?.token || localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data && response.data.success) {
        setFeedbackList(response.data.feedback || []);
      } else {
        setError(response.data?.message || 'Failed to fetch feedback entries.');
      }
    } catch (err) {
      console.error('Error fetching all feedback for admin:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching feedback list.');
    } finally {
      setLoading(false);
    }
  }, [appContext?.token]);

  useEffect(() => {
    fetchAllFeedback();
  }, [fetchAllFeedback]);

  // Handler for Approve action
  const handleApprove = async (feedbackID) => {
    setActionLoadingId(feedbackID);
    try {
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      const baseUrl = rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;
      const endpoint = `${baseUrl}/feedback/approve/${feedbackID}`;

      const token = appContext?.token || localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.put(
        endpoint,
        { isApproved: 1 },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (response.data && response.data.success) {
        setFeedbackList((prev) =>
          prev.map((item) =>
            item.feedbackID === feedbackID ? { ...item, isApproved: 1 } : item
          )
        );
      } else {
        alert(response.data?.message || 'Failed to approve feedback');
      }
    } catch (err) {
      console.error('Error approving feedback:', err);
      alert(err.response?.data?.message || err.message || 'Error approving feedback');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler for Visibility Toggle action
  const handleToggleVisibility = async (feedbackID, currentVisibility) => {
    const newVisibility = currentVisibility === 1 ? 0 : 1;
    setActionLoadingId(feedbackID);

    try {
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      const baseUrl = rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;
      const endpoint = `${baseUrl}/feedback/visibility/${feedbackID}`;

      const token = appContext?.token || localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.put(
        endpoint,
        { isVisible: newVisibility },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (response.data && response.data.success) {
        setFeedbackList((prev) =>
          prev.map((item) =>
            item.feedbackID === feedbackID ? { ...item, isVisible: newVisibility } : item
          )
        );
      } else {
        alert(response.data?.message || 'Failed to toggle visibility');
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
      alert(err.response?.data?.message || err.message || 'Error updating visibility');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const renderStars = (rating) => {
    const numRating = Math.round(Number(rating) || 0);
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= numRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-200'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const pendingCount = feedbackList.filter((f) => f.isApproved === 0).length;
  const approvedCount = feedbackList.filter((f) => f.isApproved === 1).length;

  return (
    <div className="m-5 sm:m-8 w-full max-w-7xl space-y-6">
      {/* Header & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback Moderation</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review patient feedback submissions, grant approval, and manage public visibility.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{pendingCount} Pending</span>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{approvedCount} Approved</span>
          </div>
          <button
            onClick={fetchAllFeedback}
            disabled={loading}
            className="px-3.5 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-2xs disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAllFeedback}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-slate-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th scope="col" className="px-5 py-4 text-left">Feedback ID</th>
                <th scope="col" className="px-5 py-4 text-left">Patient</th>
                <th scope="col" className="px-5 py-4 text-left">Doctor</th>
                <th scope="col" className="px-5 py-4 text-left">Rating</th>
                <th scope="col" className="px-5 py-4 text-left">Comments</th>
                <th scope="col" className="px-5 py-4 text-left">Created At</th>
                <th scope="col" className="px-5 py-4 text-center">Approved Status</th>
                <th scope="col" className="px-5 py-4 text-center">Visibility Status</th>
                <th scope="col" className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500 text-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading feedback data...</span>
                    </div>
                  </td>
                </tr>
              ) : feedbackList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500 text-sm">
                    No feedback records found.
                  </td>
                </tr>
              ) : (
                feedbackList.map((item) => {
                  const isPending = item.isApproved === 0;
                  const isVisible = item.isVisible === 1;

                  return (
                    <tr
                      key={item.feedbackID}
                      className={`transition-colors text-sm ${
                        isPending
                          ? 'bg-amber-50/80 hover:bg-amber-100/70 border-l-4 border-l-amber-400'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {/* Feedback ID */}
                      <td className="px-5 py-4 font-mono font-semibold text-gray-700 whitespace-nowrap">
                        #{item.feedbackID}
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {item.patientName || 'Anonymous Patient'}
                      </td>

                      {/* Doctor */}
                      <td className="px-5 py-4 text-gray-800 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{item.doctorName || `Doctor #${item.doctorID}`}</p>
                          {item.doctorSpecialization && (
                            <p className="text-xs text-gray-500">{item.doctorSpecialization}</p>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {renderStars(item.rating)}
                          <span className="text-xs font-bold text-gray-700">({item.rating})</span>
                        </div>
                      </td>

                      {/* Comments */}
                      <td className="px-5 py-4 max-w-xs text-gray-700">
                        <p className="truncate hover:whitespace-normal transition-all" title={item.comments}>
                          {item.comments ? `"${item.comments}"` : <span className="text-gray-400 italic">No comment provided</span>}
                        </p>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      {/* Approved Status */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {item.isApproved === 1 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Visibility Status */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {isVisible ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            Hidden
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-3">
                          {/* Approve Button (rendered if isApproved === 0) */}
                          {item.isApproved === 0 && (
                            <button
                              onClick={() => handleApprove(item.feedbackID)}
                              disabled={actionLoadingId === item.feedbackID}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition shadow-2xs disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                              title="Approve feedback entry"
                            >
                              <span>Approve</span>
                            </button>
                          )}

                          {/* Visibility Toggle Switch */}
                          <div className="flex items-center space-x-1.5" title="Toggle visibility">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(item.feedbackID, item.isVisible)}
                              disabled={actionLoadingId === item.feedbackID}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                isVisible ? 'bg-indigo-600' : 'bg-gray-300'
                              }`}
                              role="switch"
                              aria-checked={isVisible}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isVisible ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFeedbackModeration;
