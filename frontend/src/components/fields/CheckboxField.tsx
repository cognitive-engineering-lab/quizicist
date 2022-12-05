import { Checkbox, CheckboxProps, FormControl, FormErrorMessage } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import styles from "./Shared.module.css";

const CheckboxField: React.FC<FieldHookConfig<string> & CheckboxProps> = ({ title, placeholder, ...props}) => {
    const [field, meta] = useField(props);
    
    return (
        <FormControl className={styles.control} isInvalid={!!meta.error && meta.touched}>
            <Checkbox {...field}>{title}</Checkbox>
            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default CheckboxField;
