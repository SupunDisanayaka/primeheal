import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { submitComplaintAPI, getMyComplaintsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Complaints = () => {
  const { token, userData } = useContext(AppContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [complaintType, setComplaintType] = useState('service');
  const [description, setDescription] = useState('');

  const loadComplaints = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getMyComplaintsAPI();
      if (res.success) {
        setComplaints(res.complaints || []);
      }
    } catch (err) {
      console.error('Error loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe your complaint in detail.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitComplaintAPI({
        complaintType,
        description: description.trim()
      });

      if (res.success) {
        toast.success(res.message || 'Complaint submitted successfully.');
        setDescription('');
        setComplaintType('service');
        loadComplaints();
      } else {
        toast.error(res.message || 'Failed to submit complaint.');
      }
    } catch (err) {
      console.error('Submit complaint error:', err);
      toast.error(err.response?.data?.message || 'Error submitting complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm max-w-md w-full">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-sm text-gray-500 mb-6">
            Please log in to your patient account to submit a service concern or check status of existing complaints.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-xs hover:bg-primary/90 transition-colors"
          >
            Login to PrimeHeal
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Resolved</span>;
      case 'in-progress':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100">Investigating</span>;
      case 'closed':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-50 text-slate-500 border border-slate-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100">Open & Pending</span>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'service': return 'Care & Service Quality';
      case 'billing': return 'Billing & Payments';
      case 'technical': return 'Website / Technical';
      case 'staff': return 'Hospital Staff & Conduct';
      default: return 'General Grievance';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hospital Feedback & Grievance Portal</h1>
        <p className="text-sm text-gray-500 mt-1">
          We are committed to the highest patient care standards. Submit your concerns directly to hospital management.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Complaint Submission Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Submit a Complaint</h2>
            <p className="text-xs text-gray-400 mb-5">
              Assigned directly to our patient care administrators for investigation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category of Concern
                </label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-primary"
                >
                  <option value="service">Care & Service Quality</option>
                  <option value="billing">Billing, Fees & Invoices</option>
                  <option value="technical">Website & Technical Issues</option>
                  <option value="staff">Staff Attitude & Conduct</option>
                  <option value="other">Other Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description of Issue
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Please describe what happened, dates, doctor or department involved..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Transmitting Concern...' : 'Submit Grievance'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Columns: Complaint History & Live Resolution Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Submitted Concerns</h2>
                <p className="text-xs text-gray-400">Track investigation milestones and official resolutions.</p>
              </div>
              <button
                onClick={loadComplaints}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">Loading your complaints history...</div>
            ) : complaints.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                You have not filed any complaints. Our team is always here if you ever experience issues with your hospital care.
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((item) => (
                  <div
                    key={item.complaintID}
                    className="p-5 rounded-xl border border-zinc-100 bg-slate-50/50 flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                          {getTypeLabel(item.complaintType)}
                        </span>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Filed on: {item.createdAt ? String(item.createdAt).substring(0, 10) : 'Recent'}
                        </p>
                      </div>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed bg-white p-3.5 rounded-lg border border-zinc-100">
                      {item.description}
                    </p>

                    {/* Official Resolution details if present */}
                    {item.resolution && (
                      <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Hospital Resolution & Action Taken:
                        </div>
                        <p className="text-emerald-900 leading-relaxed pl-5">{item.resolution}</p>
                        {item.resolvedAt && (
                          <p className="text-[10px] text-emerald-600 pl-5 pt-0.5">
                            Resolved on: {String(item.resolvedAt).substring(0, 10)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaints;
