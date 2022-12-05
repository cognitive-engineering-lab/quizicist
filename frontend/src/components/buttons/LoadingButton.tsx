import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

export type LoadingButtonProps = {
    loadingFunction: () => Promise<any>;
};

const LoadingButton: React.FC<LoadingButtonProps & ButtonProps> = ({ loadingFunction, children, ...props }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);

        await loadingFunction();

        setIsLoading(false);
    }

    return (
        <Button
            {...props}
            isLoading={isLoading}
            onClick={handleClick}
        >
            {children}
        </Button>
    )
};

export default LoadingButton;