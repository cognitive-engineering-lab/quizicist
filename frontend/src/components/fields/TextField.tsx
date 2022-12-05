import { FormControl, FormErrorMessage, FormLabel, Input, InputProps } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import styles from "./Shared.module.css";

const TextField: React.FC<FieldHookConfig<string> & InputProps> = ({ title, placeholder, children, ...props}) => {
    const [field, meta] = useField(props);
    
    return (
        <FormControl className={styles.control} isInvalid={!!meta.error && meta.touched}>
            <FormLabel>
                {title}
                {children}
            </FormLabel>

            <Input {...field} placeholder={placeholder} />
            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default TextField;
