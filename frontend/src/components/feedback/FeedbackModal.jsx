import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeedbackModal = ({
  isOpen = true,
  onClose,
  appointment = null,
  appointmentID = null,
  doctorID = null,
  doctorName = '',
  token: propToken = null,
  onSubmitSuccess = null
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComments('');
      setMessage('');
      setError('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetAppointmentID = appointment?.appointmentID || appointment?.appointmentId || appointmentID;
  const targetDoctorID = appointment?.doctorID || appointment?.doctorId || appointment?.docId || doctorID;
  const displayDoctorName = doctorName || appointment?.doctorName || appointment?.docName || appointment?.name || 'Doctor';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    if (!targetAppointmentID) {
      setError('Missing appointment information.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = propToken || localStorage.getItem('token');
      const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
      const baseUrl = rawBackendUrl.endsWith('/api') ? rawBackendUrl : `${rawBackendUrl}/api`;
      const endpoint = `${baseUrl}/feedback/submit`;

      const payload = {
        appointmentID: targetAppointmentID,
        doctorID: targetDoctorID,
        rating: Number(rating),
        comments: comments.trim()
      };

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.success) {
        const successNotice = "Thank you! Your feedback has been submitted and is pending administrative approval.";
        setMessage(successNotice);
        setIsSuccess(true);

        if (typeof onSubmitSuccess === 'function') {
          onSubmitSuccess(response.data);
        }

        setTimeout(() => {
          if (typeof onClose === 'function') {
            onClose();
          }
        }, 2200);
      } else {
        setError(response.data?.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      const errMsg = err.response?.data?.message || err.message || 'An error occurred while submitting feedback.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && typeof onClose === 'function' && !loading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100 transition-all transform scale-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-5 text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Leave Your Feedback</h3>
          <p className="text-sm text-gray-500 mt-1">
            Share your consultation experience with <span className="font-semibold text-gray-700">{displayDoctorName}</span>
          </p>
        </div>

        {/* Success Alert */}
        {isSuccess && message && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center space-x-2 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-center space-x-2 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
              Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={loading || isSuccess}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none disabled:opacity-50"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 fill-gray-200 hover:text-amber-200'
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.116.488-.415.871-.84.627l-4.707-2.723a.563.563 0 00-.56 0l-4.707 2.723c-.425.246-.956-.139-.84-.627l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602c-.38-.325-.178-.948.32-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-center font-medium text-amber-600 mt-1">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Terrible'}
              </p>
            )}
          </div>

          {/* Comments Textarea */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Comments / Review
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={loading || isSuccess}
              placeholder="Write your feedback here..."
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-gray-700 text-sm placeholder-gray-400 resize-none disabled:bg-gray-50"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || rating < 1 || isSuccess}
              className="w-full py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : isSuccess ? (
                <span>Submitted!</span>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
