import smtpTester from "smtp-tester";

const mailServer = smtpTester.init(587);

export const receiveEmail = async (email: string) => {
  return mailServer.captureOne(email, {
    wait: 1000,
  });
};

export const resetMailServer = () => {
  mailServer.removeAll();
};

export default mailServer;
