import React, { useState } from 'react';

const ReviewSection = ({ station, onAddReview }) => {
  const [showForm, setShowForm] = useState(false);
  const [review, setReview] = useState({ userName: '', rating: 5, comment: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!review.userName.trim()) return;
    onAddReview(station._id, review);
    setReview({ userName: '', rating: 5, comment: '' });
    setShowForm(false);
  };

  const avgRating = station.reviews?.length
    ? (station.reviews.reduce((sum, r) => sum + r.rating, 0) / station.reviews.length).toFixed(1)
    : 0;

  return (
    <div className="border-t pt-2 mt-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-gray-600">Reviews</span>
          <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <span>⭐</span>
            <span>{avgRating}</span>
            <span className="text-gray-400">({station.reviews?.length || 0})</span>
          </span>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="text-[9px] text-green-600 hover:text-green-700 font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Review'}
        </button>
      </div>

      {/* Add Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-2 rounded mb-2">
          <input
            type="text"
            placeholder="Your name *"
            value={review.userName}
            onChange={(e) => setReview({ ...review, userName: e.target.value })}
            className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded mb-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          />
          <select
            value={review.rating}
            onChange={(e) => setReview({ ...review, rating: parseInt(e.target.value) })}
            className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded mb-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="5">★★★★★ Excellent</option>
            <option value="4">★★★★☆ Good</option>
            <option value="3">★★★☆☆ Average</option>
            <option value="2">★★☆☆☆ Poor</option>
            <option value="1">★☆☆☆☆ Terrible</option>
          </select>
          <textarea
            placeholder="Your review (optional)"
            value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })}
            className="w-full px-2 py-1 text-[9px] border border-gray-200 rounded mb-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
            rows="2"
          />
          <button 
            type="submit" 
            className="w-full py-1 bg-green-600 text-white rounded hover:bg-green-700 text-[9px] font-medium"
          >
            Submit Review
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {station.reviews?.length > 0 ? (
          station.reviews.map((review, index) => (
            <div key={index} className="bg-gray-50 p-2 rounded">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[9px] font-medium text-gray-700">{review.userName}</span>
                <span className="text-[8px] text-yellow-600">
                  {Array(review.rating).fill('★').join('')}
                  {Array(5 - review.rating).fill('☆').join('')}
                </span>
              </div>
              {review.comment && (
                <p className="text-[8px] text-gray-600 italic leading-relaxed">"{review.comment}"</p>
              )}
              <p className="text-[7px] text-gray-400 mt-1">
                {new Date(review.date).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-3">
            <p className="text-[9px] text-gray-400">No reviews yet</p>
            <p className="text-[8px] text-gray-300 mt-1">Be the first to review!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;