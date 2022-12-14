import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { useState } from "react";
import { LoadingButtonProps } from "./LoadingButton";

type LoadingIconButtonProps = {
    // props to apply when loading
    optimisticProps?: Omit<IconButtonProps, "aria-label">;
}

const LoadingIconButton: React.FC<LoadingButtonProps & IconButtonProps & LoadingIconButtonProps> = ({ loadingFunction, children, optimisticProps, ...props }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);

        await loadingFunction();

        setIsLoading(false);
    }

    // if loading, add optimistic data props
    if (isLoading) {
        props = {
            ...props,
            ...optimisticProps,
        }
    }

    return (
        <IconButton
            {...props}
            isLoading={isLoading && !optimisticProps}
            onClick={handleClick}
        >
            {children}
        </IconButton>
    )
};

export default LoadingIconButton;