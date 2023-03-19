import useSWR from "swr";
import { fetcher } from "@hooks/fetcher";
import { API_URL } from "@shared/consts";
import Generation from "@shared/generation.type"
import QuestionView from "./QuestionView";
import { DeleteIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Editable, EditableInput, EditablePreview, ExpandedIndex, Modal, ModalContent, ModalOverlay, Text, useDisclosure } from "@chakra-ui/react";
import styles from "./GenerationView.module.css";
import LoadingIconButton from "./buttons/LoadingIconButton";
import _ from "lodash";
import { useState } from "react";
import { useGenerationDelete, useGenerationUpdate } from "@hooks/mutation/mutationHooks";
import QuizUtilsModal, { UtilMode } from "./QuizUtilsModal";

type GenerationProps = { generation_id: number };
const GenerationView: React.FC<GenerationProps> = ({ generation_id }) => {
    const generation_url = `${API_URL}/generated/${generation_id}`;

    const { data: generation } = useSWR<Generation>(generation_url, fetcher);
    const [panel, setPanel] = useState<ExpandedIndex>(-1);
    const [util, setUtil] = useState<UtilMode>();

    const deleteGeneration = useGenerationDelete(generation_id);
    const updateGeneration = useGenerationUpdate(generation_id);

    if (!generation) {
        return <div>Loading generation...</div>
    }

    // remove deleted questions
    _.remove(generation.questions, (q) => q.deleted);

    return (
        <div style={{ marginBottom: "2em" }}>
            <Text fontSize='2xl' className={styles["title-container"]}>
                <Editable
                    display="inline-block"
                    defaultValue={generation.filename}
                    onSubmit={(filename) => updateGeneration({ filename })}
                >
                    <EditablePreview />
                    <EditableInput />
                </Editable>

                <Button
                    size="xs"
                    className={styles.utility}
                    aria-label="Write a custom question"
                    onClick={() => setUtil("customQuestion")}
                >
                    Add Custom Question
                </Button>

                <Button
                    size="xs"
                    className={styles.utility}
                    aria-label="Generate more questions"
                    onClick={() => setUtil("generateQuestions")}
                >
                    Generate More Questions
                </Button>

                <Button
                    size="xs"
                    className={styles.utility}
                    aria-label="Export your quiz"
                    onClick={() => setUtil("export")}
                >
                    Export
                </Button>

                <LoadingIconButton
                    size="sm"
                    className={styles.remove}
                    aria-label="Delete quiz"
                    icon={<DeleteIcon color="red.500" />}
                    loadingFunction={deleteGeneration}
                />
            </Text>

            <Accordion allowToggle onChange={setPanel} index={panel}>
                {generation.questions.map((q, i) => (
                    <AccordionItem>
                        <h2>
                            <AccordionButton>
                                <Box flex='1' textAlign='left' className={styles["accordion-question"]}>
                                    <b>Question {i + 1}:</b> {q.question}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <QuestionView key={q.id} question={q} generation={generation} />
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>

            <QuizUtilsModal
                generation={generation}
                onClose={() => setUtil(undefined)}
                setPanel={setPanel}
                util={util}
            />
        </div>
    )
}

export default GenerationView;
