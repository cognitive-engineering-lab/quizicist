import Question from "../shared/question.type"

type QuestionProps = {
    question: Question;
};

const QuestionView: React.FC<QuestionProps> = ({ question }) => {
    return (
        <div>Hello World</div>
    )
}

export default QuestionView;
