import { Button, Container, FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import api from "@shared/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminAuth: React.FC = () => {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        setError("");
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        try {
            await api.post("/admin/authenticate", { password });
        } catch (e: any) {
            return setError(e.response.data.message);
        }
        
        return navigate("/admin");
    }

    return (
        <Container maxW="container.lg" pt="2em">
            <form onSubmit={handleSubmit}>
                <FormControl isInvalid={!!error}>
                    <FormLabel>Admin password</FormLabel>
                    <Input type="password" value={password} onChange={handleChange} />
                    {error && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>
                <Button mt={4} onClick={handleSubmit}>Submit</Button>
            </form>
        </Container>
    );
}

export default AdminAuth;
