import { Alert, AlertDescription, AlertTitle, Box, Link, Text, useDisclosure } from "@chakra-ui/react";
import { PropsWithChildren } from "react";

type CollapsibleAlertProps = {
    storageKey: string;
    title: React.ReactNode;
    content: React.ReactNode;
}

// retrieve whether message should display from local storage
const shouldBeOpen = (key: string) => {
    const stored = localStorage.getItem(key);
    if (!stored) return true;

    return stored !== "1";
}

const CollapsibleAlert: React.FC<CollapsibleAlertProps> = ({ storageKey, title, content }) => {
    const ALERT_KEY = `quizicist:${storageKey}`;
    const { isOpen: isVisible, onOpen, onClose } = useDisclosure({ defaultIsOpen: shouldBeOpen(ALERT_KEY) });

    const toggle = () => {
        if (isVisible) {
            localStorage.setItem(ALERT_KEY, "1");
            onClose();
        } else {
            localStorage.setItem(ALERT_KEY, "0");
            onOpen();
        }
    }

    const ToggleLink: React.FC<PropsWithChildren> = ({ children }) => (
        <Link onClick={toggle} textDecoration="underline">
            <Text fontSize="sm">{children}</Text>
        </Link>
    );

    if (isVisible) {
        content = (
            <>
                <div>{content}</div>
                <ToggleLink>Dismiss</ToggleLink>
            </>
        )
    } else {
        content = (
            <ToggleLink>Show more</ToggleLink>
        )
    }

    return (
        <Alert status="info" mb="2em">
            <Box>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
                {content}
            </AlertDescription>
            </Box>
        </Alert>
    )
}

export default CollapsibleAlert;
