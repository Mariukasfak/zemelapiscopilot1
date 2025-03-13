import React from 'react';
import { Star, Edit, Trash, Ban, Thermometer, Check, Droplets, Wind } from 'lucide-react';
import { Location, LocationRating, LocationComment, UserRole } from '../types';

// Komponentas vietos detalėms
export const LocationInfo: React.FC<{
  location: Location;
  weatherLastUpdated: Date | null;
}> = ({ location, weatherLastUpdated }) => {
  return (
    <div>
      {/* Location images */}
      {location.images && location.images.length > 0 && (
        <div className="mb-4">
          <div className="relative h-48 rounded-md overflow-hidden">
            <img 
              src={location.images[0]} 
              alt={location.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      {/* Description */}
      <div className="mb-4">
        <h3 className="font-medium mb-1">Aprašymas</h3>
        <p className="text-gray-700">{location.description || 'Aprašymas nepateiktas'}</p>
      </div>
      
      {/* Categories */}
      <div className="mb-4">
        <h3 className="font-medium mb-1">Kategorijos</h3>
        <div className="flex flex-wrap gap-1">
          {(location.categories || []).map(category => (
            <span key={category} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {category}
            </span>
          ))}
        </div>
      </div>
      
      {/* Status */}
      <div className="mb-4">
        <h3 className="font-medium mb-1">Statusas</h3>
        <div className="flex space-x-4">
          <span className={`text-sm ${location.is_paid ? 'text-amber-500' : 'text-green-500'}`}>
            {location.is_paid ? 'Mokama vieta' : 'Nemokama vieta'}
          </span>
          <span className={`text-sm ${location.is_public ? 'text-green-500' : 'text-red-500'}`}>
            {location.is_public ? 'Vieša teritorija' : 'Privati teritorija'}
          </span>
        </div>
      </div>
      
      {/* Weather data */}
      {location.weather_data && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <h3 className="font-medium mb-1">Oras dabar</h3>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-3xl font-semibold">{location.weather_data.temp}°C</div>
              <div className="text-sm text-gray-600">{location.weather_data.description}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center text-sm text-gray-600">
                <Droplets size={16} className="mr-1" />
                Drėgmė: {location.weather_data.humidity}%
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Wind size={16} className="mr-1" />
                Vėjas: {location.weather_data.windSpeed} m/s
              </div>
            </div>
          </div>
          {weatherLastUpdated && (
            <div className="text-xs text-gray-500 flex items-center justify-end mt-2">
              <Thermometer size={12} className="mr-1" /> 
              Atnaujinta: {weatherLastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Komponentas komentarų sekcijai
export const CommentsSection: React.FC<{
  comments: LocationComment[];
  newComment: string;
  setNewComment: (comment: string) => void;
  handleAddComment: () => void;
  submittingComment: boolean;
  user: any;
  userRole: UserRole;
  editingComment: string | null;
  editedCommentContent: string;
  setEditedCommentContent: (content: string) => void;
  handleEditComment: (commentId: string, content: string) => void;
  handleSaveEditedComment: (commentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  handleBlockUser: (userId: string) => void;
  setEditingComment: (commentId: string | null) => void;
  loading: boolean;
}> = ({
  comments,
  newComment,
  setNewComment,
  handleAddComment,
  submittingComment,
  user,
  userRole,
  editingComment,
  editedCommentContent,
  setEditedCommentContent,
  handleEditComment,
  handleSaveEditedComment,
  handleDeleteComment,
  handleBlockUser,
  setEditingComment,
  loading
}) => {
  return (
    <div>
      {/* Add comment */}
      {user ? (
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Parašykite komentarą..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md disabled:bg-blue-300"
            >
              {submittingComment ? 'Siunčiama...' : 'Komentuoti'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-100 rounded-md text-center">
          <p className="text-gray-600">Prisijunkite, kad galėtumėte komentuoti</p>
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="border rounded-md p-3">
              <div className="flex justify-between items-start">
                <div className="font-medium">{comment.username || 'Vartotojas'}</div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </div>
                  
                  {/* Admin actions */}
                  {(userRole === 'admin' || userRole === 'moderator' || user?.id === comment.user_id) && (
                    <div className="flex space-x-1">
                      {(userRole === 'admin' || userRole === 'moderator') && (
                        <>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Ištrinti komentarą"
                          >
                            <Trash size={14} />
                          </button>
                          <button
                            onClick={() => handleBlockUser(comment.user_id)}
                            className="text-orange-500 hover:text-orange-700"
                            title="Blokuoti vartotoją"
                          >
                            <Ban size={14} />
                          </button>
                        </>
                      )}
                      {(userRole === 'admin' || userRole === 'moderator' || user?.id === comment.user_id) && (
                        <button
                          onClick={() => handleEditComment(comment.id, comment.content)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Redaguoti komentarą"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {editingComment === comment.id ? (
                <div className="mt-2">
                  <textarea
                    value={editedCommentContent}
                    onChange={(e) => setEditedCommentContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Atšaukti
                    </button>
                    <button
                      onClick={() => handleSaveEditedComment(comment.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md"
                    >
                      Išsaugoti
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-gray-700">{comment.content}</p>
              )}
              
              {comment.images && comment.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {comment.images.map((url, index) => (
                    <img 
                      key={index}
                      src={url} 
                      alt={`Comment image ${index + 1}`} 
                      className="w-full h-24 object-cover rounded cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-gray-500">
            Kol kas nėra komentarų
          </div>
        )}
      </div>
    </div>
  );
};

// Komponentas reitingų sekcijai
export const RatingsSection: React.FC<{
  ratings: LocationRating[];
  avgRating: number;
  userRating: number;
  setUserRating: (rating: number) => void;
  userReview: string;
  setUserReview: (review: string) => void;
  handleRateLocation: () => void;
  user: any;
  userRole: UserRole;
  hasRated: boolean;
  submittingRating: boolean;
  editingRating: string | null;
  setEditingRating: (id: string | null) => void;
  handleEditRating: (ratingId: string, rating: number, review: string) => void;
  handleSaveEditedRating: (ratingId: string) => void;
  handleDeleteRating: (ratingId: string) => void;
}> = ({
  ratings,
  avgRating,
  userRating,
  setUserRating,
  userReview,
  setUserReview,
  handleRateLocation,
  user,
  userRole,
  hasRated,
  submittingRating,
  editingRating,
  setEditingRating,
  handleEditRating,
  handleSaveEditedRating,
  handleDeleteRating
}) => {
  return (
    <div>
      {/* Average rating */}
      <div className="mb-4 p-4 bg-gray-50 rounded-md text-center">
        <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center">
          <Star className="mr-1" size={24} />
          {avgRating > 0 ? avgRating.toFixed(1) : '0'} / 5
        </div>
        <p className="text-sm text-gray-500">
          {ratings.length} {ratings.length === 1 ? 'įvertinimas' : 
           ratings.length > 1 && ratings.length < 10 ? 'įvertinimai' : 'įvertinimų'}
        </p>
      </div>
      
      {/* Add rating */}
      {user ? (
        <div className="mb-4 p-4 border rounded-md">
          <h3 className="font-medium mb-2">
            {hasRated ? 'Jūs jau įvertinote šią vietą' : 'Įvertinkite šią vietą'}
          </h3>
          <div className="flex mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setUserRating(star)}
                className={`text-2xl ${userRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            placeholder="Parašykite atsiliepimą (neprivaloma)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleRateLocation}
              disabled={userRating === 0 || submittingRating}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md disabled:bg-blue-300"
            >
              {submittingRating ? 'Siunčiama...' : hasRated ? 'Atnaujinti įvertinimą' : 'Įvertinti'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-100 rounded-md text-center">
          <p className="text-gray-600">Prisijunkite, kad galėtumėte įvertinti</p>
        </div>
      )}
      
      {/* Ratings list */}
      <div className="space-y-3">
        {ratings.length > 0 ? (
          ratings.map(rating => (
            <div key={rating.id} className="border-b pb-3">
              {editingRating === rating.id ? (
                <div className="mt-2">
                  <div className="flex mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        className={`text-2xl ${userRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Atsiliepimas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2 space-x-2">
                    <button
                      onClick={() => setEditingRating(null)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Atšaukti
                    </button>
                    <button
                      onClick={() => handleSaveEditedRating(rating.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md"
                    >
                      Išsaugoti
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {rating.username || 'Vartotojas'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < rating.rating ? 'text-yellow-500' : 'text-gray-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                      
                      {/* Admin actions */}
                      {(userRole === 'admin' || userRole === 'moderator') && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditRating(rating.id, rating.rating, rating.review || '')}
                            className="text-blue-500 hover:text-blue-700"
                            title="Redaguoti įvertinimą"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRating(rating.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Ištrinti įvertinimą"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {rating.review && (
                    <p className="mt-1 text-gray-700">{rating.review}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-gray-500">
            Kol kas nėra įvertinimų
          </div>
        )}
      </div>
    </div>
  );
};

// Komponentas administratorių veiksmams
export const AdminActions: React.FC<{
  location: Location;
  userRole: UserRole;
  handleApproveLocation: () => void;
  isApproving: boolean;
}> = ({ location, userRole, handleApproveLocation, isApproving }) => {
  if (userRole !== 'admin' && userRole !== 'moderator') return null;
  if (location.is_approved) return null;
  
  return (
    <div className="mt-4 p-3 bg-yellow-50 rounded-md">
      <h3 className="font-medium mb-1">Administratoriaus veiksmai</h3>
      <p className="text-sm text-yellow-700 mb-2">
        Ši vieta dar nepatvirtinta ir nėra matoma kitiems vartotojams.
      </p>
      <button
        onClick={handleApproveLocation}
        disabled={isApproving}
        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-md flex items-center text-sm"
      >
        <Check size={16} className="mr-1" />
        {isApproving ? 'Tvirtinama...' : 'Patvirtinti vietą'}
      </button>
    </div>
  );
};
