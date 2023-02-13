import { FormControl, FormErrorMessage, Select, SelectProps } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import styles from "./Shared.module.css";

type SelectFieldProps = { values: string[]; }
const SelectField: React.FC<FieldHookConfig<string> & SelectProps & SelectFieldProps> = ({ title, placeholder, values, ...props}) => {
    const [field, meta] = useField(props);
    
    return (
        <FormControl className={styles.control} isInvalid={!!meta.error && meta.touched}>
            {title}

            <Select {...field}>
                {values.map(v => <option value={v}>{v}</option>)}
            </Select>

            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default SelectField;
