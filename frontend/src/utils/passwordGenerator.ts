export function generateRandomPassword(): string {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:",.<>?';

  // Function to get a random character from a string
  function getRandomChar(str: string): string {
    return str[Math.floor(Math.random() * str.length)];
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
