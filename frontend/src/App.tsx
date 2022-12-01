import { Container, Divider, Text } from "@chakra-ui/react";
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
    <Container maxW="container.lg">
      <Upload />

      <Divider className={styles.divider} />

      {generations?.map((g) => (
        <GenerationView key={g} generation_id={g} />
      ))}
      {generations?.length === 0 && <Text fontSize="large">You don't have any quizzes</Text>}
    </Container>
  );
}

export default Home;
