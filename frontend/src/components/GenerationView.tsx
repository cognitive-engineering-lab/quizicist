import Generation from "../shared/generation.type"

type GenerationProps = {
    generation: Generation;
};

const GenerationView: React.FC<GenerationProps> = ({ generation }) => {
    return (
        <div>Hello World</div>
    )
}

export default GenerationView;
