import { Divider, Link, ListItem, Stack, Text, UnorderedList } from "@chakra-ui/react";
import GenerationView from "@components/GenerationView";
import Upload from "@components/Upload";
import useGenerations from "@hooks/useGenerations";
import CollapsibleAlert from "./CollapsibleAlert";
import styles from "./Dashboard.module.css";

const Dashboard: React.FC = () => {
  const { isLoading, generations } = useGenerations();

  if (isLoading) {
    return <div>Loading generations...</div>;
  }

  return (
    <>
      <CollapsibleAlert
        storageKey="introduction-message"
        title="Welcome to Quizicist!"
        content={
          <Stack spacing={3}>
            <Text>
              Quizicist is an experimental, <Link href="https://github.com/connorff/quizicist" textDecoration="underline">open-source</Link> tool developed by Brown University researchers that uses AI to generate multiple-choice quizzes about educational material. You can use these quizzes to help your students actively engage with what they're learning. 
              To create your first quiz, you'll need text content from any educational source: lecture notes, textbooks, etc. You can provide up to 1,500 words. Providing more content gives the AI more context about what you're teaching.
            </Text>
            <Text>
              <b>Data privacy:</b> when you use Quizicist, we save all data from your interactions: the prompt, the content, and the generated quiz. If you use the Google Form export, we also save all form responses to evaluate the efficacy of Quizicist questions.
            </Text>
          </Stack>
        }
      />

      <Upload />

      <Divider className={styles.divider} />

      {generations?.length === 0 ?
        <Text fontSize="large" mb="1em">You don't have any quizzes</Text>
        :
        <CollapsibleAlert
          storageKey="first-quiz-tutorial"
          title="Editing your quizzes"
          content={
            <Text>
              Congratulations on generating your first quiz! Quizicist provides a few utilities to help prepare your quizzes for student use:
              <UnorderedList mt="5px">
                <ListItem>
                  <b>Custom questions:</b> If your quiz is missing important content, the custom question utility will use AI to generate potential answer choices for your handwritten questions.
                </ListItem>
                <ListItem>
                  <b>Generating more questions:</b> If you need more quiz questions, the "generate more questions" utility will add a custom number of AI-generated questions to your quiz.
                </ListItem>
                <ListItem>
                  <b>Export:</b> Once you're finished editing a quiz, the export utility will transfer your content to other tools like Google Forms and <Link href="https://github.com/willcrichton/mdbook-quiz" textDecoration="underline">mdbook-quiz</Link>.
                </ListItem>
              </UnorderedList>
            </Text>
          }
        />  
      }

      {generations?.map((g) => (
        <GenerationView key={g} generation_id={g} />
      ))}
    </>
  );
}

export default Dashboard;
