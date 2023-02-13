import { IconButton } from "@chakra-ui/react";
import { FieldHookConfig, useField } from "formik";
import styles from "./IconCheckbox.module.css";

type IconCheckboxProps = {
    iconWhenChecked: JSX.Element;
    iconWhenNot: JSX.Element;
    label: string;
};

const IconCheckbox: React.FC<FieldHookConfig<boolean> & IconCheckboxProps> = ({ title, iconWhenChecked, iconWhenNot, label, ...props}) => {
    const [field, _, helpers] = useField(props);
    
    return (
        <IconButton
            size="sm"
            className={styles.icon}
            aria-label={label}
            icon={field.value ? iconWhenChecked : iconWhenNot}
            onClick={() => helpers.setValue(!field.value)}
        />
    )
};

export default IconCheckbox;
