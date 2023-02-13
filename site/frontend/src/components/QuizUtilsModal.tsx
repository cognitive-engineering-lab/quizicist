import { Modal, ModalOverlay, ModalContent, ExpandedIndex, ModalBody, ModalCloseButton, ModalHeader } from "@chakra-ui/react";
import Generation from "@shared/generation.type";
import CustomQuestionForm from "./forms/CustomQuestionForm";
import ExportQuizForm from "./forms/ExportQuizForm";
import MoreQuestionsForm from "./forms/MoreQuestionsForm";

const UTIL_COMPONENTS = {
    customQuestion: CustomQuestionForm,
    export: ExportQuizForm,
    generateQuestions: MoreQuestionsForm,
}

const UTIL_DESCRIPTIONS = {
    customQuestion: "Write a custom question",
    export: "Export your quiz",
    generateQuestions: "Generate more questions",
}

export type UtilMode = keyof typeof UTIL_COMPONENTS;

type QuizUtilsModalProps = {
    generation: Generation;
    setPanel: (index: ExpandedIndex) => void;

    util?: UtilMode;
    onClose: () => void;
}

const QuizUtilsModal: React.FC<QuizUtilsModalProps> = ({ generation, setPanel, util, onClose }) => {
    if (!util) {
        return <></>;
    }

    const Component = UTIL_COMPONENTS[util];

    return (
        <Modal
            isOpen
            onClose={onClose}
            size="lg"
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{UTIL_DESCRIPTIONS[util]}</ModalHeader>
                <ModalCloseButton />

                <ModalBody pb={6}>
                    <Component
                        generation={generation}
                        setPanel={setPanel}
                        onClose={onClose}
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

export default QuizUtilsModal;