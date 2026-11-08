// Stoic quotes from public-domain translations:
// Marcus Aurelius, Meditations (George Long, 1862); Seneca, Moral Letters (R. M. Gummere, 1917);
// Epictetus, Discourses and Enchiridion (George Long, 1877; T. W. Higginson, 1865).
const M = 'Marcus Aurelius';
const S = 'Seneca';
const E = 'Epictetus';

export const QUOTES = [
  { text: 'First say to yourself what you would be; and then do what you have to do.', author: E },
  { text: 'Every habit and faculty is maintained and increased by the corresponding actions.', author: E },
  { text: 'It is difficulties which show what men are.', author: E },
  { text: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.', author: E },
  { text: 'Men are disturbed not by the things which happen, but by the opinions about the things.', author: E },
  { text: 'If you would be a good reader, read; if a writer, write.', author: E },
  { text: 'Of things some are in our power, and others are not.', author: E },
  { text: 'In the morning when thou risest unwillingly, let this thought be present: I am rising to the work of a human being.', author: M },
  { text: 'No longer talk at all about the kind of man that a good man ought to be, but be such.', author: M },
  { text: 'Do not act as if thou wert going to live ten thousand years. While thou livest, while it is in thy power, be good.', author: M },
  { text: 'Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.', author: M },
  { text: 'Be like the promontory against which the waves continually break, but it stands firm.', author: M },
  { text: 'That which is an obstacle on the road helps us on this road.', author: M },
  { text: 'If it is not right, do not do it: if it is not true, do not say it.', author: M },
  { text: 'Do every act of thy life as if it were the last.', author: M },
  { text: 'The best way of avenging thyself is not to become like the wrong doer.', author: M },
  { text: 'Confine thyself to the present.', author: M },
  { text: 'Loss is nothing else but change.', author: M },
  { text: 'Men exist for the sake of one another. Teach them then or bear with them.', author: M },
  { text: 'How much trouble he avoids who does not look to see what his neighbour says or does or thinks, but only to what he does himself.', author: M },
  { text: 'While we are postponing, life speeds by.', author: S },
  { text: "Hold every hour in your grasp. Lay hold of to-day's task, and you will not need to depend so much upon to-morrow's.", author: S },
  { text: 'Begin at once to live, and count each separate day as a separate life.', author: S },
  { text: 'It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.', author: S },
  { text: 'We suffer more often in imagination than in reality.', author: S },
  { text: 'Associate with those who will make a better man of you.', author: S },
  { text: "Nothing is a better proof of a well ordered mind than a man's ability to stop just where he is and pass some time in his own company.", author: S },
];

// Stable per day: a small string hash of the day key.
export function pickForDay(list, key) {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}
