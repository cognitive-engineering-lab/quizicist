import { useDisclosure } from '@chakra-ui/hooks';
import ConsentModal from '@components/ConsentModal';
import Dashboard from '@components/Dashboard';
import api from '@shared/api'
import { AUTH_URL } from '@shared/consts'
import { SWRConfig } from 'swr'

const App: React.FC = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleConsentAccept = async () => {
        await api.post(`${AUTH_URL}/authenticate`);
        onClose();
    }

    return (
        <SWRConfig value={{
                revalidateOnFocus: false,
                onError: async (error) => {
                    if (error.response.status === 401) {
                        // open consent modal if unauthenticated
                        onOpen();
                    }
                }
            }}
        >
            {isOpen ?
                <ConsentModal handleAccept={handleConsentAccept} />
                :
                <Dashboard />
            }
        </SWRConfig>
    )
}

export default App;
