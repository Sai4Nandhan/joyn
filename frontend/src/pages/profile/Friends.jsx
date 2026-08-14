import React, { useEffect, useState, useCallback, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Heart, MessageCircle, CheckCircle2, UserPlus, Clock, Check, X, Users, UserCheck } from 'lucide-react';
import { Layout } from '../../components/layout/Layout.jsx';
import { api } from '../../lib/axios.js';
import { AuthContext } from '../../context/AuthContext.jsx';
import { NotificationContext } from '../../context/NotificationContext.jsx';
import { getImageUrl, handleImageError } from '../../utils/imageUrl.js';
import {
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  listFriendRequestsApi,
  listFriendsApi,
  removeFriendApi,
} from '../../services/friendService.js';

export default function Friends() {
  const { user: currentUser } = useContext(AuthContext);
  const { sync: syncNotifications } = useContext(NotificationContext);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'community';

  const setActiveTab = (newTab) => {
    const params = new URLSearchParams(searchParams);
    if (newTab && newTab !== 'community') {
      params.set('tab', newTab);
    } else {
      params.delete('tab');
    }
    setSearchParams(params, { replace: false });
  };
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, requestsData, friendsList] = await Promise.all([
        api.get('/users').catch(() => ({ data: { data: { users: [] } } })),
        listFriendRequestsApi().catch(() => ({ incoming: [], outgoing: [] })),
        listFriendsApi().catch(() => []),
      ]);

      setUsers(usersRes.data?.data?.users || []);
      setIncomingRequests(requestsData.incoming || []);
      setOutgoingRequests(requestsData.outgoing || []);
      setFriends(friendsList || []);
    } catch (err) {
      console.error('Error loading friends data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendRequest = async (targetUserId) => {
    setActionLoadingId(targetUserId);
    try {
      await sendFriendRequestApi(targetUserId);
      await loadData();
      syncNotifications();
    } catch (err) {
      console.error('Failed to send friend request', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await acceptFriendRequestApi(requestId);
      await loadData();
      syncNotifications();
    } catch (err) {
      console.error('Failed to accept friend request', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await rejectFriendRequestApi(requestId);
      await loadData();
      syncNotifications();
    } catch (err) {
      console.error('Failed to reject friend request', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setActionLoadingId(friendId);
    try {
      await removeFriendApi(friendId);
      await loadData();
    } catch (err) {
      console.error('Failed to remove friend', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const friendIdSet = new Set(friends.map((f) => f.id || f._id));
  const pendingOutgoingSet = new Set(outgoingRequests.map((r) => r.recipient?.id || r.recipient?._id));
  const incomingRequestMap = new Map(incomingRequests.map((r) => [r.sender?.id || r.sender?._id, r]));

  const filteredUsers = users.filter((u) => {
    const id = u.id || u._id;
    if (currentUser && id === (currentUser.id || currentUser._id)) return false;
    const term = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.bio?.toLowerCase().includes(term)
    );
  });

  const filteredFriends = friends.filter((f) => {
    const term = search.toLowerCase();
    return (
      f.name?.toLowerCase().includes(term) ||
      f.bio?.toLowerCase().includes(term)
    );
  });

  return (
    <Layout>
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-800">Community & Friends</h1>
            <p className="text-sm text-ink-400 mt-1">
              Connect with verified members, manage friend requests, and start real-time conversations.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-ink-100/70 p-1.5 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'community'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Find People
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'requests'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Requests
              {incomingRequests.length > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-brand-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {incomingRequests.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'friends'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-800'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              My Friends ({friends.length})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            placeholder="Search members by name, bio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink-800 outline-none placeholder-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          </div>
        ) : activeTab === 'requests' ? (
          /* INCOMING FRIEND REQUESTS TAB */
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink-700 uppercase tracking-wider mb-2">
              Pending Friend Requests ({incomingRequests.length})
            </h2>
            {incomingRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-white p-8 text-center text-ink-400 text-sm">
                No pending incoming friend requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingRequests.map((req) => {
                  const sender = req.sender || {};
                  const id = sender.id || sender._id;
                  const avatar = getImageUrl(sender.avatarUrl, sender.name || 'User');
                  const isProcessing = actionLoadingId === req._id;

                  return (
                    <div
                      key={req._id}
                      className="rounded-xl bg-white border border-brand-100 p-5 shadow-card flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={avatar}
                          alt={sender.name}
                          onError={(e) => handleImageError(e, sender.name)}
                          className="h-12 w-12 rounded-xl object-cover bg-ink-50 flex-shrink-0 border border-ink-100"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5 truncate">
                            <Link to={`/users/${id}`} className="hover:text-brand-500 transition-colors">
                              {sender.name}
                            </Link>
                            {sender.isIdentityVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                            )}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-2xs font-semibold text-ink-400">
                            <span className="flex items-center gap-0.5 text-accent-red">
                              <Heart className="h-3 w-3 fill-accent-red" />
                              Trust Score: {sender.trustScore ?? 50}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-ink-500 line-clamp-2">
                            {sender.bio || 'Wants to connect as friends on JOYN.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleAcceptRequest(req._id)}
                          className="h-8 px-3 rounded-lg text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRejectRequest(req._id)}
                          className="h-8 px-3 rounded-lg text-xs font-bold border border-ink-200 text-ink-600 hover:bg-ink-50 transition-all flex items-center justify-center gap-1 disabled:opacity-60"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'friends' ? (
          /* MY FRIENDS TAB */
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink-700 uppercase tracking-wider mb-2">
              My Connected Friends ({filteredFriends.length})
            </h2>
            {filteredFriends.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-white p-8 text-center text-ink-400 text-sm">
                No connected friends yet. Browse "Find People" to connect!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriends.map((friend) => {
                  const id = friend.id || friend._id;
                  const avatar = getImageUrl(friend.avatarUrl, friend.name || 'Friend');
                  const isProcessing = actionLoadingId === id;

                  return (
                    <div
                      key={id}
                      className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={avatar}
                          alt={friend.name}
                          onError={(e) => handleImageError(e, friend.name)}
                          className="h-12 w-12 rounded-xl object-cover bg-ink-50 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5 truncate">
                            <Link to={`/users/${id}`} className="hover:text-brand-500 transition-colors">
                              {friend.name}
                            </Link>
                            {friend.isIdentityVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                            )}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-2xs font-semibold text-ink-400">
                            <span className="flex items-center gap-0.5 text-accent-red">
                              <Heart className="h-3 w-3 fill-accent-red" />
                              Trust Score: {friend.trustScore ?? 50}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-ink-500 line-clamp-2">
                            {friend.bio || 'Connected friend.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link
                          to={`/messages?user=${id}`}
                          className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Message
                        </Link>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRemoveFriend(id)}
                          className="h-7 px-2.5 rounded-lg text-2xs font-semibold text-ink-400 hover:text-red-600 transition-colors hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* COMMUNITY FIND PEOPLE TAB */
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-ink-700 uppercase tracking-wider mb-2">
              Community Members ({filteredUsers.length})
            </h2>
            {filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-white p-8 text-center text-ink-400 text-sm">
                {search ? 'No members found matching your search.' : 'No other community members registered yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((member) => {
                  const id = member.id || member._id;
                  const isFriend = friendIdSet.has(id);
                  const isPendingOutgoing = pendingOutgoingSet.has(id);
                  const incomingReq = incomingRequestMap.get(id);
                  const avatar = getImageUrl(member.avatarUrl, member.name || 'Member');
                  const isProcessing = actionLoadingId === id || actionLoadingId === incomingReq?._id;

                  return (
                    <div
                      key={id}
                      className="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-md transition-shadow flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={avatar}
                          alt={member.name}
                          onError={(e) => handleImageError(e, member.name)}
                          className="h-12 w-12 rounded-xl object-cover bg-ink-50 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5 truncate">
                            <Link to={`/users/${id}`} className="hover:text-brand-500 transition-colors">
                              {member.name}
                            </Link>
                            {member.isIdentityVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green flex-shrink-0" />
                            )}
                          </h3>

                          <div className="flex items-center gap-2.5 mt-0.5 text-2xs font-semibold text-ink-400">
                            <span className="flex items-center gap-0.5 text-accent-red">
                              <Heart className="h-3 w-3 fill-accent-red" />
                              Trust Score: {member.trustScore ?? 50}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-ink-500 line-clamp-2">
                            {member.bio || 'No bio provided.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                        {isFriend ? (
                          <span className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Friends
                          </span>
                        ) : incomingReq ? (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleAcceptRequest(incomingReq._id)}
                            className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-sm disabled:opacity-60"
                          >
                            <Check className="h-3.5 w-3.5" /> Accept Request
                          </button>
                        ) : isPendingOutgoing ? (
                          <span className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-200 bg-amber-50 text-amber-700">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            Request Sent
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleSendRequest(id)}
                            className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-brand-200 bg-white text-brand-600 hover:bg-brand-50 transition-all disabled:opacity-60"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Add Friend
                          </button>
                        )}

                        <Link
                          to={`/messages?user=${id}`}
                          aria-label={`Message ${member.name}`}
                          className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors border border-ink-200 bg-ink-50 text-ink-600 hover:bg-ink-100"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
