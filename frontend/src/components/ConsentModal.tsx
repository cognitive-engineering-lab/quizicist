import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import LoadingButton from "./buttons/LoadingButton";

type ConsentModalProps = {
  handleAccept: () => Promise<void>;
};

const ConsentModal: React.FC<ConsentModalProps> = ({ handleAccept }) => {
  return (
    <Modal isOpen size="full" onClose={handleAccept}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Welcome to Quizicist</ModalHeader>
        <ModalBody>
          By using Quizicist, you consent to anonymous storage and analysis of your quiz data.
        </ModalBody>
        <ModalFooter>
          <LoadingButton loadingFunction={handleAccept}>Accept</LoadingButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConsentModal;
