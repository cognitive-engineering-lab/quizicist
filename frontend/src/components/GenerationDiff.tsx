import Generation from "@shared/generation.type";
import ReactDiffViewer from "react-diff-viewer";
import { exportToText } from "./forms/utils";

type GenerationDiffProps = { generation: Generation };
const GenerationDiff: React.FC<GenerationDiffProps> = ({ generation }) => {
    const original = exportToText(
        generation,
        {
            customQuestions: true,
            deletedAnswers: true,
            deletedQuestions: true,
            originalText: true,
        });
    
    const current = exportToText(generation, {});

    return <ReactDiffViewer oldValue={original} newValue={current} splitView={true} />;
};

export default GenerationDiff;
