import { FormControl, FormErrorMessage, FormLabel, FormLabelProps, Hide, Input, InputProps, Show } from "@chakra-ui/react";
import { FieldHookConfig, useField, useFormikContext } from "formik";
import styles from "./Shared.module.css";

export type TextFieldProps = {
    submitOnBlur?: boolean;
    labelProps?: FormLabelProps;
}

const TextField: React.FC<FieldHookConfig<string> & InputProps & TextFieldProps> = ({ title, placeholder, children, submitOnBlur, labelProps, ...props}) => {
    const [field, meta] = useField(props);
    const { submitForm } = useFormikContext();
    
    // when the user stops editing the input, persist changes
    const onBlur: React.FocusEventHandler<HTMLInputElement> = async (e) => {
        // default field behavior
        field.onBlur(e);

        if (submitOnBlur) {
            await submitForm();
        }
    }
    
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

            <Input
                {...field}
                onBlur={onBlur}
                placeholder={placeholder}
            />
            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default TextField;
