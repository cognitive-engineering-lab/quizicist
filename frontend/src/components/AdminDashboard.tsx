import { fetcher } from "@hooks/fetcher";
import { SERVER_URL } from "@shared/consts";
import useSWR from "swr";
import AdminTable from "./AdminTable";

const AdminDashboard = () => {
    const { data: generations, isLoading } = useSWR(`${SERVER_URL}/admin/generated`, fetcher);

    if (isLoading) {
        return <div>Loading data...</div>;
    }

    return <AdminTable generations={generations} />;
}

export default AdminDashboard;
