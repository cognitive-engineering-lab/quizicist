import { useDisclosure, useToast } from "@chakra-ui/react";
import api from "@shared/api";
import { AUTH_URL } from "@shared/consts";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SWRConfig } from "swr";

const AuthWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const navigate = useNavigate();

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
                        // handle unauthenticated user
                        authenticate();
                    }
                    else if (error.response.status === 403) {
                        // handle authenticated user attempting to access admin data
                        navigate("/admin/authenticate");
                    }
                    else if (error.response.data.message) {
                        // display popup with backend error message
                        toast({
                            title: "Quizicist ran into an error",
                            description: error.response.data.message,
                            status: "error",
                            duration: 9000,
                            isClosable: true,
                        });
                    }
                    else {
                        // display popup with generic error message
                        toast({
                            title: "Quizicist ran into an error",
                            description: "If this continues happening, please provide feedback on the feedback page.",
                            status: "error",
                            duration: 9000,
                            isClosable: true,
                        });
                    }
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}

export default AuthWrapper;
