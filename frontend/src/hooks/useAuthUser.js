import { getAuthUser } from "../lib/api";
import { useQuery } from "@tanstack/react-query";

const useAuthUser = () => {
  const {
    data: authData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
  });

  const authUser = authData?.user;
  return { authUser, isLoading, error };
};

export default useAuthUser;
