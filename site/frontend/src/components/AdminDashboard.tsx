import { Container, Spacer } from "@chakra-ui/react";
import { fetcher } from "@hooks/fetcher";
import { SERVER_URL } from "@shared/consts";
import Generation from "@shared/generation.type";
import { useState } from "react";
import useSWR from "swr";
import AdminTable from "./AdminTable";
import GenerationDiff from "./GenerationDiff";

const AdminDashboard = () => {
    const { data: generations, isLoading, error } = useSWR(`${SERVER_URL}/admin/generated`, fetcher);
    const [generation, setGeneration] = useState<null | Generation>(null);

    if (isLoading || error) {
        return <div>Loading data...</div>;
    }

    return (
        <Container maxW="container.xl" pt="2em" pb="2em">
            <AdminTable generations={generations} setGeneration={setGeneration} />
            
            <Spacer py="1em" />

            {generation && <GenerationDiff generation={generation} />}
        </Container>
    );
}

export default AdminDashboard;
