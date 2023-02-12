import api from "@shared/api";
import Generation from "@shared/generation.type";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";
import { FetcherResponse } from "swr/_internal";

export type MutationPostOptions<T = Generation> = SWRMutationConfiguration<T, any, any, string>;

function useMutationPost<T>(mutationURL: string, postURL: string, options?: MutationPostOptions<T>) {
    const post = (_url: string, { arg }: any) => api.post(postURL, arg) as FetcherResponse<T>;
    
    return useSWRMutation(mutationURL, post, options);
}

export default useMutationPost;
