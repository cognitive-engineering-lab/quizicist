import { FormControl, FormErrorMessage, FormLabel, Textarea, TextareaProps, Show, Hide } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import ResizeTextarea from "react-textarea-autosize";
import styles from "./Shared.module.css";
import { TextFieldProps } from "./TextField";

type TextareaFieldProps = {
    preventResize?: boolean;
};

const TextareaField: React.FC<FieldHookConfig<string> & TextFieldProps & TextareaProps & TextareaFieldProps> = ({ title, placeholder, labelProps, children, preventResize, ...props}) => {
    const [field, meta] = useField(props);
    
    return (
        <FormControl className={styles.control} isInvalid={!!meta.error && meta.touched}>
            <FormLabel {...labelProps}>
                {title}

                <Show breakpoint='(min-width: 30em)'>
                    {children}
                </Show>
            </FormLabel>

            <Hide breakpoint='(min-width: 30em)'>
                {children}
            </Hide>

            <Textarea {...field} as={preventResize ? undefined : ResizeTextarea} minH="0" placeholder={placeholder} />
            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default TextareaField;

