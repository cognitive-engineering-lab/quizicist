import { Button, ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

export type LoadingButtonProps = {
    loadingFunction: () => Promise<any>;

    // props to apply when loading
    optimisticProps?: Omit<ButtonProps, "aria-label">;
};

const LoadingButton: React.FC<LoadingButtonProps & ButtonProps> = ({ loadingFunction, children, optimisticProps, ...props }) => {
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
        <Button
            {...props}
            isLoading={isLoading && !optimisticProps} // only show loading spinner if no optimistic props given
            onClick={handleClick}
        >
            {children}
        </Button>
    )
};

export default LoadingButton;