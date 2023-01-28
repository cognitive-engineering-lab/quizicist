import { Button, Textarea, useClipboard } from "@chakra-ui/react"
import api from "@shared/api";
import { API_URL } from "@shared/consts";
import Generation from "@shared/generation.type";

type ExportTextboxProps = {
    value: string;
    generation: Generation;
    export_type: number;
};

const ExportTextbox: React.FC<ExportTextboxProps> = ({ value, generation, export_type }) => {
    const { onCopy, hasCopied } = useClipboard(value);

    const handleCopy = async () => {
        // copy value to clipboard
        onCopy();

        // log export on server
        await api.post(`${API_URL}/generated/${generation.id}/log_export`, { export_type });
    }
    
    return (
        <>
            <Textarea value={value} rows={10} mb="1em" disabled />
            <Button onClick={handleCopy}>
                {hasCopied ? "Copied" : "Copy to clipboard"}
            </Button>
        </>
    )
}

export default ExportTextbox;
