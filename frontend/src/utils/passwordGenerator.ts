export function generateRandomPassword(): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:",.<>?';

  function getRandomChar(str: string): string {
    // Generate a number between 0 and 1 like Math.random()
    const rand =
      crypto.getRandomValues(new Uint32Array(1))[0] * Math.pow(2, -32);

    return str[Math.floor(rand * str.length)];
  }

  // Ensure at least one character from each required set
  const password = [
    getRandomChar(uppercaseChars),
    getRandomChar(lowercaseChars),
    getRandomChar(numbers),
    getRandomChar(symbols),
  ];

  // Fill the rest of the password length with random characters from all sets combined
  const allChars = uppercaseChars + lowercaseChars + numbers + symbols;
  for (let i = password.length; i < 12; i++) {
    password.push(getRandomChar(allChars));
  }

  // Shuffle the password to ensure the required characters are not in predictable positions
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
