export function uniqueName(name: string, others: string[]): string {
  let count = 1;
  let uniqueName = name;

  while (others.includes(uniqueName)) {
    // If it does, append the count and increment the count
    uniqueName = `${name}_${count}`;
    count++;
  }

  return uniqueName;
}
