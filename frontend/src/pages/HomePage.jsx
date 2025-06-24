import React from "react";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  getUserFriends,
  getRecUsers,
  getOutgoingFriendReqs,
  sendFriendRequest,
} from "../lib/api";
import { useEffect } from "react";
import { Link } from "react-router";
import {
  UsersIcon,
  MapPinIcon,
  CheckCircleIcon,
  UserPlusIcon,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import { capitalize } from "../lib/utils";

const HomePage = () => {
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set()); // set of recipient ids the user has sent a request to

  const queryClient = useQueryClient();
  const { data: friends = [], isLoading: isLoadingFriends } = useQuery({
    // hit the get request
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recUsers = [], isLoading: isLoadingRecUsers } = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: getRecUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending: isPendingSendRequest } =
    useMutation({
      mutationFn: sendFriendRequest,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      },
    });

  useEffect(() => {
    const newOutgoingRequestsIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        newOutgoingRequestsIds.add(req.recipient._id);
      });
    }
    setOutgoingRequestsIds(newOutgoingRequestsIds);
  }, [outgoingFriendReqs]); // update outgoingRequestsIds when outgoingFriendReqs changes

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Your Friends
          </h2>
          <Link to="/notifications" className="btn btn-outline btn-sm">
            <UsersIcon className="mr-2 size-4" />
            Friend Requests
          </Link>
        </div>
        {isLoadingFriends ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : friends.length === 0 ? (
          <NoFriendsFound />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {friends.map((friend) => (
              <FriendCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Meet New Learners
                </h2>
                <p className="opacity-70">
                  Discover perfect language exchange partners based on your
                  profile
                </p>
              </div>
            </div>
          </div>

          {isLoadingRecUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : recUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                No recommendations available
              </h3>
              <p className="text-base-content opacity-70">
                Check back later for new language partners!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id); 
                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">
                            {user.fullName}
                          </h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          {getLanguageFlag(user.nativeLanguage)}
                          Native: {capitalize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitalize(user.learningLanguage)}
                        </span>
                      </div>
                      {user.bio && (
                        <p className="text-sm opacity-70">{user.bio}</p>
                      )}

                      <button
                        className={`btn w-full mt-2 btn-circle ${
                          hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                        } `}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPendingSendRequest}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;

