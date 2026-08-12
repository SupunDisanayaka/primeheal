import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { DoctorContext } from '../../context/DoctorContext';

const DoctorFeedbackView = ({ doctorId: propDoctorId = null }) => {
  const doctorContext = useContext(DoctorContext);
  const [feedbackList, setFeedbackList] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolve doctor ID from prop, context, or localStorage
  const resolvedDoctorId =
    propDoctorId ||
    doctorContext?.currentDoctorId ||
    localStorage.getItem('currentDoctorId') ||
    localStorage.getItem('doctorId') ||
    localStorage.getItem('userID');

  const fetchDoctorFeedback = useCallback(async () => {
    if (!resolvedDoctorId) {
      setLoading(false);
      setError('Doctor ID not found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      const baseUrl = rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;
      const endpoint = `${baseUrl}/feedback/doctor/${resolvedDoctorId}`;

      const token = doctorContext?.doctorToken || localStorage.getItem('doctorToken') || localStorage.getItem('token');
      const response = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data && response.data.success) {
        setFeedbackList(response.data.feedback || response.data.reviews || []);
        setAverageRating(Number(response.data.averageRating || 0));
        setTotalReviews(Number(response.data.totalReviews ?? response.data.totalCount ?? 0));
      } else {
        setError(response.data?.message || 'Failed to load doctor feedback.');
      }
    } catch (err) {
      console.error('Error fetching doctor feedback:', err);
      setError(err.response?.data?.message || err.message || 'Error fetching doctor feedback.');
    } finally {
      setLoading(false);
    }
  }, [resolvedDoctorId, doctorContext?.doctorToken]);

  useEffect(() => {
    fetchDoctorFeedback();
  }, [fetchDoctorFeedback]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
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

  const renderStars = (ratingVal) => {
    const numericRating = Math.round(Number(ratingVal) || 0);
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= numericRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-200'
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>Patient Feedback & Reviews</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Real patient ratings and experiences (approved entries)
          </p>
        </div>
        <button
          onClick={fetchDoctorFeedback}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-xs transition disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Reviews
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Metric 1: Average Rating */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-6 shadow-xs relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1 z-10">
            <p className="text-sm font-medium text-amber-800">Average Rating</p>
            <div className="flex items-baseline space-x-3">
              <span className="text-4xl font-extrabold text-amber-900">
                {averageRating ? averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm text-amber-700 font-medium">/ 5.0</span>
            </div>
            <div className="pt-1">{renderStars(averageRating)}</div>
            <p className="text-xs text-amber-700/80 pt-1">
              Calculated from approved and visible reviews
            </p>
          </div>
          <div className="w-16 h-16 bg-amber-200/50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <svg className="w-9 h-9 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Total Verified Reviews */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-6 shadow-xs relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1 z-10">
            <p className="text-sm font-medium text-blue-800">Total Verified Reviews</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-blue-900">{totalReviews}</span>
              <span className="text-sm text-blue-700 font-medium">
                {totalReviews === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 pt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <svg className="w-3 h-3 mr-1 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100% Verified
              </span>
            </div>
          </div>
          <div className="w-16 h-16 bg-blue-200/50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <svg className="w-8 h-8 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Review Cards Section */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-semibold text-gray-800">Recent Patient Reviews</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl p-5 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchDoctorFeedback}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6">
            <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5h2M11 9h2m-2 4h2m-6 4h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-gray-700">No Patient Reviews Yet</h4>
            <p className="text-sm text-gray-500 mt-1">
              Approved patient feedback for your consultations will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedbackList.map((item) => {
              const patientName = item.patientName || 'Anonymous Patient';
              const initial = patientName.charAt(0).toUpperCase();

              return (
                <div
                  key={item.feedbackID || item._id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition duration-200 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base shrink-0">
                        {initial}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base">{patientName}</h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          {renderStars(item.rating)}
                          <span className="text-xs font-semibold text-gray-700">
                            {Number(item.rating).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.comments && (
                    <p className="text-sm text-gray-700 bg-gray-50/80 p-3 rounded-xl border border-gray-100 leading-relaxed">
                      "{item.comments}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorFeedbackView;
