import "server-only";

// The answers. This file never reaches the browser: an answer is sent to the
// phones only after a host has unwrapped it (see lib/quiz-state.ts). The ids
// match the gift cards built in app/quiz-client.js.

export interface Answer {
  /** A small line above the answer: the song title, or the quote. */
  song?: string;
  text?: string;
  /** People to show with their photo from private/photos/<photo>.jpg. */
  people?: { name: string; photo: string }[];
}

export const ANSWERS: Record<string, Answer> = {
  // The teams, unwrapped one at a time at the start
  team0: {
    people: [
      { name: "Alexander Weidinger", photo: "alexander" },
      { name: "Mathilde Huss-Hansen", photo: "mathilde" },
      { name: "Jonas Blædel", photo: "jonas" },
      { name: "Naomi From", photo: "naomi" },
      { name: "Lucas Meyer", photo: "lucas" },
    ],
  },
  team1: {
    people: [
      { name: "Simon Olesen", photo: "simon" },
      { name: "Anastasija Vlasova", photo: "anastasija" },
      { name: "Kristinn Jonsson", photo: "kristinn" },
      { name: "Elizabeth Jakobsen", photo: "elizabeth" },
    ],
  },
  team2: {
    people: [
      { name: "Thea Thomsen", photo: "thea" },
      { name: "Emil Abrahamson", photo: "emil" },
      { name: "Andrea Hegner", photo: "andrea" },
      { name: "Johannes Hvitved", photo: "johannes" },
    ],
  },
  team3: {
    people: [
      { name: "Christian Dunbar", photo: "christian" },
      { name: "Magnus Madsen", photo: "magnus" },
      { name: "Federico Barbieri", photo: "federico" },
      { name: "Vince Libasci", photo: "vince" },
    ],
  },
  team4: {
    people: [
      { name: "Cecilie Geisler", photo: "cecilie" },
      { name: "Madeleine Madsen", photo: "madeleine" },
      { name: "David Stenersen", photo: "david" },
      { name: "Emilie Jørgensen", photo: "emilie" },
      { name: "Lýður Hafsteinsson", photo: "lydur" },
    ],
  },
  // Round 2, crime scene 1
  "c0-0": { song: "Boten Anna", text: "Anna" },
  "c0-1": { song: "Viva Las Vegas", text: "Las Vegas" },
  "c0-2": { song: "T.N.T. by AC/DC", text: "A bomb" },
  "c0-3": { song: "Disco Tits", text: "Disco tits" },
  // Round 2, crime scene 2
  "c1-0": { song: "Hvalen Hvalborg", text: "Hvalen Hvalborg" },
  "c1-1": { song: "Murder on the Dancefloor", text: "The dance floor" },
  "c1-2": { song: "Umbrella", text: "An umbrella" },
  "c1-3": { song: "Klunker", text: "Klunker" },
  // Round 3, who is this?
  who0: { people: [{ name: "Jonas", photo: "jonas" }] },
  who1: { people: [{ name: "Thea", photo: "thea" }] },
  who2: { people: [{ name: "Simon", photo: "simon" }] },
  who3: { people: [{ name: "Johannes", photo: "johannes" }] },
  who4: { people: [{ name: "Lýður", photo: "lydur" }] },
  // Round 3, roast the team
  roast: {
    people: [
      { name: "Christian Dunbar", photo: "christian" },
      { name: "Magnus Madsen", photo: "magnus" },
      { name: "Federico Barbieri", photo: "federico" },
      { name: "Vince Libasci", photo: "vince" },
    ],
  },
  // Round 5, Simon says
  q0: { people: [{ name: "Clara", photo: "clara" }] },
  q1: { people: [{ name: "Magnus", photo: "magnus" }] },
  q2: { people: [{ name: "Cecilie", photo: "cecilie" }] },
  q3: { people: [{ name: "Simon", photo: "simon" }] },
  q4: { people: [{ name: "Christian", photo: "christian" }] },
};
