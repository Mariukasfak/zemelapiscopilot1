import React, { useState, useEffect } from 'react';
import { X, Star, Edit, Trash, Check, MessageSquare, ChevronLeft, ChevronRight, Maximize, Ban, Thermometer } from 'lucide-react';
import { Location, UserRole, LocationComment, LocationRating } from '../types';
import { supabase } from '../lib/supabase';
import WeatherComponent from './WeatherComponent';

interface LocationDetailsProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  isOpen,
  onClose,
  userRole
}) => {
  const [comments, setComments] = useState<LocationComment[]>([]);
  const [ratings, setRatings] = useState<LocationRating[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'ratings'>('details');
  const [isApproving, setIsApproving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [hasRated, setHasRated] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const [editingRating, setEditingRating] = useState<string | null>(null);

  // Fetch user session
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    
    getUser();
  }, []);

  // Fetch comments, ratings and weather data
  useEffect(() => {
    if (isOpen && location) {
      fetchComments();
      fetchRatings();
    }
  }, [isOpen, location]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('location_comments')
        .select('*')
        .eq('location_id', location.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('location_ratings')
        .select('*')
        .eq('location_id', location.id);
        
      if (error) throw error;
      
      setRatings(data || []);
      
      // Check if user has already rated
      if (user) {
        const userRating = data?.find(r => r.user_id === user.id);
        if (userRating) {
          setUserRating(userRating.rating);
          setUserReview(userRating.review || '');
          setHasRated(true);
        } else {
          // Reset if user hasn't rated
          setUserRating(0);
          setUserReview('');
          setHasRated(false);
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    
    try {
      setSubmittingComment(true);
      const { error } = await supabase
        .from('location_comments')
        .insert([
          {
            location_id: location.id,
            user_id: user.id,
            content: newComment,
            images: []
          }
        ]);
        
      if (error) throw error;
      
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Nepavyko pridėti komentaro. Bandykite dar kartą.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setEditedCommentContent(content);
  };

  const handleSaveEditedComment = async (commentId: string) => {
    if (!editedCommentContent.trim()) return;
    
    try {
      const { error } = await supabase
        .from('location_comments')
        .update({ content: editedCommentContent })
        .eq('id', commentId);
        
      if (error) throw error;
      
      // Update local state
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editedCommentContent } 
          : comment
      ));
      
      setEditingComment(null);
      setEditedCommentContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Nepavyko atnaujinti komentaro. Bandykite dar kartą.');
    }
  };

  const handleRateLocation = async () => {
    if (!user || userRating === 0) return;
    
    try {
      setSubmittingRating(true);
      
      if (hasRated) {
        // Update existing rating
        const { error } = await supabase
          .from('location_ratings')
          .update({
            rating: userRating,
            review: userReview
          })
          .eq('location_id', location.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        await fetchRatings();
        alert('Jūsų įvertinimas sėkmingai atnaujintas!');
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('location_ratings')
          .insert([
            {
              location_id: location.id,
              user_id: user.id,
              rating: userRating,
              review: userReview
            }
          ]);
          
        if (error) {
          if (error.message.includes('duplicate key')) {
            alert('Jūs jau įvertinote šią vietą. Galite redaguoti savo įvertinimą.');
          } else {
            throw error;
          }
        } else {
          await fetchRatings();
          alert('Jūsų įvertinimas sėkmingai išsaugotas!');
          setHasRated(true);
        }
      }
    } catch (error) {
      console.error('Error rating location:', error);
      alert('Nepavyko įvertinti vietos. Bandykite dar kartą.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleEditRating = async (ratingId: string, rating: number, review: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    setEditingRating(ratingId);
    setUserRating(rating);
    setUserReview(review || '');
  };

  const handleSaveEditedRating = async (ratingId: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    try {
      const { error } = await supabase
        .from('location_ratings')
        .update({
          rating: userRating,
          review: userReview
        })
        .eq('id', ratingId);
        
      if (error) throw error;
      
      // Update local state
      setRatings(ratings.map(rating => 
        rating.id === ratingId 
          ? { ...rating, rating: userRating, review: userReview } 
          : rating
      ));
      
      setEditingRating(null);
      alert('Įvertinimas sėkmingai atnaujintas!');
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Nepavyko atnaujinti įvertinimo. Bandykite dar kartą.');
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    if (window.confirm('Ar tikrai norite ištrinti šį įvertinimą?')) {
      try {
        const { error } = await supabase
          .from('location_ratings')
          .delete()
          .eq('id', ratingId);
          
        if (error) throw error;
        
        // Update local state
        setRatings(ratings.filter(r => r.id !== ratingId));
      } catch (error) {
        console.error('Error deleting rating:', error);
        alert('Nepavyko ištrinti įvertinimo. Bandykite dar kartą.');
      }
    }
  };

  const handleApproveLocation = async () => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    try {
      setIsApproving(true);
      const { error } = await supabase
        .from('locations')
        .update({ is_approved: true })
        .eq('id', location.id);
        
      if (error) throw error;
      
      // Update local state
      location.is_approved = true;
      alert('Vieta sėkmingai patvirtinta!');
    } catch (error) {
      console.error('Error approving location:', error);
      alert('Nepavyko patvirtinti vietos. Bandykite dar kartą.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleNextImage = () => {
    if (location.images && location.images.length > 0) {
      setCurrentImageIndex((currentImageIndex + 1) % location.images.length);
    }
  };

  const handlePrevImage = () => {
    if (location.images && location.images.length > 0) {
      setCurrentImageIndex((currentImageIndex - 1 + location.images.length) % location.images.length);
    }
  };

  const handleEnlargeImage = (url: string) => {
    setEnlargedImage(url);
  };

  const handleSetMainImage = async () => {
    if (userRole !== 'admin' && userRole !== 'moderator' && user?.id !== location.created_by) return;
    
    try {
      const { error } = await supabase
        .from('locations')
        .update({ main_image_index: currentImageIndex })
        .eq('id', location.id);
        
      if (error) throw error;
      
      // Update local state
      location.main_image_index = currentImageIndex;
      alert('Pagrindinė nuotrauka pakeista!');
    } catch (error) {
      console.error('Error updating main image:', error);
      alert('Nepavyko pakeisti pagrindinės nuotraukos. Bandykite dar kartą.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    if (window.confirm('Ar tikrai norite ištrinti šį komentarą?')) {
      try {
        const { error } = await supabase
          .from('location_comments')
          .delete()
          .eq('id', commentId);
          
        if (error) throw error;
        
        // Update local state
        setComments(comments.filter(c => c.id !== commentId));
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Nepavyko ištrinti komentaro. Bandykite dar kartą.');
      }
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    
    if (window.confirm('Ar tikrai norite užblokuoti šį vartotoją?')) {
      try {
        // In a real app, you would update a blocked_users table
        // For now, just update local state
        setBlockedUsers([...blockedUsers, userId]);
        alert('Vartotojas užblokuotas!');
      } catch (error) {
        console.error('Error blocking user:', error);
        alert('Nepavyko užblokuoti vartotojo. Bandykite dar kartą.');
      }
    }
  };

  if (!isOpen) return null;

  // Calculate average rating
const avgRating = ratings.length > 0 
? Number((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1))
: 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      {/* Enlarged image overlay */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1100]"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={enlargedImage} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
              onClick={() => setEnlargedImage(null)}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">{location.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 ${activeTab === 'details' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Informacija
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'comments' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Komentarai
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'ratings' ? 'border-b-2 border-blue-500 font-medium' : '' }`}
            onClick={() => setActiveTab('ratings')}
          >
            Įvertinimai
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div>
              {/* Location images */}
              {location.images && location.images.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <img 
                      src={location.images[currentImageIndex]} 
                      alt={`${location.name} - ${currentImageIndex + 1}`} 
                      className="w-full h-64 object-cover rounded cursor-pointer"
                      onClick={() => handleEnlargeImage(location.images[currentImageIndex])}
                    />
                    
                    {location.images.length > 1 && (
                      <>
                        <button 
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevImage();
                          }}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button 
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextImage();
                          }}
                        >
                          <ChevronRight size={20} />
                        </button>
                        <button 
                          className="absolute right-2 top-2 bg-black bg-opacity-50 text-white p-1 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnlargeImage(location.images[currentImageIndex]);
                          }}
                        >
                          <Maximize size={20} />
                        </button>
                      </>
                    )}
                    
                    {location.images.length > 1 && (
                      <div className="flex justify-center mt-2 space-x-1">
                        {location. images.map((_, index) => (
                          <button 
                            key={index}
                            className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Set as main image button */}
                    {(userRole === 'admin' || userRole === 'moderator' || user?.id === location.created_by) && (
                      <button
                        className="absolute left-2 top-2 bg-blue-500 text-white text-xs py-1 px-2 rounded"
                        onClick={handleSetMainImage}
                      >
                        Nustatyti kaip pagrindinę
                      </button>
                    )}
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
                  {location.categories.map(category => {
                    const categoryLabels: Record<string, string> = {
                      'fishing': 'Žvejyba',
                      'swimming': 'Maudymasis',
                      'camping': 'Stovyklavietė',
                      'rental': 'Nuoma',
                      'paid': 'Mokama zona',
                      'free': 'Nemokama zona',
                      'private': 'Privati teritorija',
                      'public': 'Vieša teritorija',
                      'bonfire': 'Laužavietė',
                      'playground': 'Vaikų žaidimų aikštelė',
                      'picnic': 'Pikniko vieta',
                      'campsite': 'Kempingas',
                      'extreme': 'Ekstremalaus sporto vieta',
                      'ad': 'Reklama'
                    };
                    
                    return (
                      <span 
                        key={category}
                        className={`text-xs px-2 py-1 rounded-full ${
                          category === 'ad' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {categoryLabels[category] || category}
                      </span>
                    );
                  })}
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
              
              <WeatherComponent 
  latitude={location.latitude}
  longitude={location.longitude}
  locationName={location.name}
/>
              
              {/* Admin/Moderator actions */}
              {(userRole === 'admin' || userRole === 'moderator') && !location.is_approved && (
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
              )}
            </div>
          )}
          
          {activeTab === 'comments' && (
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
                              onClick={() => handleEnlargeImage(url)}
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
          )}
          
          {activeTab === 'ratings' && (
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
                                  <button
                                    onClick={() => handleBlockUser(rating.user_id)}
                                    className="text-orange-500 hover:text-orange-700"
                                    title="Blokuoti vartotoją"
                                  >
                                    <Ban size={14} />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationDetails;