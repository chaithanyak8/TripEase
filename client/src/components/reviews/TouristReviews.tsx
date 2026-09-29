import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Review } from '../../types';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Plus,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

export const TouristReviews: React.FC = () => {
  const { activeTrip, showToast } = useApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  // Review Form state
  const [author, setAuthor] = useState('Pooja Hegde');
  const [travelerType, setTravelerType] = useState('Family Explorer');
  const [rating, setRating] = useState(5);
  const [itemTitle, setItemTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    setItemTitle(activeTrip?.destination || '');
  }, [activeTrip?.id, activeTrip?.destination]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author,
          travelerType,
          rating,
          comment,
          itemTitle
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReviews(prev => [data.review, ...prev]);
        setComment('');
        setIsWriteReviewOpen(false);
        showToast("Review submitted and marked as Verified Booking!");
      }
    } catch (err) {
      console.error(err);
      showToast("Submission failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Verified Community Reviews</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Authentic Traveler Stories & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
            Only tourists who completed verified stays or booked experiences can write verified reviews, eliminating bots and fake ratings.
          </p>
        </div>

        <button
          onClick={() => setIsWriteReviewOpen(true)}
          className="bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs px-5 py-3 rounded-2xl shadow transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-sky-600" />
          <span>Write a Verified Review</span>
        </button>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map(rev => (
          <div
            key={rev.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {rev.verifiedBooking && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Booking</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900">{rev.itemTitle}</h4>
                <div className="text-[11px] text-sky-600 font-semibold">{rev.itemType}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{rev.comment}"
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                <strong className="text-slate-900 block font-bold">{rev.author}</strong>
                <span className="text-[10px] text-slate-400">{rev.travelerType} • {rev.date}</span>
              </div>
              <button
                onClick={() => showToast(`Marked helpful! (${rev.likes + 1} helpful votes)`)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 font-medium cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Helpful ({rev.likes})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Write Review Modal */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <form onSubmit={handlePostReview} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-base text-slate-900">Share Your Experience</h3>
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination / Stay Reviewed</label>
                  <input
                    type="text"
                    value={itemTitle}
                    onChange={e => setItemTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Traveler Type</label>
                  <select
                    value={travelerType}
                    onChange={e => setTravelerType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="Family Explorer">Family Explorer</option>
                    <option value="Solo Backpacker">Solo Backpacker</option>
                    <option value="Couple Getaway">Couple Getaway</option>
                    <option value="Adventure Friends">Adventure Friends</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Review</label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Describe the hospitality, food, cleanliness, and safety..."
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsWriteReviewOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
