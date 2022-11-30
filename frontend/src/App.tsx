import { Container, Divider } from "@chakra-ui/react";
import GenerationView from "@components/GenerationView";
import Upload from "@components/Upload";
import useGenerations from "@hooks/useGenerations";
import styles from "./App.module.css";

function Home() {
  const { isLoading, generations } = useGenerations();

  if (isLoading) {
    return <div>Loading generations...</div>;
  }

  return (
    <Container>
      <Upload />
      <Divider className={styles.divider} />
      {generations?.map((g) => (
        <GenerationView key={g} generation_id={g} />
      ))}
    </Container>
  );
}

export default Home;
