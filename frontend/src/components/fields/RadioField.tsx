import { RadioGroup, RadioGroupProps, FormControl, FormErrorMessage } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import styles from "./Shared.module.css";

const RadioField: React.FC<FieldHookConfig<number> & RadioGroupProps> = ({ title, placeholder, children, ...props}) => {
    const [field, meta, util] = useField(props);

    return (
        <FormControl className={styles.control} isInvalid={!!meta.error && meta.touched}>
            <RadioGroup {...field} onChange={val => util.setValue(parseInt(val))}>
                {children}
            </RadioGroup>

            <FormErrorMessage className={styles.error}>{meta.error}</FormErrorMessage>
        </FormControl>
    )
};

export default RadioField;
