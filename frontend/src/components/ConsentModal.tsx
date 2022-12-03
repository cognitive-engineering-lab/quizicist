import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";

type ConsentModalProps = {
    handleAccept: () => Promise<void>;
};

const ConsentModal: React.FC<ConsentModalProps> = ({ handleAccept }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = async () => {
    setIsLoading(true);
    await handleAccept();
  }

  return (
    <Modal isOpen size="full" onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to Quizicist</ModalHeader>
        <ModalBody>
          By using Quizicist, you consent to anonymous storage and analysis of your quiz data.
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleClose} isLoading={isLoading}>Accept</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConsentModal;
