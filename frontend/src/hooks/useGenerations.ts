import useSWR from "swr";
import { ALL_GENERATIONS_URL } from "../shared/consts";
import { fetcher } from "./shared";

function useGenerations() {
  const { data, error } = useSWR<number[]>(ALL_GENERATIONS_URL, fetcher)

  return {
    generations: data,
    isLoading: !error && !data,
    isError: error
  }
}

export default useGenerations;
