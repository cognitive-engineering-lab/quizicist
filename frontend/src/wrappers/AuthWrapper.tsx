import { useDisclosure } from "@chakra-ui/react";
import api from "@shared/api";
import { AUTH_URL } from "@shared/consts";
import { useEffect } from "react";
import { SWRConfig } from "swr";

const AuthWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const authenticate = async () => {
        onOpen();

        await api.post(`${AUTH_URL}/authenticate`);

        onClose();
    }

    const checkAuthed = async () => {
        const res = await api.get(`${AUTH_URL}/authenticated`);
        
        if (!res.data.authenticated) {
            authenticate();
        }
    }

    // check user is authenticated on mount
    useEffect(() => { checkAuthed() }, []);

    if (isOpen) {
        return <div>Authenticating...</div>;
    }

    return (
        <SWRConfig
            value={{
                revalidateOnFocus: false,
                onError: async (error) => {
                    if (error.response.status === 401) {
                        authenticate();
                    }
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}

export default AuthWrapper;
