import smtpTester from "smtp-tester";

interface CustomNodeJsGlobal extends Global {
  mailServer: smtpTester.MailServer;
}

declare const global: CustomNodeJsGlobal;

if (global.mailServer) {
  global.mailServer.stop(() => {
    global.mailServer = smtpTester.init(587);
  });
} else {
  global.mailServer = smtpTester.init(587);
}

const mailServer = global.mailServer;

export const receiveEmail = async (email: string) => {
  return mailServer.captureOne(email, {
    wait: 1000,
  });
};

export const resetMailServer = () => {
  mailServer.removeAll();
};

export const stopMailServer = () => {
  mailServer.stop(() => {});
};

export default mailServer;
