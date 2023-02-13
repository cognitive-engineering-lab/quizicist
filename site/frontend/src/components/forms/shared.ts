import { ExpandedIndex } from "@chakra-ui/react";
import Generation from "@shared/generation.type";

export type QuizUtilFormProps = {
    generation: Generation;
    setPanel: (index: ExpandedIndex) => void;
    onClose: () => void;
};
