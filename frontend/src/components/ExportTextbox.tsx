import { Button, Textarea, useClipboard } from "@chakra-ui/react"

type ExportTextboxProps = { value: string };
const ExportTextbox: React.FC<ExportTextboxProps> = ({ value }) => {
    const { onCopy, hasCopied } = useClipboard(value);
    
    return (
        <>
            <Textarea value={value} rows={10} mb="1em" disabled />
            <Button onClick={onCopy}>
                {hasCopied ? "Copied" : "Copy to clipboard"}
            </Button>
        </>
    )
}

export default ExportTextbox;
