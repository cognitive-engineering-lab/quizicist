import { ALL_GENERATIONS_URL, API_URL } from "@shared/consts";
import useMutationPost, { MutationPostOptions } from "./useMutationPost";

const getGenerationURL = (generationId: number) => `${API_URL}/generated/${generationId}`;

/** Create a custom question and update generation data */
export const useCustomQuestion = (generationId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        getGenerationURL(generationId),
        `${API_URL}/generated/${generationId}/new`,
        options
    );

    return (data: any) => trigger(data);
};

/** Delete a quiz */
export const useGenerationDelete = (generationId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        ALL_GENERATIONS_URL,
        `${API_URL}/generated/${generationId}/delete`,
        options
    );

    return () => trigger();
}

/** Add multiple questions */
export const useQuestionAdd = (generationId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        getGenerationURL(generationId),
        `${API_URL}/generated/${generationId}/more`,
        options
    );

    return (data: any) => trigger(data);
}

/** Update quiz data */
export const useGenerationUpdate = (generationId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        getGenerationURL(generationId),
        `${API_URL}/generated/${generationId}/update`,
        options
    );

    return (data: any) => trigger(data);
}

/** Create a quiz */
export const useGenerationCreate = (options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        ALL_GENERATIONS_URL,
        `${API_URL}/upload`,
        options
    );

    return (data: any) => trigger(data);
}

/** Update a question */
export const useQuestionUpdate = (generationId: number, questionId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        getGenerationURL(generationId),
        `${API_URL}/question/${questionId}/update`,
        options
    );

    return (data: any) => trigger(data);
}

/** Delete a question */
export const useQuestionDelete = (generationId: number, questionId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        getGenerationURL(generationId),
        `${API_URL}/question/${questionId}/delete`,
        options
    );

    return () => trigger();
}

/** Add answer choices to question */
export const useAnswerChoiceAdd = (generationId: number, questionId: number, options?: MutationPostOptions) => {
    const { trigger } = useMutationPost(
        getGenerationURL(generationId),
        `${API_URL}/question/${questionId}/more`,
        options
    );

    // TODO: allow the user to customize number of answers
    return () => trigger({ answers: 4 });
}
