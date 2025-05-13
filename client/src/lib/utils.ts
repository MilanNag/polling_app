import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random username with format "User" + random adjective + random noun
export function generateRandomUsername(): string {
  const adjectives = [
    "Happy", "Brave", "Clever", "Swift", "Proud", "Bold", "Calm", "Kind",
    "Wise", "Eager", "Keen", "Merry", "Noble", "Quick", "Witty", "Jolly"
  ];
  
  const nouns = [
    "Tiger", "Eagle", "Hawk", "Lion", "Wolf", "Bear", "Fox", "Deer",
    "Panda", "Otter", "Owl", "Lynx", "Koala", "Whale", "Shark", "Dolphin"
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${randomAdjective}${randomNoun}`;
}

// Get the initials from a username (first two characters or first characters of each word)
export function getUserInitials(username: string): string {
  if (!username) return "";
  
  // If username has multiple words, take first character of each word
  if (username.includes(" ")) {
    return username
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }
  
  // For single word or camelCase, take first two characters
  const matches = username.match(/[A-Z]/g);
  if (matches && matches.length >= 2) {
    return matches.slice(0, 2).join("");
  }
  
  return username.substring(0, 2).toUpperCase();
}
