import useSWR from "swr";
import { SERVER_URL } from "../shared/consts";
import Generation from "../shared/generation.type";
import { fetcher } from "./shared";

function useGenerations() {
  const { data, error } = useSWR<Generation[]>(`${SERVER_URL}/api/generated/all`, fetcher)

  return {
    generations: data,
    isLoading: !error && !data,
    isError: error
  }
}

export default useGenerations;
