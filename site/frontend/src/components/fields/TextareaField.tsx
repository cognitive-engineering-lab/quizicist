import { FormControl, FormErrorMessage, FormLabel, Textarea, TextareaProps } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import styles from "./Shared.module.css";

const TextareaField: React.FC<FieldHookConfig<string> & TextareaProps> = ({ title, placeholder, ...props}) => {
    const [field, meta] = useField(props);
    
    return (
        <FormControl className={styles.control} isInvalid={!!meta.error && meta.touched}>
            <FormLabel>{title}</FormLabel>

            <Textarea {...field} placeholder={placeholder} />
            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default TextareaField;

