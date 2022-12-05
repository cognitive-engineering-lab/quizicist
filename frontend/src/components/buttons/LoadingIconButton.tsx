import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { useState } from "react";
import { LoadingButtonProps } from "./LoadingButton";

const LoadingIconButton: React.FC<LoadingButtonProps & IconButtonProps> = ({ loadingFunction, children, ...props }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);

        await loadingFunction();

        setIsLoading(false);
    }

    return (
        <IconButton
            {...props}
            isLoading={isLoading}
            onClick={handleClick}
        >
            {children}
        </IconButton>
    )
};

export default LoadingIconButton;