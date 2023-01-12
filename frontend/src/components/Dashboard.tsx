import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, CloseButton, Divider, Link, Text, useDisclosure } from "@chakra-ui/react";
import GenerationView from "@components/GenerationView";
import Upload from "@components/Upload";
import useGenerations from "@hooks/useGenerations";
import styles from "./Dashboard.module.css";

// retrieve whether help message should display from local storage
const HELP_MESSAGE_KEY = "quizicist:help-message-dismissed";
const helpMessageShouldOpen = () => {
  const stored = localStorage.getItem(HELP_MESSAGE_KEY);
  if (!stored) return true;

  return stored !== "1";
}

const Dashboard: React.FC = () => {
  const { isLoading, generations } = useGenerations();
  const { isOpen: isVisible, onClose } = useDisclosure({ defaultIsOpen: helpMessageShouldOpen() });

  const handleDismiss = () => {
    localStorage.setItem(HELP_MESSAGE_KEY, "1");
    onClose();
  }

  if (isLoading) {
    return <div>Loading generations...</div>;
  }

  return (
    <>
      {isVisible &&
        <Alert status="info" mb="2em">
          <Box>
            <AlertTitle>Welcome to Quizicist!</AlertTitle>
            <AlertDescription>
              Quizicist is an experimental, <Link href="https://github.com/connorff/quizicist" textDecoration="underline">open-source</Link> tool that uses AI to generate multiple-choice quizzes over educational material.
              To create your first quiz, complete the form below. Once your quiz is generated, you can remove questions you don't like, generate more questions with AI, and write custom questions.
              When you're happy with the quiz, please mark each answer choice as either incorrect or incorrect and then export the quiz using the "Export" button.

              By using Quizicist, you consent to <b>anonymous analysis of your quiz data and responses</b>.
            </AlertDescription>
          </Box>
          <CloseButton
            alignSelf='flex-start'
            position='relative'
            onClick={handleDismiss}
          />
        </Alert>  
      }

      <Upload />

      <Divider className={styles.divider} />

      {generations?.map((g) => (
        <GenerationView key={g} generation_id={g} />
      ))}

      {generations?.length === 0 && <Text fontSize="large" mb="1em">You don't have any quizzes</Text>}
    </>
  );
}

export default Dashboard;
