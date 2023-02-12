export enum FeedbackTypes {
    unselected = 0,
    correct = 1,
    incorrect = 2,
}

// determine new feedback given existing and new feedback
export const getNewFeedback = (existing: FeedbackTypes, update: FeedbackTypes) => {
    // when choosing existing feedback value, reset to unselected
    if (update === existing) {
        return FeedbackTypes.unselected;
    }

    return update;
}
