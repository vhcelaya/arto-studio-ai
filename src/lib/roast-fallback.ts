import type { RoastResult } from "./roast-types";

export function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export const strategyRoasts = [
  "Your positioning says 'we do everything for everyone.' Translation: you stand for nothing.",
  "You're competing on features when the market already moved to competing on culture. Classic.",
  "Your brand strategy reads like a corporate Mad Libs. Insert [buzzword], add [synergy], serve lukewarm.",
  "No tension, no point of view, no cultural relevance. Your strategy is a room-temperature glass of water.",
  "You have a mission statement, not a strategy. There's a difference — and your customers can tell.",
  "Your positioning could belong to any of your 12 competitors. That's not a strategy, that's camouflage.",
  "You're playing it safe in a market that rewards boldness. Beige is not a brand strategy.",
  "Your target audience is 'everyone 18-65.' That's not targeting, that's hoping.",
];

export const creativityRoasts = [
  "Your visual identity looks like it was designed by committee — because it probably was.",
  "Stock photos, blue gradients, and a sans-serif logo. Welcome to 2015, population: too many brands.",
  "Your brand looks like every other brand in your category. If I blur my eyes, you literally disappear.",
  "There's 'clean design' and then there's 'we had no creative direction.' Guess which one this is.",
  "Your color palette says 'trustworthy and reliable.' So does every bank, insurance company, and toothpaste brand.",
  "The anti-polish movement is here and you're still trying to look like a Fortune 500 annual report.",
  "Your creative direction is 'professional.' That's not a direction, that's the absence of one.",
  "Minimalism works when there's substance underneath. Right now it's just... minimum.",
];

export const narrativeRoasts = [
  "Your brand talks about itself in every sentence. Your customer is the hero, not you. Read that again.",
  "Your copy reads like a press release from 2008. 'We're proud to announce' — nobody is proud reading this.",
  "'Innovative solutions for modern challenges.' I've seen this exact line on 47 websites today.",
  "Your brand story starts with your founding year. Nobody cares. Start with the customer's problem.",
  "You tell people you're great instead of showing them. That's not narrative, that's a LinkedIn humble-brag.",
  "Your brand voice is 'corporate warm.' That's like 'military jazz' — two things that cancel each other out.",
  "There's no tension in your story. No conflict, no stakes, no reason to care. It's a bedtime story — literally.",
  "Your tagline could be an AI-generated placeholder. Actually, it might be worse than one.",
];

export const digitalRoasts = [
  "Your social media strategy is 'post three times a week and pray.' That's not a strategy, that's a ritual.",
  "You have 10K followers and 3 likes per post. That's not a community, that's a ghost town with bots.",
  "Your SEO strategy is non-existent. Page 5 of Google is basically witness protection.",
  "You're still thinking 'audience' when the market moved to 'community.' Broadcasting to nobody who cares.",
  "Your content calendar is just holidays and product launches. Where's the cultural conversation?",
  "Your website loads like it's powered by a hamster wheel. Speed is a ranking factor — and a respect factor.",
  "You treat social media like a megaphone when it should be a conversation. No wonder nobody's responding.",
  "Your digital presence is scattered across 7 platforms doing nothing well. Pick 2 and actually show up.",
];

export const verdicts = [
  "Your brand isn't broken — it's just invisible. The raw material is there, but nobody can see it through the generic positioning.",
  "Honest truth: your brand has potential, but right now it's playing dress-up in someone else's clothes. Time to find your own voice.",
  "You're not terrible — you're forgettable. And in marketing, forgettable is worse than terrible. At least terrible gets talked about.",
  "Your brand is doing the marketing equivalent of mumbling. Speak up, take a stand, or get drowned out.",
  "There's a real brand buried under layers of corporate caution. The question is: are you brave enough to let it out?",
  "You're one bold decision away from being interesting. Right now you're three safe decisions deep into boring.",
  "Your brand has the personality of a default settings page. Factory reset and start with intention this time.",
  "Not hopeless — just directionless. With the right strategy, this could actually become something people remember.",
];

export const improvementPool = [
  "Define a real positioning that your competitors can't copy — something only YOU can own.",
  "Kill the corporate speak. Write like a human talking to another human.",
  "Find your cultural tension — what conversation can your brand lead that nobody else is leading?",
  "Stop trying to appeal to everyone. Pick your tribe and speak directly to them.",
  "Invest in a visual identity that actually reflects your brand's personality, not your industry's defaults.",
  "Build community, not audience. Create spaces where your customers talk to each other, not just listen to you.",
  "Create a content strategy based on cultural relevance, not just product features.",
  "Make your customer the hero of every story you tell. Your brand is the guide, not the protagonist.",
  "Audit your digital presence — consolidate platforms and go deep instead of wide.",
  "Develop a brand voice guide that your team actually uses, not one that sits in a Google Drive folder.",
  "Stop chasing trends and start setting them. Your brand should lead conversations, not follow them.",
  "Align your visual identity with the anti-polish movement — authentic beats perfect in 2026.",
];

export function generateDeterministicRoast(
  brandName: string,
  industry: string,
  description: string
): RoastResult {
  const seed = hash(
    brandName.toLowerCase() + industry.toLowerCase() + description.toLowerCase()
  );

  const strategyScore = 3 + (seed % 5); // 3-7
  const creativityScore = 2 + ((seed >> 3) % 6); // 2-7
  const narrativeScore = 3 + ((seed >> 6) % 5); // 3-7
  const digitalScore = 2 + ((seed >> 9) % 6); // 2-7

  const overall =
    strategyScore * 0.3 +
    creativityScore * 0.25 +
    narrativeScore * 0.25 +
    digitalScore * 0.2;

  const s2 = hash(brandName + industry);
  const improvements = [
    pick(improvementPool, seed),
    pick(improvementPool, seed + 3),
    pick(improvementPool, seed + 7),
  ];
  const uniqueImprovements = [...new Set(improvements)];
  while (uniqueImprovements.length < 3) {
    uniqueImprovements.push(
      pick(improvementPool, seed + uniqueImprovements.length + 10)
    );
  }

  return {
    overall: Math.round(overall * 10) / 10,
    strategy: { score: strategyScore, roast: pick(strategyRoasts, seed) },
    creativity: {
      score: creativityScore,
      roast: pick(creativityRoasts, seed >> 2),
    },
    narrative: {
      score: narrativeScore,
      roast: pick(narrativeRoasts, seed >> 4),
    },
    digital: { score: digitalScore, roast: pick(digitalRoasts, s2) },
    verdict: pick(verdicts, seed >> 1),
    improvements: uniqueImprovements.slice(0, 3),
  };
}
